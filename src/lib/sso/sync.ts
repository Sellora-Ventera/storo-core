import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export type SsoClaims = {
  sub: string;
  email: string;
  name?: string;
  phone_number?: string;
  realm?: string;
};

export type SyncedUser = {
  userId: string;
  email: string;
  isNewUser: boolean;
};

const PAGE_SIZE = 200;
const MAX_PAGES = 25;

async function findUserByEmail(
  service: Awaited<ReturnType<typeof createSupabaseServiceClient>>,
  email: string,
) {
  const target = email.toLowerCase();
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await service.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const users = (data?.users ?? []) as User[];
    const hit = users.find((u) => u.email?.toLowerCase() === target);
    if (hit) return hit;
    if (users.length < PAGE_SIZE) return null;
  }
  return null;
}

export async function syncSsoUserToSupabase(claims: SsoClaims): Promise<SyncedUser> {
  const service = await createSupabaseServiceClient();

  const ssoMetadata = {
    sso_sub: claims.sub,
    sso_realm: claims.realm,
    sso_provider: "ventera",
    full_name: claims.name,
    phone: claims.phone_number,
  };

  const existing = await findUserByEmail(service, claims.email);
  if (existing) {
    const merged = { ...(existing.user_metadata ?? {}), ...ssoMetadata };
    const { error } = await service.auth.admin.updateUserById(existing.id, {
      user_metadata: merged,
    });
    if (error) throw new Error(`updateUserById failed: ${error.message}`);
    return { userId: existing.id, email: existing.email!, isNewUser: false };
  }

  const { data, error } = await service.auth.admin.createUser({
    email: claims.email,
    email_confirm: true,
    user_metadata: ssoMetadata,
  });
  if (error || !data.user) {
    throw new Error(`createUser failed: ${error?.message ?? "unknown"}`);
  }
  return { userId: data.user.id, email: data.user.email!, isNewUser: true };
}
