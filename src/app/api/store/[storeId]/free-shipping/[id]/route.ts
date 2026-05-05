import { NextResponse } from "next/server";
import { authorizeStoreApi } from "@/lib/store/context";

export async function PUT(
  request: Request,
  context: { params: Promise<{ storeId: string; id: string }> }
) {
  const { storeId, id } = await context.params;
  const auth = await authorizeStoreApi(storeId);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const update: Record<string, unknown> = {};
  for (const key of [
    "name",
    "description",
    "min_purchase",
    "postal_codes",
    "allowed_courier_codes",
    "max_subsidy",
    "priority",
    "is_active",
  ] as const) {
    if (body?.[key] !== undefined) update[key] = body[key];
  }

  const { data, error } = await auth.service
    .from("free_shipping_rules")
    .update(update)
    .eq("id", id)
    .eq("store_id", storeId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ rule: data });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ storeId: string; id: string }> }
) {
  const { storeId, id } = await context.params;
  const auth = await authorizeStoreApi(storeId);
  if (auth instanceof NextResponse) return auth;

  const { error } = await auth.service
    .from("free_shipping_rules")
    .delete()
    .eq("id", id)
    .eq("store_id", storeId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
