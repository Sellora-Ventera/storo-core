import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PREFIXES = ["/dashboard", "/superadmin"];
const AUTH_PAGES = ["/sign-in", "/sign-up"];

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // OAuth code forwarder. Supabase Auth sometimes redirects back to the Site URL
  // (https://storo.id/?code=...) instead of the redirectTo we pass — happens
  // when /auth/callback isn't in the "Redirect URLs" allowlist. Forward to the
  // callback route so the code gets exchanged for a session.
  //
  // Excluding /api/* is critical: several internal endpoints legitimately use
  // `?code=<referral_code>` as a query param (e.g. /api/referral/preview-discount).
  // Without this exclusion they get 307-redirected to /auth/callback and never
  // execute — silently breaking discount preview UI.
  const code = searchParams.get("code");
  if (
    code &&
    !pathname.startsWith("/auth/callback") &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/payment/") // payment/* uses its own ?code-like params
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    if (!url.searchParams.get("next")) {
      url.searchParams.set("next", "/dashboard");
    }
    return NextResponse.redirect(url);
  }

  // Referral landing: set storo_referral_code cookie here. Next.js 15 melarang
  // cookies().set() di Server Component, jadi tidak bisa di-set dari
  // src/app/r/[code]/page.tsx — harus lewat middleware atau Route Handler.
  const referralMatch = pathname.match(/^\/r\/([^/]+)/);
  if (referralMatch) {
    const refCode = referralMatch[1];
    const res = NextResponse.next();
    if (refCode && refCode.length <= 50) {
      res.cookies.set("storo_referral_code", refCode, {
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
        sameSite: "lax",
      });
    }
    return res;
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  // Public routes don't need a Supabase session — skip entirely
  if (!isProtected && !isAuthPage) {
    return NextResponse.next();
  }

  const { supabaseResponse, user } = await updateSession(request);

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
