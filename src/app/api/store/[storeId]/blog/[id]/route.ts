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
    "title",
    "slug",
    "excerpt",
    "content",
    "featured_image",
    "status",
    "meta_title",
    "meta_description",
  ] as const) {
    if (body?.[key] !== undefined) update[key] = body[key];
  }

  if (body?.status === "published") {
    const { data: existing } = await auth.service
      .from("blog_posts")
      .select("published_at")
      .eq("id", id)
      .maybeSingle();
    if (!existing?.published_at) update.published_at = new Date().toISOString();
  }

  const { data, error } = await auth.service
    .from("blog_posts")
    .update(update)
    .eq("id", id)
    .eq("store_id", storeId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ post: data });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ storeId: string; id: string }> }
) {
  const { storeId, id } = await context.params;
  const auth = await authorizeStoreApi(storeId);
  if (auth instanceof NextResponse) return auth;

  const { error } = await auth.service
    .from("blog_posts")
    .delete()
    .eq("id", id)
    .eq("store_id", storeId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
