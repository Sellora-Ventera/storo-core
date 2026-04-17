import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPlan, formatIDR } from "@/lib/plans";

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

    // ── Create client row ─────────────────────────────────────────
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({
        user_id: userId,
        full_name: fullName.trim(),
        phone: phone.trim(),
        shopee_store_link: shopeeStoreLink?.trim() || null,
        shopee_store_name: storeName?.trim() || null,
      })
      .select("id")
      .single();

    if (clientError) {
      console.error("[checkout] Client insert error:", clientError);
      return NextResponse.json(
        { error: "Gagal menyimpan data profil. Coba lagi." },
        { status: 500 }
      );
    }

    // ── Create onboarding request ─────────────────────────────────
    const { error: requestError } = await supabase
      .from("onboarding_requests")
      .insert({
        client_id: client.id,
        plan: planId,
        template_name: "modern", // default template, changed by engineer later
        requested_slug: slug,
        custom_domain: customDomain?.trim() || null,
        status: "pending",
      });

    if (requestError) {
      console.error("[checkout] Onboarding request error:", requestError);
      // Non-fatal: continue to invoice creation
    }

    // ── Create invoice ────────────────────────────────────────────
    const setupAmount = plan.setup;
    const description = `Setup Webstore Storo.id — Paket ${plan.name}`;

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        client_id: client.id,
        type: "setup",
        description,
        amount: setupAmount,
        status: "unpaid",
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        provider: "xendit",
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

    // ── Create Xendit invoice via edge function (Gateway pattern) ──
    const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://storo.id";
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

    const edgeFnUrl = `${SUPABASE_URL}/functions/v1/strcr-create-invoice`;

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
          success_redirect_url: `${APP_URL}/payment/success?invoice_id=${invoice.id}`,
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
