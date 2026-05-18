import { redirect } from "next/navigation";
import { requireSuperadmin } from "@/lib/auth/superadmin";
import { sharelinkClient } from "@/lib/sharelink/client";
import { ReferralsAdminClient } from "./client";

export const dynamic = "force-dynamic";

export default async function SuperadminReferralsPage() {
  const auth = await requireSuperadmin();
  if (!auth.ok) {
    redirect("/sign-in");
  }

  let initialCodes: Awaited<ReturnType<ReturnType<typeof sharelinkClient>["listReferrals"]>>["data"] = [];
  let initialRewards: Awaited<ReturnType<ReturnType<typeof sharelinkClient>["listRewards"]>>["data"] = [];
  let fetchError: string | null = null;

  try {
    const sl = sharelinkClient();
    const [codesRes, rewardsRes] = await Promise.all([
      sl.listReferrals({ limit: 100 }),
      sl.listRewards({ limit: 100 }),
    ]);
    initialCodes = codesRes.data;
    initialRewards = rewardsRes.data;
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Sharelink unreachable";
  }

  return (
    <ReferralsAdminClient
      initialCodes={initialCodes.map((c) => ({
        id: c.id,
        code: c.code,
        referrer_id: c.referrer_id,
        referrer_email: c.referrer_email,
        referrer_name: c.referrer_name,
        current_uses: c.current_uses,
        status: c.status,
        reward_amount: extractRewardAmount(c.metadata),
        created_at: c.created_at,
      }))}
      initialRewards={initialRewards.map((r) => ({
        id: r.id,
        recipient_id: r.recipient_id,
        amount: typeof r.amount === "number"
          ? r.amount
          : extractRewardAmount(r.metadata?.calculation_config as Record<string, unknown> | null),
        currency: r.currency,
        status: r.status,
        created_at: r.created_at,
        hold_until: r.hold_until,
      }))}
      fetchError={fetchError}
    />
  );
}

function extractRewardAmount(meta: Record<string, unknown> | null | undefined): number | null {
  if (!meta) return null;
  // From reward_override
  const ro = meta.reward_override as Record<string, unknown> | undefined;
  if (ro) {
    const calc = ro.calculation as Record<string, unknown> | undefined;
    const flat = calc?.flat as { amount?: number } | undefined;
    if (typeof flat?.amount === "number") return flat.amount;
  }
  // From calculation_config (on reward rows)
  const cc = meta as { flat?: { amount?: number } };
  if (typeof cc.flat?.amount === "number") return cc.flat.amount;
  return null;
}
