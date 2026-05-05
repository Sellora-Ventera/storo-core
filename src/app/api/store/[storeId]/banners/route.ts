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
    .from("store_banners")
    .select(
      "id, title, subtitle, image_url, link_url, position, is_active, start_date, end_date, created_at"
    )
    .eq("store_id", storeId)
    .order("position", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ banners: data ?? [] });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await context.params;
  const auth = await authorizeStoreApi(storeId);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  if (!body?.image_url) {
    return NextResponse.json({ error: "image_url wajib diisi" }, { status: 400 });
  }

  const { data, error } = await auth.service
    .from("store_banners")
    .insert({
      store_id: storeId,
      title: body.title ?? null,
      subtitle: body.subtitle ?? null,
      image_url: body.image_url,
      link_url: body.link_url ?? null,
      position: body.position ?? 0,
      is_active: body.is_active ?? true,
      start_date: body.start_date ?? null,
      end_date: body.end_date ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ banner: data }, { status: 201 });
}
