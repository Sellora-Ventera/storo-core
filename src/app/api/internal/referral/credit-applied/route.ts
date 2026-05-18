import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { creditWallet, ensureWallet } from "@/lib/wallet";

export const dynamic = "force-dynamic";

/**
 * HMAC-protected callback dari Sharelink saat reward `credit` di-distribute
 * via connector tipe `webhook` ("Storo Credit Webhook").
 *
 * Payload (dari WebhookConnector.distributeReward()):
 *   {
 *     action: "distribute_reward",
 *     reward: {
 *       rewardId, recipientId, recipientType, rewardType,
 *       amount, currency, metadata
 *     },
 *     timestamp: "<ISO>"
 *   }
 *
 * Signature header: `X-MRS-Signature: <hex sha256>`.
 *
 * Behavior:
 *   - Verify HMAC pakai SHARELINK_INBOUND_HMAC_SECRET.
 *   - Resolve recipient → clients.user_id → stores (first) → call wallet_credit.
 *   - Idempotent via reference_id = rewardId; kalau wallet_transactions sudah
 *     punya row dengan reference_id sama, skip (Sharelink retry-safe).
 *   - Kalau merchant belum punya store, log + ack 200 supaya Sharelink tetap
 *     mark reward distributed (uang sudah dicatat di Sharelink, balance tinggal
 *     dibuat saat user pertama bikin store — handler ulang manual nanti).
 */
export async function POST(request: NextRequest) {
  const secret = process.env.SHARELINK_INBOUND_HMAC_SECRET;
  if (!secret) {
    console.warn("[credit-applied] SHARELINK_INBOUND_HMAC_SECRET not set");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const sigHeader =
    request.headers.get("x-mrs-signature") ??
    request.headers.get("x-webhook-signature");
  if (!sigHeader) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const received = sigHeader.startsWith("sha256=") ? sigHeader.slice(7) : sigHeader;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

  let valid = false;
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(received, "hex");
    valid = a.length === b.length && timingSafeEqual(a, b);
  } catch {
    valid = false;
  }

  if (!valid) {
    console.warn("[credit-applied] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: {
    action?: string;
    reward?: {
      rewardId: string;
      recipientId: string;
      recipientType: string;
      rewardType: string;
      amount: number | null;
      currency: string;
      metadata?: Record<string, unknown>;
    };
    timestamp?: string;
  };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.action !== "distribute_reward" || !body.reward) {
    // Other webhook actions (event triggers etc.) — ignore but ack so Sharelink
    // doesn't retry forever.
    return NextResponse.json({ ok: true, applied: false, note: "Unhandled action" });
  }

  const { rewardId, recipientId, rewardType, metadata } = body.reward;

  if (rewardType !== "credit") {
    return NextResponse.json({ ok: true, applied: false, note: `Skipped: rewardType=${rewardType}` });
  }

  // Amount falls back to metadata.calculation_config.flat.amount because
  // mrs_rewards.amount is null at insert (sharelink pipeline.ts:234 doesn't
  // compute the resolved amount before insert).
  const calcCfg = metadata?.calculation_config as { flat?: { amount?: unknown } } | undefined;
  const flatAmount = calcCfg?.flat?.amount;
  const amount =
    typeof body.reward.amount === "number" && Number.isFinite(body.reward.amount)
      ? body.reward.amount
      : typeof flatAmount === "number" && Number.isFinite(flatAmount)
        ? flatAmount
        : null;

  if (amount === null || amount <= 0) {
    console.warn("[credit-applied] Could not resolve amount for reward", rewardId, body.reward);
    return NextResponse.json({ ok: true, applied: false, note: "Amount not resolvable" });
  }

  const supabase = await createSupabaseServiceClient();

  // Idempotency: kalau row dengan reference_id = rewardId sudah ada di
  // wallet_transactions, ack tanpa double-credit.
  const { data: existingTx } = await supabase
    .from("wallet_transactions")
    .select("id, store_id, balance_after")
    .eq("reference_id", rewardId)
    .maybeSingle();

  if (existingTx) {
    return NextResponse.json({
      ok: true,
      applied: true,
      idempotent: true,
      storeId: existingTx.store_id,
      newBalance: existingTx.balance_after,
    });
  }

  // Resolve merchant → first store
  const { data: client, error: clientErr } = await supabase
    .from("clients")
    .select("id, user_id")
    .eq("user_id", recipientId)
    .maybeSingle();

  if (clientErr) {
    console.error("[credit-applied] clients lookup failed:", clientErr.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
  if (!client) {
    console.warn("[credit-applied] No clients row for recipient", recipientId);
    return NextResponse.json({
      ok: true,
      applied: false,
      note: "No clients row for recipient — credit logged at Sharelink only",
    });
  }

  const { data: stores, error: storesErr } = await supabase
    .from("stores")
    .select("id")
    .eq("client_id", client.id)
    .order("created_at", { ascending: true })
    .limit(1);

  if (storesErr) {
    console.error("[credit-applied] stores lookup failed:", storesErr.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
  if (!stores || stores.length === 0) {
    console.warn("[credit-applied] No stores for client", client.id, "recipient", recipientId);
    return NextResponse.json({
      ok: true,
      applied: false,
      note: "Merchant has no store yet — credit logged at Sharelink only",
    });
  }

  const storeId = stores[0].id;

  try {
    await ensureWallet(storeId);
    const newBalance = await creditWallet(storeId, amount, "adjustment", {
      description: "Referral reward (Sharelink)",
      referenceId: rewardId,
    });
    console.log("[credit-applied] Credited", amount, "to store", storeId, "rewardId", rewardId);
    return NextResponse.json({
      ok: true,
      applied: true,
      storeId,
      newBalance,
    });
  } catch (err) {
    console.error("[credit-applied] wallet_credit failed:", err);
    return NextResponse.json({ error: "Wallet credit failed" }, { status: 500 });
  }
}
