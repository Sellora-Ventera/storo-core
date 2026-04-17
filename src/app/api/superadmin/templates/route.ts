import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { requireSuperadmin } from "@/lib/auth/superadmin";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export async function POST(request: Request) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.errorResponse;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const display_name = String(body.display_name ?? body.name ?? "").trim();
  const description = body.description ? String(body.description) : null;
  const category = body.category ? String(body.category) : null;
  const source_repo = body.source_repo ? String(body.source_repo) : "PTVENTERA-AI/storoengine";
  const source_branch = body.source_branch ? String(body.source_branch) : "main";
  const preview_image_url = body.preview_image_url ? String(body.preview_image_url) : null;
  const price_setup_override =
    typeof body.price_setup_override === "number" ? body.price_setup_override : null;
  const price_monthly_override =
    typeof body.price_monthly_override === "number" ? body.price_monthly_override : null;
  const requestedSlug = body.slug ? String(body.slug) : name;
  const slug = slugify(requestedSlug);

  if (!name || !slug || !display_name) {
    return NextResponse.json(
      { error: "name, display_name, and slug are required" },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServiceClient();

  const { data: existing } = await supabase
    .from("templates")
    .select("id")
    .or(`slug.eq.${slug},name.eq.${name}`)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Template dengan slug atau nama tersebut sudah ada" },
      { status: 409 },
    );
  }

  const { data, error } = await supabase
    .from("templates")
    .insert({
      name,
      display_name,
      slug,
      description,
      category,
      preview_image_url,
      source_repo,
      source_branch,
      price_setup_override,
      price_monthly_override,
      deploy_status: "draft",
      is_active: false,
      created_by: auth.userId,
    })
    .select("id, slug, name, deploy_status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ template: data }, { status: 201 });
}
