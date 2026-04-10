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
      email,
      password,
      referralCode,
    } = body;

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
    if (!password || password.length < 8) {
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

    // ── Create Supabase Auth user ─────────────────────────────────
    // admin.createUser will error if email already exists — we handle that below
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true, // Auto-confirm so user can login immediately
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

    const userId = authData.user.id;
    const slug = slugify(storeName?.trim() || fullName.trim());

    // ── Create client row ─────────────────────────────────────────
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({
        user_id: userId,
        full_name: fullName.trim(),
        whatsapp: phone.trim(),
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
        custom_domain: selectedDomain?.trim() || null,
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
      selected_domain: selectedDomain?.trim() || null,
      email: email.trim(),
      store_name: storeName?.trim() || null,
      client_id: client.id,
      invoice_id: invoice.id,
      status: "account_created",
    });

    // ── Create Xendit invoice ─────────────────────────────────────
    const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY;
    if (!XENDIT_SECRET_KEY) {
      // Xendit not configured — return invoice ID so user can pay later
      return NextResponse.json({
        invoiceId: invoice.id,
        xenditInvoiceUrl: null,
        message: "Invoice dibuat. Pembayaran online belum tersedia, hubungi admin.",
      });
    }

    const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://storo.id";
    const externalId = `storo-${invoice.id}`;

    const xenditPayload = {
      external_id: externalId,
      amount: setupAmount,
      currency: "IDR",
      description,
      customer: {
        given_names: fullName.trim(),
        email: email.trim(),
        mobile_number: phone.trim().startsWith("+62")
          ? phone.trim()
          : `+62${phone.trim().replace(/^0/, "")}`,
      },
      customer_notification_preference: {
        invoice_created: ["whatsapp", "email"],
        invoice_reminder: ["whatsapp", "email"],
        invoice_paid: ["whatsapp", "email"],
      },
      success_redirect_url: `${APP_URL}/payment/success?invoice_id=${invoice.id}`,
      failure_redirect_url: `${APP_URL}/payment/failed?invoice_id=${invoice.id}`,
      invoice_duration: 86400 * 3, // 3 days
      payment_methods: ["BANK_TRANSFER", "EWALLET", "QR_CODE", "CREDIT_CARD"],
      locale: "id",
      items: [
        {
          name: description,
          quantity: 1,
          price: setupAmount,
          category: "Service",
        },
      ],
    };

    const xenditResponse = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(XENDIT_SECRET_KEY + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(xenditPayload),
    });

    if (!xenditResponse.ok) {
      const errText = await xenditResponse.text();
      console.error("[checkout] Xendit API error:", xenditResponse.status, errText);

      // Mark invoice as needing manual payment
      await supabase
        .from("invoices")
        .update({ provider: "manual" })
        .eq("id", invoice.id);

      return NextResponse.json({
        invoiceId: invoice.id,
        xenditInvoiceUrl: null,
        error: "Pembayaran online gagal diproses. Anda bisa bayar manual dari dashboard.",
      }, { status: 200 }); // 200 because account + invoice were created successfully
    }

    const xenditInvoice = await xenditResponse.json();

    // Update invoice with Xendit metadata
    await supabase
      .from("invoices")
      .update({
        provider: "xendit",
        provider_ref: xenditInvoice.id,
        metadata: {
          xendit_invoice_id: xenditInvoice.id,
          xendit_invoice_url: xenditInvoice.invoice_url,
          xendit_external_id: externalId,
        },
      })
      .eq("id", invoice.id);

    return NextResponse.json({
      invoiceId: invoice.id,
      xenditInvoiceUrl: xenditInvoice.invoice_url,
    });
  } catch (err) {
    console.error("[checkout] Unexpected error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Coba lagi." },
      { status: 500 }
    );
  }
}
