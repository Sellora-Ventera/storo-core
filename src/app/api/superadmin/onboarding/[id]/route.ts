import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { requireSuperadmin } from "@/lib/auth/superadmin";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.errorResponse;

  const { id } = await params;
  const supabase = await createSupabaseServiceClient();

  const { error } = await supabase.from("onboarding_requests").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
