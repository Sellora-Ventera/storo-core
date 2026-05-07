import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { deductOpsFeeForOrder } from "@/lib/wallet/deduct-ops-fee";

export const dynamic = "force-dynamic";

/**
 * POST /api/store/[storeId]/wallet/deduct-ops-fee
 *
 * Called by storoengine after buyer order is confirmed paid (own_prepaid stores only).
 * Auth: x-service-token = SUPABASE_SERVICE_ROLE_KEY
 *
 * Body: { order_id: string, order_amount: number }
 * Returns: { ops_fee, new_balance, status, status_changed } | { skipped, reason }
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await context.params;

  // Server-to-server auth: storoengine passes its SUPABASE_SERVICE_ROLE_KEY
  const serviceToken = request.headers.get("x-service-token");
  if (!serviceToken || serviceToken !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { order_id?: string; order_amount?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { order_id, order_amount } = body;
  if (!order_id || !order_amount || order_amount <= 0) {
    return NextResponse.json(
      { error: "Missing or invalid order_id / order_amount" },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServiceClient();

  // Only deduct for own_prepaid stores
  const { data: store, error: storeErr } = await supabase
    .from("stores")
    .select("billing_model")
    .eq("id", storeId)
    .single();

  if (storeErr || !store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  if (store.billing_model !== "own_prepaid") {
    return NextResponse.json({ skipped: true, reason: "Store uses storo_gateway billing" });
  }

  try {
    const result = await deductOpsFeeForOrder(storeId, order_amount, order_id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[deduct-ops-fee]", storeId, message);
    // Return 200 so storoengine doesn't retry endlessly — ops fee can be reconciled later
    return NextResponse.json({ error: message, deducted: false });
  }
}
