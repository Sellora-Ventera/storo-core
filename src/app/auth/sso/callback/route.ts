import { type NextRequest, NextResponse } from "next/server";
import * as client from "openid-client";
import { getOidcConfig, SSO_REDIRECT_URI } from "@/lib/sso/config";
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
    // Pass redirect_uri explicitly via tokenEndpointParameters so the value
    // sent in the token POST matches SSO_REDIRECT_URI used during the
    // authorization request byte-for-byte. openid-client v6 derives it from
    // currentUrl by default, but req.url can carry a forwarded host on some
    // platforms or differ subtly (trailing slash, host case) — and per
    // RFC 6749 §4.1.3 a mismatch triggers invalid_grant.
    tokens = await client.authorizationCodeGrant(
      config,
      new URL(req.url),
      {
        pkceCodeVerifier: stateCookie.codeVerifier,
        expectedState: stateCookie.state,
      },
      { redirect_uri: SSO_REDIRECT_URI },
    );
  } catch (e) {
    // openid-client v6 throws ResponseBodyError with .error/.error_description
    // when the token endpoint returns 4xx. .cause is the parsed JSON body —
    // serialize explicitly because String(obj) gives "[object Object]" and
    // hides the actual IdP-side reason (e.g. "code_verifier mismatch").
    const err = e as {
      message?: string;
      error?: string;
      error_description?: string;
      code?: string;
      status?: number;
      cause?: unknown;
    };
    const causeStr = (() => {
      if (!err.cause) return undefined;
      if (typeof err.cause === "string") return err.cause;
      try {
        return JSON.stringify(err.cause);
      } catch {
        return Object.prototype.toString.call(err.cause);
      }
    })();
    const parts = [
      err.error,
      err.error_description,
      err.message,
      err.code,
      err.status ? `status=${err.status}` : undefined,
      causeStr,
    ].filter(Boolean);
    const reason = parts.join(" | ") || "unknown";
    console.error("[SSO] token exchange failed", {
      error: err.error,
      error_description: err.error_description,
      message: err.message,
      code: err.code,
      status: err.status,
      cause: err.cause,
      requestUrl: req.url,
      hasCodeVerifier: Boolean(stateCookie.codeVerifier),
      hasState: Boolean(stateCookie.state),
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
