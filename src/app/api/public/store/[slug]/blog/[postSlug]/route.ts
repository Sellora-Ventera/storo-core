import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string; postSlug: string }> }
) {
  const { slug, postSlug } = await context.params;
  const supabase = await createSupabaseServiceClient();

  // Resolve slug → store_id
  const { data: store, error: storeErr } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  if (storeErr || !store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, content, featured_image, published_at, meta_title, meta_description, status")
    .eq("store_id", store.id)
    .eq("slug", postSlug)
    .eq("status", "published")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({ data }, { headers: CACHE_HEADERS });
}
