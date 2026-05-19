import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Diagnostic endpoint untuk verify Sharelink integration di prod.
 *
 * GET /api/internal/sharelink-health
 *
 * Returns:
 *   - env var presence (boolean, no values leaked)
 *   - actual ping result ke Sharelink endpoint (using configured env)
 *
 * No auth — only reveals env presence (yes/no), bukan nilai actual. Aman
 * untuk dipakai sebagai smoke test setelah deploy. Hapus endpoint ini
 * kalau sudah confirmed signup event consistently fire.
 *
 * Cara pakai:
 *   curl https://storo.id/api/internal/sharelink-health
 *
 * Output:
 *   { envBaseUrl: true, envSecretKey: true, ping: { ok: true, status: 200 } }
 */
export async function GET() {
  const envBaseUrl = Boolean(process.env.SHARELINK_BASE_URL);
  const envSecretKey = Boolean(process.env.SHARELINK_SECRET_KEY);
  const envTenantId = Boolean(process.env.SHARELINK_TENANT_ID);
  // Xendit webhook token — required by /api/webhooks/xendit handler.
  // Missing this in prod → Xendit webhook callback gets 401 "Unauthorized".
  const envXenditWebhookToken = Boolean(process.env.XENDIT_WEBHOOK_TOKEN);

  const result: {
    envBaseUrl: boolean;
    envSecretKey: boolean;
    envTenantId: boolean;
    envXenditWebhookToken: boolean;
    ping?: {
      ok: boolean;
      status?: number;
      error?: string;
      body?: unknown;
    };
  } = { envBaseUrl, envSecretKey, envTenantId, envXenditWebhookToken };

  if (!envBaseUrl || !envSecretKey) {
    result.ping = {
      ok: false,
      error: "skipped — required env var missing",
    };
    return NextResponse.json(result);
  }

  // Verify Sharelink reachability + auth via the GET /api/v1/referrals
  // endpoint (lightweight, requires auth, no side effects).
  try {
    const url = `${(process.env.SHARELINK_BASE_URL as string).replace(/\/+$/, "")}/api/v1/referrals?limit=1`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.SHARELINK_SECRET_KEY}`,
      },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });

    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // non-JSON
    }

    result.ping = {
      ok: res.ok,
      status: res.status,
      ...(res.ok ? {} : { body }),
    };
  } catch (err) {
    result.ping = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return NextResponse.json(result);
}
