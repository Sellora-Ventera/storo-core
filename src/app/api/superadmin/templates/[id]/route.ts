import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { requireSuperadmin } from "@/lib/auth/superadmin";

const ALLOWED_FIELDS = [
  "display_name",
  "description",
  "category",
  "preview_image_url",
  "is_active",
  "sort_order",
  "price_setup_override",
  "price_monthly_override",
  "source_branch",
] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.errorResponse;

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) patch[key] = body[key];
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No allowed fields provided" }, { status: 400 });
  }

  const supabase = await createSupabaseServiceClient();
  const { error } = await supabase.from("templates").update(patch).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.errorResponse;

  const { id } = await params;
  const supabase = await createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ template: data });
}
