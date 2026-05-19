import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import {
  sharelinkClient,
  type ReferralCodeRow,
  type RewardRow,
} from "@/lib/sharelink/client";

export const dynamic = "force-dynamic";

/**
 * Single endpoint dipanggil /dashboard/referral untuk mendapatkan SEMUA data
 * referral milik user yang login. Juga handle:
 *
 *   1. Lazy provisioning kode `own_referral_code` lewat Sharelink kalau belum
 *      pernah dibuat (idempotent — kalau sudah ada di clients table, skip).
 *   2. Lazy attribution capture: kalau user.user_metadata.referral_code ada
 *      (dipasang oleh sign-up dari sessionStorage) dan belum tersimpan di
 *      clients.referred_by_code, simpan + fire event `signup` ke Sharelink.
 *      Idempotent karena Sharelink pipeline.ts dedupe event per
 *      (code, referee_id, event_type).
 *
 * Return shape:
 *   {
 *     ownCode: string | null,
 *     ownLink: string | null,
 *     defaultRewardIDR: number,    // per-code reward_override kalau ada, else env
 *     referrals: { id, code, current_uses, ... }[],
 *     rewards: RewardRow[],
 *     stats: { totalReferred: number, totalEarnedIDR: number }
 *   }
 *
 * Untuk angka reward, kita baca dari reward.metadata.calculation_config.flat.amount
 * karena Sharelink set reward.amount = null di insert (lihat pipeline.ts:234).
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Use service client untuk semua write — RLS owner_access enforced via user_id.
  // Kita tetap pakai service untuk konsistensi & supaya bisa baca tabel
  // yang belum sepenuhnya RLS-friendly.
  const admin = await createSupabaseServiceClient();

  // 1. Find or create the client row
  let { data: client } = await admin
    .from("clients")
    .select("id, full_name, user_id, own_referral_code, own_referral_ref_id, referred_by_code, referred_by_ref_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!client) {
    const inserted = await admin
      .from("clients")
      .insert({
        user_id: user.id,
        full_name: (user.user_metadata?.full_name as string | undefined) ?? user.email?.split("@")[0] ?? null,
      })
      .select("id, full_name, user_id, own_referral_code, own_referral_ref_id, referred_by_code, referred_by_ref_id")
      .single();

    if (inserted.error || !inserted.data) {
      return NextResponse.json(
        { error: `Failed to create client row: ${inserted.error?.message ?? "unknown"}` },
        { status: 500 },
      );
    }
    client = inserted.data;
  }

  const defaultRewardIDR = Number(process.env.SHARELINK_DEFAULT_REWARD_IDR ?? "100000");

  // 2. Capture inbound attribution (referee → referrer link)
  const inboundCode =
    typeof user.user_metadata?.referral_code === "string"
      ? user.user_metadata.referral_code.trim()
      : null;

  if (inboundCode && !client.referred_by_code) {
    try {
      const sl = sharelinkClient();
      const code = await sl.getReferral(inboundCode);
      if (code) {
        await admin
          .from("clients")
          .update({
            referred_by_code: inboundCode,
            referred_by_ref_id: code.id,
          })
          .eq("id", client.id);

        // Fire 'signup' event for attribution tracking. Dedupe handled by Sharelink.
        sl.triggerEvent({
          referralCode: inboundCode,
          eventType: "signup",
          refereeId: user.id,
          refereeEmail: user.email ?? undefined,
          refereeName: client.full_name ?? undefined,
        }).catch((err) => {
          console.warn("[referral/my-data] signup event fire failed:", err);
        });

        client.referred_by_code = inboundCode;
        client.referred_by_ref_id = code.id;
      }
    } catch (err) {
      console.warn("[referral/my-data] inbound attribution lookup failed:", err);
    }
  }

  // 3. Provision own_referral_code if missing.
  //
  // Tenant: Ventera AI (Sharelink slug rafli-t1tan) — same tenant SMX uses.
  // Reward routing happens via metadata.referrer_source = "storo_merchant",
  // which matches the "storo_merchant_credit" profile in tenant config
  // (lihat sharelink.id/scripts/setup-ventera-storo-profile.mjs). Sengaja
  // TIDAK pakai per-code reward_override supaya kalau kebijakan reward berubah
  // cukup edit profile sekali di /tenant/reward-profiles, tidak perlu re-stamp
  // ribuan kode.
  if (!client.own_referral_code) {
    try {
      const sl = sharelinkClient();
      const created = await sl.createReferral({
        referrerId: user.id,
        referrerEmail: user.email ?? undefined,
        referrerName: client.full_name ?? undefined,
        type: "standard",
        metadata: {
          referrer_source: "storo_merchant",
          source_app: "storo",
        },
      });

      await admin
        .from("clients")
        .update({
          own_referral_code: created.code,
          own_referral_ref_id: created.id,
        })
        .eq("id", client.id);

      client.own_referral_code = created.code;
      client.own_referral_ref_id = created.id;
    } catch (err) {
      console.error("[referral/my-data] provision failed:", err);
      // Continue — UI will show empty state and admin can retry from superadmin
    }
  }

  // 4. Fetch live data from Sharelink (referrals + rewards)
  let referrals: ReferralCodeRow[] = [];
  let rewards: RewardRow[] = [];

  try {
    const sl = sharelinkClient();
    const [refRes, rewRes] = await Promise.all([
      sl.listReferrals({ referrerId: user.id, limit: 50 }),
      sl.listRewards({ recipientId: user.id, limit: 100 }),
    ]);
    referrals = refRes.data;
    rewards = rewRes.data;
  } catch (err) {
    console.warn("[referral/my-data] Sharelink fetch failed:", err);
  }

  // 4b. Resolve the merchant's effective reward amount. Sharelink admin can
  // override per-code via the "Edit Referrer" dialog (stores
  // metadata.reward_override.calculation.flat.amount on the code). If set,
  // banner Rp di /dashboard/referral pakai angka itu — kalau tidak, fallback
  // ke env default. Tenant-level reward_profile tidak di-resolve di sini (perlu
  // endpoint khusus baca tenant config); kalau angka tenant profile berubah
  // dan tidak ada per-code override, banner tetap nampilin env default — set
  // SHARELINK_DEFAULT_REWARD_IDR sesuai profile saat ini, atau set override
  // per-code biar pasti sinkron.
  let effectiveRewardIDR = defaultRewardIDR;
  if (client.own_referral_code) {
    const myCode = referrals.find((r) => r.code === client.own_referral_code);
    const ov = myCode?.metadata?.reward_override as
      | { calculation?: { flat?: { amount?: unknown } } }
      | undefined;
    const ovAmount = ov?.calculation?.flat?.amount;
    if (typeof ovAmount === "number" && Number.isFinite(ovAmount)) {
      effectiveRewardIDR = ovAmount;
    }
  }

  // 5. Aggregate stats
  //
  // `totalReferred` counts paid customers (= valid rewards), NOT total events
  // or current_uses. Background:
  //   - current_uses increments per validated event, so 1 person firing
  //     signup + purchase = current_uses += 2. Caused Sellora to see
  //     "8 teman" when only 3 had actually paid (others were dupe sign-ups +
  //     signup-event rewards that got clawed back).
  //   - Each non-clawed-back reward = 1 paid customer that earned Sellora
  //     a commission. That's the semantically meaningful number for the
  //     "teman yang sudah bergabung" / commission counter on this page.
  //
  // `totalEarnedIDR` mirrors the same filter (skip clawed-back / failed).
  const validRewards = rewards.filter(
    (r) => r.status !== "clawed_back" && r.status !== "failed",
  );
  const totalReferred = validRewards.length;
  const totalEarnedIDR = validRewards.reduce((s, r) => {
    // Sharelink stores actual amount in metadata.calculation_config.flat.amount
    // because mrs_rewards.amount is null at insert time (pipeline.ts:234).
    const fromAmount = typeof r.amount === "number" ? r.amount : null;
    const calcCfg = (r.metadata?.calculation_config as Record<string, unknown> | undefined);
    const flat = (calcCfg?.flat as { amount?: number } | undefined);
    const fromMeta = typeof flat?.amount === "number" ? flat.amount : 0;
    return s + (fromAmount ?? fromMeta);
  }, 0);

  return NextResponse.json({
    ownCode: client.own_referral_code,
    ownLink: client.own_referral_code
      ? `https://storo.id/r/${client.own_referral_code}`
      : null,
    defaultRewardIDR: effectiveRewardIDR,
    referrals: referrals.map((r) => ({
      id: r.id,
      code: r.code,
      current_uses: r.current_uses,
      status: r.status,
      metadata: r.metadata,
    })),
    rewards: rewards.map((r) => {
      const calcCfg = r.metadata?.calculation_config as Record<string, unknown> | undefined;
      const flat = calcCfg?.flat as { amount?: number } | undefined;
      const displayAmount =
        typeof r.amount === "number"
          ? r.amount
          : typeof flat?.amount === "number"
            ? flat.amount
            : 0;
      return {
        id: r.id,
        amount: displayAmount,
        currency: r.currency,
        status: r.status,
        created_at: r.created_at,
        hold_until: r.hold_until,
        level: r.level,
      };
    }),
    stats: {
      totalReferred,
      totalEarnedIDR,
    },
  });
}
