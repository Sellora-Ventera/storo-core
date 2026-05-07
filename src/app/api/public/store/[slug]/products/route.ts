import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
};

export async function GET(
  request: Request,
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

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;
  const categoryId = url.searchParams.get("category_id");
  const search = url.searchParams.get("search");

  let query = supabase
    .from("products")
    .select("id, name, slug, description, price, compare_at_price, stock, sku, weight, weight_unit, status, category_id, created_at, product_images(*), product_variants(*)", { count: "exact" })
    .eq("store_id", store.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (categoryId) query = query.eq("category_id", categoryId);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json(
    { data: data ?? [], total: count ?? 0, page, limit },
    { headers: CACHE_HEADERS }
  );
}
