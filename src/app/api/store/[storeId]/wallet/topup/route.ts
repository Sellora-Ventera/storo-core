import { NextResponse } from "next/server";
import { authorizeStoreApi } from "@/lib/store/context";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MIN_TOPUP = 500_000; // IDR 500.000

export async function POST(
  request: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await context.params;

  const auth = await authorizeStoreApi(storeId);
  if (auth instanceof NextResponse) return auth;

  let body: { amount?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body tidak valid." }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isInteger(amount) || amount < MIN_TOPUP) {
    return NextResponse.json(
      { error: `Minimum top up Rp 500.000. Masukkan jumlah yang valid.` },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServiceClient();

  // Get store info for customer name
  const { data: store } = await supabase
    .from("stores")
    .select("name")
    .eq("id", storeId)
    .single();

  const storeName = store?.name ?? "Seller";
  const clientName = storeName;

  const externalId = `STORO-WALLET-${storeId}-${Date.now()}`;
  const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY;
  const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://storo.id";

  if (!XENDIT_SECRET_KEY) {
    console.error("[wallet/topup] XENDIT_SECRET_KEY not set");
    return NextResponse.json(
      { error: "Konfigurasi pembayaran tidak tersedia. Hubungi tim Storo." },
      { status: 500 }
    );
  }

  try {
    const xenditRes = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(XENDIT_SECRET_KEY + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        external_id: externalId,
        amount,
        description: `Top Up Wallet Storo — ${storeName}`,
        payer_email: `wallet+${storeId}@storo.id`,
        customer: {
          given_names: clientName,
        },
        success_redirect_url: `${APP_URL}/dashboard/${storeId}/wallet?topup=success`,
        failure_redirect_url: `${APP_URL}/dashboard/${storeId}/wallet?topup=failed`,
        currency: "IDR",
      }),
    });

    if (!xenditRes.ok) {
      const errBody = await xenditRes.text();
      console.error("[wallet/topup] Xendit error:", xenditRes.status, errBody);
      return NextResponse.json(
        { error: "Gagal membuat invoice pembayaran. Coba lagi." },
        { status: 502 }
      );
    }

    const xenditData = await xenditRes.json();
    return NextResponse.json({
      invoice_url: xenditData.invoice_url,
      invoice_id: xenditData.id,
      external_id: externalId,
    });
  } catch (err) {
    console.error("[wallet/topup] Unexpected error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Coba lagi." },
      { status: 500 }
    );
  }
}
