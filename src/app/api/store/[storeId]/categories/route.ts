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
    .from("categories")
    .select("id, name, slug, parent_id, description, image_url, sort_order, is_active")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ categories: data ?? [] });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await context.params;
  const auth = await authorizeStoreApi(storeId);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { name, slug, parent_id, description, image_url } = body ?? {};
  if (!name) {
    return NextResponse.json({ error: "name wajib diisi" }, { status: 400 });
  }

  const { data, error } = await auth.service
    .from("categories")
    .insert({
      store_id: storeId,
      name,
      slug: slug ?? name.toLowerCase().replace(/\s+/g, "-"),
      parent_id: parent_id ?? null,
      description: description ?? null,
      image_url: image_url ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ category: data }, { status: 201 });
}
