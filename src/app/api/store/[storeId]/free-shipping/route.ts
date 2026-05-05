import { NextResponse } from "next/server";
import { authorizeStoreApi } from "@/lib/store/context";

export async function GET(
  _request: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await context.params;
  const auth = await authorizeStoreApi(storeId);
  if (auth instanceof NextResponse) return auth;

  const { data, error } = await auth.service
    .from("free_shipping_rules")
    .select("*")
    .eq("store_id", storeId)
    .order("priority", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ rules: data ?? [] });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await context.params;
  const auth = await authorizeStoreApi(storeId);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  if (!body?.name) return NextResponse.json({ error: "name wajib diisi" }, { status: 400 });

  const { data, error } = await auth.service
    .from("free_shipping_rules")
    .insert({
      store_id: storeId,
      name: body.name,
      description: body.description ?? null,
      min_purchase: body.min_purchase ?? null,
      postal_codes: body.postal_codes ?? [],
      allowed_courier_codes: body.allowed_courier_codes ?? [],
      max_subsidy: body.max_subsidy ?? null,
      priority: body.priority ?? 0,
      is_active: body.is_active ?? true,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ rule: data }, { status: 201 });
}
