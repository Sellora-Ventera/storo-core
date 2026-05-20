import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";

export const SSO_STATE_COOKIE = "sso_state";
const TTL_MS = 10 * 60 * 1000;

function getSecret(): string {
  const s = process.env.SSO_STATE_SECRET;
  if (!s) throw new Error("SSO_STATE_SECRET is not set");
  return s;
}

export type SsoStatePayload = {
  state: string;
  codeVerifier: string;
  next: string;
  draftId?: string;
};

type SignedPayload = SsoStatePayload & { iat: number };

function base64UrlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

export function signStateCookie(payload: SsoStatePayload): string {
  const body: SignedPayload = { ...payload, iat: Date.now() };
  const json = JSON.stringify(body);
  const data = base64UrlEncode(Buffer.from(json, "utf8"));
  const sig = base64UrlEncode(
    crypto.createHmac("sha256", getSecret()).update(data).digest(),
  );
  return `${data}.${sig}`;
}

export function verifyStateCookie(raw: string | null | undefined): SsoStatePayload | null {
  if (!raw) return null;
  const dot = raw.indexOf(".");
  if (dot < 0) return null;
  const data = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);

  const expected = base64UrlEncode(
    crypto.createHmac("sha256", getSecret()).update(data).digest(),
  );
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;

  let parsed: SignedPayload;
  try {
    parsed = JSON.parse(base64UrlDecode(data).toString("utf8")) as SignedPayload;
  } catch {
    return null;
  }
  if (!parsed.iat || Date.now() - parsed.iat > TTL_MS) return null;
  if (!parsed.state || !parsed.codeVerifier || !parsed.next) return null;

  return {
    state: parsed.state,
    codeVerifier: parsed.codeVerifier,
    next: parsed.next,
    draftId: parsed.draftId,
  };
}

export function readStateCookie(req: NextRequest): SsoStatePayload | null {
  return verifyStateCookie(req.cookies.get(SSO_STATE_COOKIE)?.value);
}

export function clearStateCookie(res: NextResponse): void {
  res.cookies.set(SSO_STATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}
