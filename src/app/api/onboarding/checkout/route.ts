import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPlan, getDiscountPercentForPlan, formatIDR } from "@/lib/plans";
import { signAutoLoginToken } from "@/lib/auth/auto-login-token";
import { sharelinkClient } from "@/lib/sharelink/client";

// Use raw supabase-js client (not SSR) since this is a stateless API route
// that needs admin access without cookie context
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

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
      email,
      password,
      authMethod,
      referralCode,
    } = body;

    const isGoogleAuth = authMethod === "google";

    // ── Validate required fields ──────────────────────────────────
    if (!fullName?.trim()) {
      return NextResponse.json({ error: "Nama lengkap wajib diisi." }, { status: 400 });
    }
    if (!phone?.trim()) {
      return NextResponse.json({ error: "Nomor WhatsApp wajib diisi." }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email wajib diisi." }, { status: 400 });
    }
    if (!isGoogleAuth && (!password || password.length < 8)) {
      return NextResponse.json({ error: "Password minimal 8 karakter." }, { status: 400 });
    }
    if (!planId?.trim()) {
      return NextResponse.json({ error: "Pilih paket terlebih dahulu." }, { status: 400 });
    }

    const plan = getPlan(planId);
    if (!plan || plan.setup === null) {
      return NextResponse.json(
        { error: "Paket tidak valid. Untuk paket Custom, silakan hubungi tim kami." },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // ── Resolve referral discount (BEFORE creating invoice) ─────────
    // Mirrors the logic in /api/dashboard/stores so first-time checkout
    // and add-store flows compute discount identically. Source of truth
    // is referrer's currently active plan (live > pending). If referrer
    // doesn't exist or has no plan, discount = 0 — invoice charges full
    // setup fee gracefully.
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
        // Fall through — charge full price rather than block checkout
      }
    }

    let userId: string;

    if (isGoogleAuth) {
      // ── Google auth: verify token server-side ───────────────────
      const authHeader = request.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json(
          { error: "Authorization token diperlukan untuk Google sign-up." },
          { status: 401 }
        );
      }

      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(
        authHeader.replace("Bearer ", "")
      );

      if (tokenError || !tokenUser) {
        return NextResponse.json(
          { error: "Token tidak valid. Coba login ulang via Google." },
          { status: 401 }
        );
      }

      // Verify the token email matches the submitted email
      if (tokenUser.email !== email.trim()) {
        return NextResponse.json(
          { error: "Email tidak sesuai dengan akun Google." },
          { status: 403 }
        );
      }

      userId = tokenUser.id;

      // Update user metadata
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          full_name: fullName.trim(),
          referral_code: referralCode || undefined,
        },
      });
      if (updateError) {
        console.error("[checkout] Failed to update user metadata:", updateError);
      }
    } else {
      // ── Email auth: create new user ─────────────────────────────
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email.trim(),
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName.trim(),
          referral_code: referralCode || undefined,
        },
      });

      if (authError) {
        if (authError.message?.includes("already been registered") || authError.message?.includes("already exists")) {
          return NextResponse.json(
            { error: "Email ini sudah terdaftar. Silakan login atau gunakan email lain." },
            { status: 409 }
          );
        }
        console.error("[checkout] Auth error:", authError);
        return NextResponse.json(
          { error: "Gagal membuat akun. Coba lagi." },
          { status: 500 }
        );
      }
      userId = authData.user.id;
    }
    const slug = slugify(storeName?.trim() || fullName.trim());

    // ── Upsert client row (retry-safe: user may already have a client row
    //    from a previous attempt, or from Google OAuth signup) ──────
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
        { onConflict: "user_id" }
      )
      .select("id, referred_by_code")
      .single();

    if (clientError) {
      console.error("[checkout] Client insert error:", clientError);
      return NextResponse.json(
        { error: "Gagal menyimpan data profil. Coba lagi." },
        { status: 500 }
      );
    }

    // ── First-attribution-wins: only set referred_by_code if not already set ──
    // Separate UPDATE (not part of upsert) so we never clobber a referee who
    // already has an earlier attribution (e.g. user signed up via code A, came
    // back through code B's link, and re-submitted the form).
    let effectiveReferralCode = client.referred_by_code as string | null;
    if (normalizedReferralCode && !effectiveReferralCode) {
      await supabase
        .from("clients")
        .update({ referred_by_code: normalizedReferralCode })
        .eq("id", client.id)
        .is("referred_by_code", null);
      effectiveReferralCode = normalizedReferralCode;
    }

    // If the form provided a code but the client was already attributed to a
    // different one, the OLD code wins for discount + signup-event purposes —
    // recompute discount based on the actual stored attribution.
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
        // Discount stays 0 — better than blocking checkout
      }
    }

    // ── Create onboarding request ─────────────────────────────────
    // Fatal: if this fails the user has nothing to show in their dashboard
    // after paying. Better to surface the error before the invoice is created.
    // NOTE: onboarding_request inserted AFTER invoice (below) so we can link
    // them via invoice_id (migration 20260520000008). Dashboard filters by
    // invoice.status='paid' so unpaid requests don't pollute "Status Onboarding".

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
        // Audit trail: store the breakdown so finance can reconcile and the
        // Sharelink purchase event (fired from xendit webhook) can include
        // the original setup amount + discount in its metadata.
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
        { status: 500 }
      );
    }

    // Insert onboarding_request linked to invoice. Order swap means an orphan
    // invoice is possible if THIS insert fails — acceptable; admin reconciles.
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

    // ── Update onboarding_leads with tracking info ────────────────
    await supabase.from("onboarding_leads").insert({
      full_name: fullName.trim(),
      phone: phone.trim(),
      shopee_store_link: shopeeStoreLink?.trim() || null,
      plan: planId,
      selected_domain: customDomain?.trim() || selectedDomain?.trim() || null,
      email: email.trim(),
      store_name: storeName?.trim() || null,
      client_id: client.id,
      invoice_id: invoice.id,
      status: "account_created",
    });

    // ── Fire Sharelink signup event (best-effort) ─────────────────
    // Counts as a "conversion" in the referrer's portal dashboard. Doesn't
    // create a reward (that's gated on the purchase event from xendit webhook
    // — anti-fraud: no reward until they actually pay). Idempotent: Sharelink
    // dedupes per (code, referee_id, event_type), so retries are safe.
    //
    // Fire-and-forget — we don't await. A missed signup ping must NEVER block
    // the user from reaching the payment page. The purchase event later will
    // still create the reward correctly because Sharelink doesn't require a
    // signup event to precede a purchase.
    if (effectiveReferralCode) {
      // Defensive: sharelinkClient() throws synchronously if env vars missing.
      // Don't let it crash the route — invoice is created, user must reach payment.
      try {
        const sl = sharelinkClient();
        sl.triggerEvent({
          referralCode: effectiveReferralCode,
          eventType: "signup",
          refereeId: userId,
          refereeEmail: email.trim(),
          refereeName: fullName.trim(),
          metadata: {
            source: "storo_onboarding_checkout",
            invoice_id: invoice.id,
            plan: planId,
          },
        }).catch((err) => {
          const msg = err instanceof Error ? err.message : String(err);
          // Duplicate event = idempotent retry, not an error
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

    // HMAC token supaya /payment/success bisa auto-login user yang baru
    // bayar sekalipun cookie session-nya hilang (mis. bayar via QR di HP).
    const autoLoginToken = signAutoLoginToken(invoice.id);

    try {
      const edgeFnRes = await fetch(edgeFnUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoice_id: invoice.id,
          description,
          customer: {
            given_names: fullName.trim(),
            email: email.trim(),
          },
          success_redirect_url: `${APP_URL}/payment/success?invoice_id=${invoice.id}&t=${autoLoginToken}`,
          failure_redirect_url: `${APP_URL}/payment/failed?invoice_id=${invoice.id}`,
        }),
      });

      if (!edgeFnRes.ok) {
        const errBody = await edgeFnRes.text();
        console.error("[checkout] Edge function error:", edgeFnRes.status, errBody);

        // Mark invoice as needing manual payment
        await supabase
          .from("invoices")
          .update({ provider: "manual" })
          .eq("id", invoice.id);

        return NextResponse.json({
          invoiceId: invoice.id,
          xenditInvoiceUrl: null,
          error: "Pembayaran online gagal diproses. Anda bisa bayar manual dari dashboard.",
        }, { status: 200 });
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

      return NextResponse.json({
        invoiceId: invoice.id,
        xenditInvoiceUrl: null,
        error: "Pembayaran online gagal diproses. Anda bisa bayar manual dari dashboard.",
      }, { status: 200 });
    }
  } catch (err) {
    console.error("[checkout] Unexpected error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Coba lagi." },
      { status: 500 }
    );
  }
}
