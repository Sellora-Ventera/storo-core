import { type NextRequest, NextResponse } from "next/server";
import * as client from "openid-client";
import { getOidcConfig } from "@/lib/sso/config";
import { readStateCookie, clearStateCookie } from "@/lib/sso/state-cookie";
import { syncSsoUserToSupabase } from "@/lib/sso/sync";
import { mintSupabaseSession } from "@/lib/sso/session";

function redirectToSignIn(req: NextRequest, error: string, reason?: string) {
  const url = new URL("/sign-in", req.url);
  url.searchParams.set("error", error);
  if (reason) url.searchParams.set("reason", reason.slice(0, 200));
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const stateCookie = readStateCookie(req);
  if (!stateCookie) {
    return redirectToSignIn(req, "sso_state_missing");
  }

  const providerError = req.nextUrl.searchParams.get("error");
  if (providerError) {
    const desc = req.nextUrl.searchParams.get("error_description") ?? undefined;
    return redirectToSignIn(req, "sso_provider_error", `${providerError}: ${desc ?? ""}`);
  }

  let tokens;
  try {
    const config = await getOidcConfig();
    tokens = await client.authorizationCodeGrant(config, new URL(req.url), {
      pkceCodeVerifier: stateCookie.codeVerifier,
      expectedState: stateCookie.state,
    });
  } catch (e) {
    // openid-client v6 throws ResponseBodyError with .error/.error_description
    // when the token endpoint returns 4xx. Surface the IdP's actual payload so
    // misconfigs (bad client_secret, redirect_uri mismatch, PKCE) are visible
    // instead of a generic message.
    const err = e as {
      message?: string;
      error?: string;
      error_description?: string;
      code?: string;
      cause?: unknown;
    };
    const parts = [
      err.error,
      err.error_description,
      err.message,
      err.code,
      err.cause ? String(err.cause) : undefined,
    ].filter(Boolean);
    const reason = parts.join(" | ") || "unknown";
    console.error("[SSO] token exchange failed:", {
      error: err.error,
      error_description: err.error_description,
      message: err.message,
      code: err.code,
      cause: err.cause,
    });
    return redirectToSignIn(req, "sso_exchange_failed", reason);
  }

  const claims = tokens.claims();
  if (!claims || typeof claims.sub !== "string" || typeof claims.email !== "string") {
    return redirectToSignIn(req, "sso_missing_claims");
  }

  try {
    await syncSsoUserToSupabase({
      sub: claims.sub,
      email: claims.email,
      name: typeof claims.name === "string" ? claims.name : undefined,
      phone_number:
        typeof claims.phone_number === "string" ? claims.phone_number : undefined,
      realm: typeof claims.realm === "string" ? claims.realm : undefined,
    });
    await mintSupabaseSession(claims.email);
  } catch (e) {
    return redirectToSignIn(req, "sso_sync_failed", String(e));
  }

  const target = new URL(stateCookie.next, req.url);
  if (stateCookie.draftId) {
    target.searchParams.set("resume", stateCookie.draftId);
  }
  const res = NextResponse.redirect(target);
  clearStateCookie(res);
  return res;
}
