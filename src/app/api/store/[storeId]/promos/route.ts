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
    .from("store_promos")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ promos: data ?? [] });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await context.params;
  const auth = await authorizeStoreApi(storeId);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  if (!body?.name) {
    return NextResponse.json({ error: "name wajib diisi" }, { status: 400 });
  }

  const { data, error } = await auth.service
    .from("store_promos")
    .insert({
      store_id: storeId,
      name: body.name,
      code: body.code ?? null,
      type: body.type ?? "percentage",
      value: body.value ?? 0,
      min_purchase: body.min_purchase ?? null,
      max_discount: body.max_discount ?? null,
      usage_limit: body.usage_limit ?? null,
      is_active: body.is_active ?? true,
      start_date: body.start_date ?? null,
      end_date: body.end_date ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ promo: data }, { status: 201 });
}
