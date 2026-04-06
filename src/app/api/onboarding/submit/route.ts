import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role key so this works without a user session (no-login onboarding)
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.fullName?.trim() || !body.phone?.trim()) {
    return NextResponse.json({ error: "Nama dan nomor WhatsApp wajib diisi." }, { status: 400 });
  }

  const supabase = getAdminClient();

  // Upsert client — guest_id is a random UUID generated on the client side
  // (no user session required)
  const guestId: string = body.guestId ?? crypto.randomUUID();

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .upsert(
      {
        clerk_user_id: guestId,
        full_name: body.fullName ?? null,
        phone: body.phone ?? null,
        address: body.address ?? null,
        bank_name: body.bankName ?? null,
        bank_account_number: body.bankAccountNumber ?? null,
        ktp_image_url: body.ktpImageUrl ?? null,
        shopee_store_link: body.shopeeStoreLink ?? null,
        shopee_store_id: body.shopeeStoreId ?? null,
        shopee_store_name: body.shopeeStoreName ?? null,
      },
      { onConflict: "clerk_user_id" }
    )
    .select("id")
    .single();

  if (clientError) {
    // Non-blocking: still return success so client sees the WA CTA
    console.error("[onboarding/submit] client upsert error:", clientError.message);
    return NextResponse.json({ success: true, warning: "Data belum tersimpan, tim akan follow up via WhatsApp." });
  }

  // Insert onboarding request
  const { data: req, error: reqError } = await supabase
    .from("onboarding_requests")
    .insert({
      client_id: client.id,
      plan: body.plan ?? null,
      template_id: body.templateId ?? null,
      template_name: body.templateName ?? null,
      store_url: body.selectedDomain ?? null,
      status: "pending",
    })
    .select("id")
    .single();

  if (reqError) {
    console.error("[onboarding/submit] request insert error:", reqError.message);
    return NextResponse.json({ success: true, warning: "Data belum tersimpan, tim akan follow up via WhatsApp." });
  }

  return NextResponse.json({ success: true, request_id: req.id });
}
