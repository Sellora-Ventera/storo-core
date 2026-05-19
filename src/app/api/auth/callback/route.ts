import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const popup = searchParams.get("popup");

  // Di belakang Apache reverse proxy, request.url pakai socket lokal Next.js
  // (localhost:3000) bukan host asli. Construct origin dari forwarded headers.
  // Headers bisa di-append jadi "host1, host2" oleh proxy chain (Cloudflare → Apache),
  // jadi ambil nilai pertama saja.
  const firstValue = (h: string | null) => h?.split(",")[0].trim() || null;
  const forwardedHost = firstValue(request.headers.get("x-forwarded-host"));
  const forwardedProto = firstValue(request.headers.get("x-forwarded-proto"));
  const host = forwardedHost || request.headers.get("host") || "storo.id";
  const proto = forwardedProto || (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  // Surface OAuth provider errors directly (?error=access_denied etc. from
  // Supabase/Google). Tanpa ini, user lihat generic "auth_callback_failed"
  // padahal sebenarnya provider belum di-enable atau Redirect URL belum
  // di-whitelist di Supabase Dashboard.
  const providerError = searchParams.get("error");
  const providerErrorDesc = searchParams.get("error_description");

  let exchangeError: string | null = null;
  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (popup === "true") {
        // Try postMessage + close; fallback redirect after 500ms
        return new NextResponse(
          `<!DOCTYPE html><html><body><script>
            (function() {
              var sent = false;
              if (window.opener) {
                try {
                  window.opener.postMessage({ type: "AUTH_COMPLETE" }, window.location.origin);
                  sent = true;
                  window.close();
                } catch(e) {}
              }
              // If close didn't work or no opener, redirect back
              setTimeout(function() {
                window.location.href = "/onboarding?step=5";
              }, sent ? 500 : 0);
            })();
          </script><p>Login berhasil. Mengalihkan...</p></body></html>`,
          { headers: { "Content-Type": "text/html" } }
        );
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
    exchangeError = error.message;
    console.warn("[auth/callback] exchangeCodeForSession failed:", error.message);
  }

  if (popup === "true") {
    return new NextResponse(
      `<!DOCTYPE html><html><body><script>
        if (window.opener) {
          try {
            window.opener.postMessage({ type: "AUTH_FAILED" }, window.location.origin);
            window.close();
          } catch(e) {}
        }
        setTimeout(function() {
          window.location.href = "/onboarding?step=4";
        }, 300);
      </script><p>Login gagal. Mengalihkan...</p></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  // Fallback — redirect to sign-in dengan detail error kalau ada.
  // Kalau muncul "auth_callback_failed" tanpa reason, biasanya:
  //   - Google provider belum di-enable di Supabase Dashboard
  //   - Site URL / Redirect URL allowlist di Supabase belum include host ini
  //   - Authorized redirect URI di Google Cloud Console belum cocok
  const fallbackUrl = new URL("/sign-in", origin);
  fallbackUrl.searchParams.set("error", "auth_callback_failed");
  if (providerError) {
    fallbackUrl.searchParams.set("reason", providerError);
    if (providerErrorDesc) {
      fallbackUrl.searchParams.set("reason_desc", providerErrorDesc.slice(0, 200));
    }
  } else if (exchangeError) {
    fallbackUrl.searchParams.set("reason", "exchange_failed");
    fallbackUrl.searchParams.set("reason_desc", exchangeError.slice(0, 200));
  } else if (!code) {
    fallbackUrl.searchParams.set("reason", "missing_code");
  }
  return NextResponse.redirect(fallbackUrl);
}
