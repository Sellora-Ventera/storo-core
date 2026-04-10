import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const popup = searchParams.get("popup");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // If opened in a popup, close it and notify parent
      if (popup === "true") {
        return new NextResponse(
          `<!DOCTYPE html><html><body><script>
            window.opener?.postMessage({ type: "AUTH_COMPLETE" }, window.location.origin);
            window.close();
          </script><p>Login berhasil. Menutup jendela...</p></body></html>`,
          { headers: { "Content-Type": "text/html" } }
        );
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  if (popup === "true") {
    return new NextResponse(
      `<!DOCTYPE html><html><body><script>
        window.opener?.postMessage({ type: "AUTH_FAILED" }, window.location.origin);
        window.close();
      </script><p>Login gagal. Menutup jendela...</p></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  // Fallback — redirect to sign-in on error
  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`);
}
