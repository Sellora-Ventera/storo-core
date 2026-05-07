import { NextRequest, NextResponse } from "next/server";
import { creditWallet } from "@/lib/wallet";

export const dynamic = "force-dynamic";

/**
 * Xendit callback for wallet top-up invoices.
 * external_id format: STORO-WALLET-{storeId}-{timestamp}
 *
 * Register this URL in Xendit dashboard:
 *   https://www.storo.id/api/webhooks/xendit-wallet
 *
 * Env: XENDIT_WEBHOOK_TOKEN
 */
export async function POST(request: NextRequest) {
  // Verify callback token
  const token = request.headers.get("x-callback-token");
  const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN;

  if (!expectedToken) {
    console.error("[xendit-wallet webhook] XENDIT_WEBHOOK_TOKEN not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (token !== expectedToken) {
    console.warn("[xendit-wallet webhook] Invalid callback token");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    external_id?: string;
    status?: string;
    amount?: number;
    id?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { external_id, status, amount, id: invoiceId } = body;

  // Only handle wallet top-up invoices
  if (!external_id?.startsWith("STORO-WALLET-")) {
    // Not our concern — return 200 to acknowledge without processing
    return NextResponse.json({ received: true });
  }

  if (status !== "PAID") {
    // Acknowledge non-PAID events without action
    return NextResponse.json({ received: true });
  }

  // Parse storeId from external_id: STORO-WALLET-{storeId}-{timestamp}
  // storeId is a UUID (36 chars), so split carefully
  const withoutPrefix = external_id.replace("STORO-WALLET-", "");
  // UUID is 36 chars
  const storeId = withoutPrefix.slice(0, 36);

  if (!storeId || storeId.length !== 36) {
    console.error("[xendit-wallet webhook] Cannot parse storeId from external_id:", external_id);
    return NextResponse.json({ error: "Invalid external_id format" }, { status: 400 });
  }

  if (!amount || amount <= 0) {
    console.error("[xendit-wallet webhook] Invalid amount:", amount);
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  try {
    const newBalance = await creditWallet(storeId, amount, "topup", {
      description: `Top up via Xendit invoice`,
      referenceId: invoiceId,
    });

    console.log(
      `[xendit-wallet webhook] Wallet credited: store=${storeId} amount=${amount} new_balance=${newBalance}`
    );

    return NextResponse.json({ received: true, new_balance: newBalance });
  } catch (err) {
    console.error("[xendit-wallet webhook] creditWallet error:", err);
    return NextResponse.json({ error: "Failed to credit wallet" }, { status: 500 });
  }
}
