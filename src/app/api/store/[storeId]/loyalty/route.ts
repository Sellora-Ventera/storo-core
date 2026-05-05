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
    .from("loyalty_config")
    .select("*")
    .eq("store_id", storeId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ config: data });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await context.params;
  const auth = await authorizeStoreApi(storeId);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const payload = {
    store_id: storeId,
    is_enabled: body.is_enabled ?? false,
    earn_rate: body.earn_rate ?? 0.01,
    point_value: body.point_value ?? 10,
    min_redeem: body.min_redeem ?? 100,
    max_redeem_pct: body.max_redeem_pct ?? 0.1,
  };

  const { data, error } = await auth.service
    .from("loyalty_config")
    .upsert(payload, { onConflict: "store_id" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ config: data });
}
