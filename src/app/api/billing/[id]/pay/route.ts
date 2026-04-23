import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const userClient = await createSupabaseServerClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  const supabase = getServiceClient();

  const { data: invoice, error: invErr } = await supabase
    .from("invoices")
    .select("id, client_id, amount, description, type, status, provider, metadata")
    .eq("id", id)
    .single();

  if (invErr || !invoice) {
    return NextResponse.json({ error: "Invoice tidak ditemukan." }, { status: 404 });
  }

  const { data: client } = await supabase
    .from("clients")
    .select("user_id, full_name")
    .eq("id", invoice.client_id)
    .single();

  if (!client || client.user_id !== user.id) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  if (invoice.status === "paid") {
    return NextResponse.json({ error: "Invoice sudah dibayar." }, { status: 400 });
  }

  const existingUrl = (invoice.metadata as Record<string, unknown> | null)?.xendit_invoice_url as
    | string
    | undefined;
  if (invoice.provider === "xendit" && existingUrl) {
    return NextResponse.json({ xenditInvoiceUrl: existingUrl });
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
        description: invoice.description || `Invoice ${invoice.type}`,
        customer: {
          given_names: client.full_name || "Client",
          email: user.email,
        },
        success_redirect_url: `${APP_URL}/payment/success?invoice_id=${invoice.id}`,
        failure_redirect_url: `${APP_URL}/payment/failed?invoice_id=${invoice.id}`,
      }),
    });

    if (!edgeFnRes.ok) {
      const errBody = await edgeFnRes.text();
      console.error("[billing/pay] Edge function error:", edgeFnRes.status, errBody);
      return NextResponse.json(
        { error: "Gagal membuat link pembayaran. Coba lagi atau gunakan transfer manual." },
        { status: 502 }
      );
    }

    const edgeResult = await edgeFnRes.json();
    return NextResponse.json({ xenditInvoiceUrl: edgeResult.invoice_url });
  } catch (err) {
    console.error("[billing/pay] Edge function call failed:", err);
    return NextResponse.json(
      { error: "Pembayaran online gagal. Gunakan transfer manual atau coba lagi nanti." },
      { status: 500 }
    );
  }
}
