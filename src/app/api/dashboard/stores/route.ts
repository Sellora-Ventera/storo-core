import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDiscountPercentForPlan, getPlan } from "@/lib/plans";
import { sharelinkClient } from "@/lib/sharelink/client";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(request: Request) {
  try {
    const supabaseAuth = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const body = await request.json();
    const {
      plan: planId,
      websiteName,
      customDomain,
      storeName,
      referralCode: bodyReferralCode,
    } = body as {
      plan?: string;
      websiteName?: string;
      customDomain?: string;
      storeName?: string;
      referralCode?: string;
    };

    if (!planId?.trim()) {
      return NextResponse.json({ error: "Pilih paket terlebih dahulu." }, { status: 400 });
    }
    if (!websiteName?.trim()) {
      return NextResponse.json({ error: "Nama website wajib diisi." }, { status: 400 });
    }
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(websiteName.trim())) {
      return NextResponse.json(
        { error: "Format nama website tidak valid." },
        { status: 400 },
      );
    }

    const plan = getPlan(planId);
    if (!plan || plan.setup === null) {
      return NextResponse.json(
        { error: "Paket tidak valid. Untuk paket Custom, hubungi tim kami." },
        { status: 400 },
      );
    }

    const supabase = getServiceClient();

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, full_name, phone, referred_by_code")
      .eq("user_id", user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Profil client tidak ditemukan. Selesaikan onboarding pertama Anda dulu." },
        { status: 404 },
      );
    }

    const slug = slugify(storeName?.trim() || websiteName.trim());

    const { error: requestError } = await supabase
      .from("onboarding_requests")
      .insert({
        client_id: client.id,
        plan: planId,
        template_name: "modern",
        requested_slug: slug,
        custom_domain: customDomain?.trim() || null,
        status: "pending",
      });

    if (requestError) {
      console.error("[dashboard/stores] Onboarding request error:", requestError);
      return NextResponse.json(
        { error: "Gagal menyimpan permintaan toko. Coba lagi atau hubungi tim kami." },
        { status: 500 }
      );
    }

    // Resolve diskon referral. Dua sumber:
    //   1. body.referralCode (opsional) — user input dari Step 3 Summary form,
    //      buat existing user yang belum pernah ke-attribute mau klaim kode.
    //      Kalau valid + client.referred_by_code masih null → simpan
    //      (first-attribution-wins) supaya add-store berikutnya nggak perlu
    //      input ulang.
    //   2. client.referred_by_code yang sudah ada di DB (fallback).
    //
    // Body wins HANYA kalau client belum punya attribution; kalau client sudah
    // punya code lama, code lama yang dipakai (tidak bisa di-override lewat UI).
    const normalizedBodyCode =
      typeof bodyReferralCode === "string" ? bodyReferralCode.trim() : "";
    const effectiveReferralCode =
      (client.referred_by_code as string | null) ||
      (normalizedBodyCode || null);

    let discountPercent = 0;
    if (effectiveReferralCode) {
      const { data: referrer } = await supabase
        .from("clients")
        .select("id")
        .eq("own_referral_code", effectiveReferralCode)
        .maybeSingle();

      if (referrer) {
        const { data: requests } = await supabase
          .from("onboarding_requests")
          .select("plan, status, created_at")
          .eq("client_id", referrer.id)
          .order("created_at", { ascending: false })
          .limit(5);

        const liveOrPending = (requests ?? []).find((r) => r.status === "live")
          ?? (requests ?? []).find((r) => r.status !== "rejected");
        if (liveOrPending?.plan) {
          discountPercent = getDiscountPercentForPlan(liveOrPending.plan);
        }

        // Persist body-provided code so future add-store doesn't need re-entry.
        // Guard: only set if NULL (don't overwrite earlier attribution).
        if (normalizedBodyCode && !client.referred_by_code) {
          await supabase
            .from("clients")
            .update({ referred_by_code: normalizedBodyCode })
            .eq("id", client.id)
            .is("referred_by_code", null);
        }
      }
    }

    const setupAmount = plan.setup;
    const discountAmount = discountPercent > 0
      ? Math.round((setupAmount * discountPercent) / 100)
      : 0;
    const invoiceAmount = setupAmount - discountAmount;
    const description = discountAmount > 0
      ? `Setup Webstore Storo.id — Paket ${plan.name} (${slug}) — Diskon referral ${discountPercent}%`
      : `Setup Webstore Storo.id — Paket ${plan.name} (${slug})`;

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        client_id: client.id,
        type: "setup",
        description,
        amount: invoiceAmount,
        status: "unpaid",
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        provider: "xendit",
        // Audit trail — same shape as onboarding/checkout. Finance can reconcile
        // and Sharelink purchase event (from xendit webhook) reads `plan` from here.
        metadata: {
          plan: planId,
          plan_setup: setupAmount,
          referral_code: effectiveReferralCode,
          discount_percent: discountPercent,
          discount_amount: discountAmount,
        },
      })
      .select("id")
      .single();

    if (invoiceError || !invoice) {
      console.error("[dashboard/stores] Invoice insert error:", invoiceError);
      return NextResponse.json({ error: "Gagal membuat invoice." }, { status: 500 });
    }

    await supabase.from("onboarding_leads").insert({
      full_name: client.full_name,
      phone: client.phone,
      plan: planId,
      selected_domain: customDomain?.trim() || `${websiteName.trim()}.storo.id`,
      email: user.email,
      store_name: storeName?.trim() || null,
      client_id: client.id,
      invoice_id: invoice.id,
      status: "account_created",
    });

    // ── Fire Sharelink signup event (best-effort) ─────────────────
    // Same pattern as /api/onboarding/checkout. Counts as a "conversion" in
    // the referrer's portal dashboard. Doesn't create a reward (reward gated
    // on the `purchase` event from xendit webhook when invoice is paid).
    // Idempotent: Sharelink dedupes per (code, referee_id, event_type), so
    // multiple add-store cycles to the same code won't double-count.
    //
    // Defensive: sharelinkClient() throws synchronously if SHARELINK_BASE_URL
    // or SHARELINK_SECRET_KEY env vars are missing. We MUST NOT let that crash
    // the checkout — the invoice is already inserted, the user must reach
    // the payment page no matter what. Wrap the whole thing in try/catch.
    if (effectiveReferralCode) {
      try {
        const sl = sharelinkClient();
        sl.triggerEvent({
          referralCode: effectiveReferralCode,
          eventType: "signup",
          refereeId: user.id,
          refereeEmail: user.email ?? undefined,
          refereeName: client.full_name ?? undefined,
          metadata: {
            source: "storo_dashboard_add_store",
            invoice_id: invoice.id,
            plan: planId,
          },
        }).catch((err) => {
          const msg = err instanceof Error ? err.message : String(err);
          // Duplicate event = idempotent retry from a prior add-store, not an error
          if (!msg.includes("Duplicate event")) {
            console.warn("[dashboard/stores] signup event fire failed:", msg);
          }
        });
      } catch (err) {
        console.warn(
          "[dashboard/stores] sharelinkClient init failed (env vars missing?):",
          err instanceof Error ? err.message : err,
        );
      }
    }

    const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://storo.id";
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const edgeFnUrl = `${SUPABASE_URL}/functions/v1/storo-billing-invoice`;

    try {
      const edgeFnRes = await fetch(edgeFnUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoice_id: invoice.id,
          description,
          customer: {
            given_names: client.full_name,
            email: user.email,
          },
          success_redirect_url: `${APP_URL}/payment/success?invoice_id=${invoice.id}`,
          failure_redirect_url: `${APP_URL}/payment/failed?invoice_id=${invoice.id}`,
        }),
      });

      if (!edgeFnRes.ok) {
        const errBody = await edgeFnRes.text();
        console.error(
          "[dashboard/stores] Edge function error:",
          edgeFnRes.status,
          errBody,
        );

        await supabase
          .from("invoices")
          .update({ provider: "manual" })
          .eq("id", invoice.id);

        return NextResponse.json(
          {
            invoiceId: invoice.id,
            xenditInvoiceUrl: null,
            error: "Pembayaran online gagal diproses. Bayar manual dari dashboard.",
          },
          { status: 200 },
        );
      }

      const edgeResult = await edgeFnRes.json();

      return NextResponse.json({
        invoiceId: invoice.id,
        xenditInvoiceUrl: edgeResult.invoice_url,
      });
    } catch (edgeErr) {
      console.error("[dashboard/stores] Edge function call failed:", edgeErr);

      await supabase
        .from("invoices")
        .update({ provider: "manual" })
        .eq("id", invoice.id);

      return NextResponse.json(
        {
          invoiceId: invoice.id,
          xenditInvoiceUrl: null,
          error: "Pembayaran online gagal diproses. Bayar manual dari dashboard.",
        },
        { status: 200 },
      );
    }
  } catch (err) {
    console.error("[dashboard/stores] Unexpected error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Coba lagi." },
      { status: 500 },
    );
  }
}
