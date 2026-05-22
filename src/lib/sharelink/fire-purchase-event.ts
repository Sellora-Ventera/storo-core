import type { SupabaseClient } from "@supabase/supabase-js";
import { sharelinkClient } from "@/lib/sharelink/client";
import { getRewardCapForPlan } from "@/lib/plans";

/**
 * Fire `purchase` event ke Sharelink saat invoice setup pertama referee dibayar.
 *
 * Dipanggil dari Xendit webhook (handleSetupInvoice). Non-throwing — log + return
 * status. Payment sudah committed, jangan rollback hanya karena referral tracking gagal.
 *
 * Cap behavior (per user decision):
 *   - Cap reward kumulatif referrer per bulan = harga MONTHLY paket aktif
 *   - Jika reward baru bikin total > cap → SKIP event (referrer tidak earn bulan ini)
 *   - Future enhancement: auto-hold + cron release di awal bulan baru
 *
 * Idempotency: Sharelink pipeline.ts dedupe per (code, referee_id, event_type).
 * Plus kita pakai invoice id sebagai eventName supaya tracking-able.
 */
export interface FirePurchaseResult {
  ok: boolean;
  skipped?: "no_referrer" | "cap_reached" | "referrer_plan_unknown" | "first_paid_check_failed";
  error?: string;
  reward_ids?: string[];
}

export async function fireReferralPurchaseEvent(
  supabase: SupabaseClient,
  opts: {
    refereeClientId: string;
    refereeUserId: string;
    refereeEmail?: string | null;
    refereeName?: string | null;
    invoiceId: string;
    invoicePlan?: string | null;
    invoiceAmount?: number | null;
  },
): Promise<FirePurchaseResult> {
  // 1. Look up referee's attribution
  const { data: refereeClient, error: refErr } = await supabase
    .from("clients")
    .select("referred_by_code, referred_by_ref_id")
    .eq("id", opts.refereeClientId)
    .single();

  if (refErr || !refereeClient?.referred_by_code) {
    return { ok: true, skipped: "no_referrer" };
  }

  const referralCode = refereeClient.referred_by_code as string;

  // 2. Look up the referrer to get their user_id + active plan.
  //    Referrers fall into two buckets:
  //      a) Storo merchants: row in `clients` keyed by `own_referral_code`.
  //         Apply the monthly cap based on their active plan.
  //      b) Sharelink-managed cross-tenant campaigns (e.g. a tenant on
  //         sharelink whose code is shared with Storo but who doesn't have a
  //         Storo store): no Storo `clients` row. Skip cap check and forward
  //         the event — sharelink resolves the referrer + reward server-side.
  const { data: referrerClient, error: rcErr } = await supabase
    .from("clients")
    .select("id, user_id")
    .eq("own_referral_code", referralCode)
    .maybeSingle();

  if (rcErr) {
    console.warn("[fireReferralPurchaseEvent] referrer lookup error, forwarding without cap:", rcErr);
  }

  const sl = sharelinkClient();

  // Storo-side cap only applies when the referrer is a Storo merchant with a
  // known plan. Otherwise (sharelink cross-tenant campaign), skip silently.
  if (referrerClient) {
    const { data: requests } = await supabase
      .from("onboarding_requests")
      .select("plan, status, created_at")
      .eq("client_id", referrerClient.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const liveOrPending = (requests ?? []).find((r) => r.status === "live")
      ?? (requests ?? []).find((r) => r.status !== "rejected");
    const referrerPlan = liveOrPending?.plan ?? null;

    if (referrerPlan) {
      const capRupiah = getRewardCapForPlan(referrerPlan);
      const defaultRewardIDR = Number(process.env.SHARELINK_DEFAULT_REWARD_IDR ?? "100000");

      // 3. Sum referrer's rewards this calendar month (UTC for consistency with Sharelink)
      let monthlyAccrued = 0;
      try {
        const startOfMonth = new Date(Date.UTC(
          new Date().getUTCFullYear(),
          new Date().getUTCMonth(),
          1,
        )).toISOString();

        const rewards = await sl.listRewards({
          recipientId: referrerClient.user_id,
          limit: 100,
        });

        monthlyAccrued = rewards.data
          .filter((r) => r.created_at >= startOfMonth)
          .filter((r) => r.status !== "clawed_back" && r.status !== "failed")
          .reduce((sum, r) => {
            const fromAmount = typeof r.amount === "number" ? r.amount : 0;
            const calcCfg = r.metadata?.calculation_config as Record<string, unknown> | undefined;
            const flat = calcCfg?.flat as { amount?: number } | undefined;
            const fromMeta = typeof flat?.amount === "number" ? flat.amount : 0;
            return sum + (fromAmount || fromMeta);
          }, 0);
      } catch (err) {
        console.warn("[fireReferralPurchaseEvent] listRewards failed, proceeding without cap check:", err);
        // Fall through — better to over-pay than block legitimate rewards
      }

      // 4. Cap check — if new reward would exceed monthly cap, skip
      if (capRupiah > 0 && monthlyAccrued + defaultRewardIDR > capRupiah) {
        console.log(
          `[fireReferralPurchaseEvent] CAP SKIP — referrer ${referrerClient.user_id} ` +
          `accrued ${monthlyAccrued} + reward ${defaultRewardIDR} > cap ${capRupiah} (plan ${referrerPlan})`,
        );
        return { ok: true, skipped: "cap_reached" };
      }
    }
  } else {
    console.log(`[fireReferralPurchaseEvent] referrer not in Storo (cross-tenant code ${referralCode}), forwarding without cap`);
  }

  // 5. Fire the event — Sharelink will compute reward based on code's metadata.reward_override
  try {
    const result = await sl.triggerEvent({
      referralCode,
      eventType: "purchase",
      eventName: `xendit_inv_${opts.invoiceId}`,
      refereeId: opts.refereeUserId,
      refereeEmail: opts.refereeEmail ?? undefined,
      refereeName: opts.refereeName ?? undefined,
      metadata: {
        plan: opts.invoicePlan ?? null,
        invoiceId: opts.invoiceId,
        amountPaid: opts.invoiceAmount ?? null,
        source: "xendit_setup_invoice_paid",
      },
    });

    return {
      ok: true,
      reward_ids: result.rewards?.map((r) => r.id),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown Sharelink error";
    // Duplicate event errors are expected (idempotent retries from Xendit). Not a real failure.
    if (msg.includes("Duplicate event")) {
      return { ok: true };
    }
    console.error("[fireReferralPurchaseEvent] triggerEvent failed:", err);
    return { ok: false, error: msg };
  }
}
