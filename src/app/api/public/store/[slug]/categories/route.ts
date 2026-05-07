import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
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
    .from("categories")
    .select("id, name, slug, parent_id, description, image_url, sort_order, is_active")
    .eq("store_id", store.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data: data ?? [] }, { headers: CACHE_HEADERS });
}
