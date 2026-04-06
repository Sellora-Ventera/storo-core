import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");

  if (!slug || slug.length < 3) {
    return NextResponse.json({ available: false, error: "Slug terlalu pendek" });
  }

  // Validate slug format
  if (!/^[a-z0-9-]{3,30}$/.test(slug)) {
    return NextResponse.json({ available: false, error: "Format slug tidak valid" });
  }

  const supabase = await createSupabaseServerClient();

  // Check reserved_slugs table
  const { data: reserved } = await supabase
    .from("reserved_slugs")
    .select("slug")
    .eq("slug", slug)
    .single();

  // Check onboarding_requests for existing subdomain
  const { data: existing } = await supabase
    .from("onboarding_requests")
    .select("id")
    .eq("store_url", `${slug}.storo.id`)
    .single();

  const available = !reserved && !existing;
  return NextResponse.json({ available, slug });
}
