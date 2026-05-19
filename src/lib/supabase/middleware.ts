import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Match cookie domain dengan server.ts & client.ts supaya PKCE verifier dan
 * session cookie share antara apex + www.
 */
function resolveCookieDomain(request: NextRequest): string | undefined {
  const envDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;
  if (envDomain) return envDomain;
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0].trim() ||
    request.headers.get("host") ||
    "";
  if (!host || host.startsWith("localhost") || host.startsWith("127.")) {
    return undefined;
  }
  const bareHost = host.split(":")[0];
  const parts = bareHost.split(".");
  if (parts.length >= 2) {
    return `.${parts.slice(-2).join(".")}`;
  }
  return undefined;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { supabaseResponse, user: null };
  }

  const cookieDomain = resolveCookieDomain(request);

  const supabase = createServerClient(
    url,
    key,
    {
      cookieOptions: {
        domain: cookieDomain,
        sameSite: "lax",
        secure: !!cookieDomain,
        path: "/",
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}
