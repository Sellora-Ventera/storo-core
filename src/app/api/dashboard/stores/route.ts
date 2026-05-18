import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPlan } from "@/lib/plans";

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
    } = body as {
      plan?: string;
      websiteName?: string;
      customDomain?: string;
      storeName?: string;
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
      .select("id, full_name, phone")
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

    const setupAmount = plan.setup;
    const description = `Setup Webstore Storo.id — Paket ${plan.name} (${slug})`;

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        client_id: client.id,
        type: "setup",
        description,
        amount: setupAmount,
        status: "unpaid",
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        provider: "xendit",
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
