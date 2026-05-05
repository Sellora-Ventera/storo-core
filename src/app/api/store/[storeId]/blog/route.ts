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
    .from("blog_posts")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ posts: data ?? [] });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await context.params;
  const auth = await authorizeStoreApi(storeId);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  if (!body?.title) {
    return NextResponse.json({ error: "title wajib diisi" }, { status: 400 });
  }

  const insert: Record<string, unknown> = {
    store_id: storeId,
    title: body.title,
    slug: body.slug ?? body.title.toLowerCase().replace(/\s+/g, "-"),
    excerpt: body.excerpt ?? null,
    content: body.content ?? null,
    featured_image: body.featured_image ?? null,
    status: body.status ?? "draft",
    meta_title: body.meta_title ?? null,
    meta_description: body.meta_description ?? null,
  };
  if (body.status === "published") insert.published_at = new Date().toISOString();

  const { data, error } = await auth.service.from("blog_posts").insert(insert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ post: data }, { status: 201 });
}
