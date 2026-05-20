import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";

/**
 * Mint a Supabase session for the given email by generating a magiclink with
 * the service role and immediately consuming it via verifyOtp on a cookie-bound
 * server client. The verifyOtp call sets `sb-*` auth cookies via the
 * @supabase/ssr cookie adapter, so the subsequent redirect lands on a
 * fully-authenticated request.
 *
 * Requires the user to already exist (call syncSsoUserToSupabase first).
 */
export async function mintSupabaseSession(email: string): Promise<void> {
  const service = await createSupabaseServiceClient();
  const { data, error } = await service.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (error || !data.properties) {
    throw new Error(`generateLink failed: ${error?.message ?? "no properties"}`);
  }

  const tokenHash =
    (data.properties as { hashed_token?: string }).hashed_token ?? "";
  if (!tokenHash) {
    throw new Error("generateLink returned no hashed_token");
  }

  const supabase = await createSupabaseServerClient();
  const { error: verifyErr } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  if (verifyErr) {
    throw new Error(`verifyOtp failed: ${verifyErr.message}`);
  }
}
