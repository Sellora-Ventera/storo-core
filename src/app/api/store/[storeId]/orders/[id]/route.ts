import { NextResponse } from "next/server";
import { authorizeStoreApi } from "@/lib/store/context";

const ALLOWED_STATUSES = new Set([
  "pending",
  "awaiting_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

export async function GET(
  _request: Request,
  context: { params: Promise<{ storeId: string; id: string }> }
) {
  const { storeId, id } = await context.params;
  const auth = await authorizeStoreApi(storeId);
  if (auth instanceof NextResponse) return auth;

  const { data, error } = await auth.service
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .eq("store_id", storeId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order: data });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ storeId: string; id: string }> }
) {
  const { storeId, id } = await context.params;
  const auth = await authorizeStoreApi(storeId);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const update: Record<string, unknown> = {};
  if (body?.status !== undefined) {
    if (!ALLOWED_STATUSES.has(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    update.status = body.status;
    if (body.status === "shipped") update.shipped_at = new Date().toISOString();
    if (body.status === "delivered") update.delivered_at = new Date().toISOString();
  }
  if (body?.shipping_tracking_number !== undefined) {
    update.shipping_tracking_number = body.shipping_tracking_number;
  }
  if (body?.shipping_courier !== undefined) {
    update.shipping_courier = body.shipping_courier;
  }
  if (body?.notes !== undefined) update.admin_notes = body.notes;

  const { error, data } = await auth.service
    .from("orders")
    .update(update)
    .eq("id", id)
    .eq("store_id", storeId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ order: data });
}
