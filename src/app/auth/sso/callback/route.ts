import { type NextRequest, NextResponse } from "next/server";
import * as client from "openid-client";
import { APP_ORIGIN, getOidcConfig, SSO_REDIRECT_URI } from "@/lib/sso/config";
import { readStateCookie, clearStateCookie } from "@/lib/sso/state-cookie";
import { syncSsoUserToSupabase } from "@/lib/sso/sync";
import { mintSupabaseSession } from "@/lib/sso/session";

function redirectToSignIn(_req: NextRequest, error: string, reason?: string) {
  const url = new URL("/sign-in", APP_ORIGIN);
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

  // Build the "currentUrl" passed to openid-client from SSO_REDIRECT_URI
  // (the value sent to the IdP at auth time) plus the query string from the
  // incoming request. openid-client v6 derives the token request's
  // redirect_uri from currentUrl.origin+pathname — using SSO_REDIRECT_URI
  // here guarantees it matches the auth request byte-for-byte even when
  // req.url comes back wrong (e.g. proxy didn't forward X-Forwarded-Host
  // and Next.js sees Host: localhost:3000 in production).
  //
  // Passing redirect_uri via tokenEndpointParameters appends rather than
  // overrides, so two redirect_uri params end up in the body — which
  // node-oidc-provider rejects as invalid_grant.
  const incoming = new URL(req.url);
  const currentUrl = new URL(SSO_REDIRECT_URI);
  incoming.searchParams.forEach((value, key) => {
    currentUrl.searchParams.set(key, value);
  });

  let tokens;
  try {
    const config = await getOidcConfig();
    tokens = await client.authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: stateCookie.codeVerifier,
      expectedState: stateCookie.state,
    });
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
      currentUrlSentToTokenEndpoint: currentUrl.toString(),
      ssoRedirectUri: SSO_REDIRECT_URI,
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

  const target = new URL(stateCookie.next, APP_ORIGIN);
  if (stateCookie.draftId) {
    target.searchParams.set("resume", stateCookie.draftId);
  }
  const res = NextResponse.redirect(target);
  clearStateCookie(res);
  return res;
}
