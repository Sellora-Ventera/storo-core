import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";

export interface SuperadminAuthOk {
  ok: true;
  userId: string;
  errorResponse?: never;
}

export interface SuperadminAuthFail {
  ok: false;
  errorResponse: NextResponse;
  userId?: never;
}

export type SuperadminCheckResult = SuperadminAuthOk | SuperadminAuthFail;

/**
 * Verify the request comes from an authenticated superadmin.
 * Returns either { ok: true, userId } or { ok: false, errorResponse }.
 *
 * Usage:
 *   const auth = await requireSuperadmin();
 *   if (!auth.ok) return auth.errorResponse;
 *   // auth.userId is now safe to use
 */
export async function requireSuperadmin(): Promise<SuperadminCheckResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // Use service role to bypass RLS for the gate check.
  const serviceClient = await createSupabaseServiceClient();
  const { data: adminUser } = await serviceClient
    .from("superadmin_users")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!adminUser) {
    return {
      ok: false,
      errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, userId: user.id };
}
