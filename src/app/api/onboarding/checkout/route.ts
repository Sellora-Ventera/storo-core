import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { getPlan, getDiscountPercentForPlan } from "@/lib/plans";
import { signAutoLoginToken } from "@/lib/auth/auto-login-token";
import { sharelinkClient } from "@/lib/sharelink/client";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fullName,
      phone,
      shopeeStoreLink,
      storeName,
      plan: planId,
      selectedDomain,
      customDomain,
      referralCode,
    } = body;

    // ── Auth: rely on SSO-minted Supabase session ─────────────────
    // Onboarding wizard step 4 redirects through Ventera SSO; the callback
    // (/auth/sso/callback) syncs the user into Supabase Auth and mints a
    // session cookie via verifyOtp. By the time the wizard reaches this
    // route, supabase.auth.getUser() must return that user.
    const authClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Sesi tidak ditemukan. Silakan login ulang via Ventera SSO." },
        { status: 401 },
      );
    }

    const email = (user.email ?? "").trim();
    if (!email) {
      return NextResponse.json(
        { error: "Akun Ventera SSO tidak menyertakan email." },
        { status: 400 },
      );
    }

    if (!fullName?.trim()) {
      return NextResponse.json({ error: "Nama lengkap wajib diisi." }, { status: 400 });
    }
    if (!phone?.trim()) {
      return NextResponse.json({ error: "Nomor WhatsApp wajib diisi." }, { status: 400 });
    }
    if (!planId?.trim()) {
      return NextResponse.json({ error: "Pilih paket terlebih dahulu." }, { status: 400 });
    }

    const plan = getPlan(planId);
    if (!plan || plan.setup === null) {
      return NextResponse.json(
        { error: "Paket tidak valid. Untuk paket Custom, silakan hubungi tim kami." },
        { status: 400 },
      );
    }

    // Service client for admin operations (RLS bypass for inserts/upserts).
    const supabase = await createSupabaseServiceClient();
    const userId = user.id;

    // ── Resolve referral discount (BEFORE creating invoice) ─────────
    const normalizedReferralCode =
      typeof referralCode === "string" ? referralCode.trim() : "";

    let discountPercent = 0;
    if (normalizedReferralCode) {
      try {
        const { data: referrer } = await supabase
          .from("clients")
          .select("id")
          .eq("own_referral_code", normalizedReferralCode)
          .maybeSingle();

        if (referrer) {
          const { data: requests } = await supabase
            .from("onboarding_requests")
            .select("plan, status, created_at")
            .eq("client_id", referrer.id)
            .order("created_at", { ascending: false })
            .limit(5);

          const liveOrPending =
            (requests ?? []).find((r) => r.status === "live") ??
            (requests ?? []).find((r) => r.status !== "rejected");
          if (liveOrPending?.plan) {
            discountPercent = getDiscountPercentForPlan(liveOrPending.plan);
          }
        }
      } catch (err) {
        console.warn("[checkout] discount lookup failed:", err);
      }
    }

    // Merge wizard-collected fullName/phone/referralCode into user_metadata so
    // future dashboards/personalization see them without re-reading clients.
    {
      const merged = {
        ...(user.user_metadata ?? {}),
        full_name: fullName.trim(),
        phone: phone.trim(),
        referral_code: normalizedReferralCode || undefined,
      };
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: merged,
      });
      if (updateError) {
        console.warn("[checkout] updateUserById failed:", updateError.message);
      }
    }

    const slug = slugify(storeName?.trim() || fullName.trim());

    // ── Upsert client row (retry-safe) ────────────────────────────
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .upsert(
        {
          user_id: userId,
          full_name: fullName.trim(),
          phone: phone.trim(),
          shopee_store_link: shopeeStoreLink?.trim() || null,
          shopee_store_name: storeName?.trim() || null,
        },
        { onConflict: "user_id" },
      )
      .select("id, referred_by_code")
      .single();

    if (clientError) {
      console.error("[checkout] Client insert error:", clientError);
      return NextResponse.json(
        { error: "Gagal menyimpan data profil. Coba lagi." },
        { status: 500 },
      );
    }

    let effectiveReferralCode = client.referred_by_code as string | null;
    if (normalizedReferralCode && !effectiveReferralCode) {
      await supabase
        .from("clients")
        .update({ referred_by_code: normalizedReferralCode })
        .eq("id", client.id)
        .is("referred_by_code", null);
      effectiveReferralCode = normalizedReferralCode;
    }

    if (
      normalizedReferralCode &&
      effectiveReferralCode &&
      effectiveReferralCode !== normalizedReferralCode
    ) {
      discountPercent = 0;
      try {
        const { data: realReferrer } = await supabase
          .from("clients")
          .select("id")
          .eq("own_referral_code", effectiveReferralCode)
          .maybeSingle();

        if (realReferrer) {
          const { data: requests } = await supabase
            .from("onboarding_requests")
            .select("plan, status, created_at")
            .eq("client_id", realReferrer.id)
            .order("created_at", { ascending: false })
            .limit(5);

          const liveOrPending =
            (requests ?? []).find((r) => r.status === "live") ??
            (requests ?? []).find((r) => r.status !== "rejected");
          if (liveOrPending?.plan) {
            discountPercent = getDiscountPercentForPlan(liveOrPending.plan);
          }
        }
      } catch {
        // Discount stays 0
      }
    }

    // ── Create invoice (with referral discount applied) ───────────
    const setupAmount = plan.setup;
    const discountAmount =
      discountPercent > 0 ? Math.round((setupAmount * discountPercent) / 100) : 0;
    const invoiceAmount = setupAmount - discountAmount;
    const description =
      discountAmount > 0
        ? `Setup Webstore Storo.id — Paket ${plan.name} (Diskon referral ${discountPercent}%)`
        : `Setup Webstore Storo.id — Paket ${plan.name}`;

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        client_id: client.id,
        type: "setup",
        description,
        amount: invoiceAmount,
        status: "unpaid",
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        provider: "xendit",
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

    if (invoiceError) {
      console.error("[checkout] Invoice insert error:", invoiceError);
      return NextResponse.json(
        { error: "Gagal membuat invoice. Coba lagi." },
        { status: 500 },
      );
    }

    const { error: requestError } = await supabase
      .from("onboarding_requests")
      .insert({
        client_id: client.id,
        plan: planId,
        template_name: "modern",
        requested_slug: slug,
        custom_domain: customDomain?.trim() || null,
        status: "pending",
        invoice_id: invoice.id,
      });

    if (requestError) {
      console.error("[checkout] Onboarding request error:", requestError);
      return NextResponse.json(
        { error: "Gagal menyimpan permintaan toko. Coba lagi atau hubungi tim kami." },
        { status: 500 },
      );
    }

    await supabase.from("onboarding_leads").insert({
      full_name: fullName.trim(),
      phone: phone.trim(),
      shopee_store_link: shopeeStoreLink?.trim() || null,
      plan: planId,
      selected_domain: customDomain?.trim() || selectedDomain?.trim() || null,
      email,
      store_name: storeName?.trim() || null,
      client_id: client.id,
      invoice_id: invoice.id,
      status: "account_created",
    });

    if (effectiveReferralCode) {
      try {
        const sl = sharelinkClient();
        sl.triggerEvent({
          referralCode: effectiveReferralCode,
          eventType: "signup",
          refereeId: userId,
          refereeEmail: email,
          refereeName: fullName.trim(),
          metadata: {
            source: "storo_onboarding_checkout",
            invoice_id: invoice.id,
            plan: planId,
          },
        }).catch((err) => {
          const msg = err instanceof Error ? err.message : String(err);
          if (!msg.includes("Duplicate event")) {
            console.warn("[checkout] signup event fire failed:", msg);
          }
        });
      } catch (err) {
        console.warn(
          "[checkout] sharelinkClient init failed (env vars missing?):",
          err instanceof Error ? err.message : err,
        );
      }
    }

    // ── Create Xendit invoice via edge function (Gateway pattern) ──
    const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://storo.id";
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

    const edgeFnUrl = `${SUPABASE_URL}/functions/v1/storo-billing-invoice`;

    const autoLoginToken = signAutoLoginToken(invoice.id);

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
            given_names: fullName.trim(),
            email,
          },
          success_redirect_url: `${APP_URL}/payment/success?invoice_id=${invoice.id}&t=${autoLoginToken}`,
          failure_redirect_url: `${APP_URL}/payment/failed?invoice_id=${invoice.id}`,
        }),
      });

      if (!edgeFnRes.ok) {
        const errBody = await edgeFnRes.text();
        console.error("[checkout] Edge function error:", edgeFnRes.status, errBody);

        await supabase
          .from("invoices")
          .update({ provider: "manual" })
          .eq("id", invoice.id);

        return NextResponse.json(
          {
            invoiceId: invoice.id,
            xenditInvoiceUrl: null,
            error:
              "Pembayaran online gagal diproses. Anda bisa bayar manual dari dashboard.",
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
      console.error("[checkout] Edge function call failed:", edgeErr);

      await supabase
        .from("invoices")
        .update({ provider: "manual" })
        .eq("id", invoice.id);

      return NextResponse.json(
        {
          invoiceId: invoice.id,
          xenditInvoiceUrl: null,
          error:
            "Pembayaran online gagal diproses. Anda bisa bayar manual dari dashboard.",
        },
        { status: 200 },
      );
    }
  } catch (err) {
    console.error("[checkout] Unexpected error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Coba lagi." },
      { status: 500 },
    );
  }
}
