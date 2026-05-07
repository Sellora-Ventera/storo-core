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

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("store_promos")
    .select("id, name, code, type, value, min_purchase, max_discount, usage_limit, is_active, start_date, end_date")
    .eq("store_id", store.id)
    .eq("is_active", true)
    .or(`end_date.is.null,end_date.gt.${now}`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data: data ?? [] }, { headers: CACHE_HEADERS });
}
