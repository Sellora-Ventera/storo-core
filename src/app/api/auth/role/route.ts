import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";

/**
 * Return the role of the current authenticated user.
 * Used by sign-in flow to determine landing page without relying on client-side RLS.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ authenticated: false, role: null });
  }

  const service = await createSupabaseServiceClient();
  const { data: admin } = await service
    .from("superadmin_users")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  return NextResponse.json({
    authenticated: true,
    userId: user.id,
    email: user.email,
    role: admin ? "superadmin" : "client",
  });
}
