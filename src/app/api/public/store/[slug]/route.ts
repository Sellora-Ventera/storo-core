import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
};

async function resolveStoreBySlug(slug: string) {
  const supabase = await createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("stores")
    .select("id, name, slug, domain, template_variant, theme_config, logo_url")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  if (error || !data) return null;
  return data;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const store = await resolveStoreBySlug(slug);
  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  return NextResponse.json({ data: store }, { headers: CACHE_HEADERS });
}
