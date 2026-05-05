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
    .from("membership_tiers")
    .select("*")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ tiers: data ?? [] });
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
    .from("membership_tiers")
    .insert({
      store_id: storeId,
      name: body.name,
      min_spend: body.min_spend ?? 0,
      discount_pct: body.discount_pct ?? 0,
      free_shipping: body.free_shipping ?? false,
      earn_multiplier: body.earn_multiplier ?? 1,
      sort_order: body.sort_order ?? 0,
      is_active: body.is_active ?? true,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ tier: data }, { status: 201 });
}
