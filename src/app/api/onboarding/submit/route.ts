import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { fullName, phone, shopeeStoreLink, plan, selectedDomain } = body;

  if (!fullName?.trim() || !phone?.trim() || !plan?.trim()) {
    return NextResponse.json(
      { error: "Nama, nomor WhatsApp, dan paket wajib diisi." },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServiceClient();

  const { error } = await supabase.from("onboarding_leads").insert({
    full_name: fullName.trim(),
    phone: phone.trim(),
    shopee_store_link: shopeeStoreLink?.trim() || null,
    plan: plan.trim(),
    selected_domain: selectedDomain?.trim() || null,
  });

  if (error) {
    console.error("[onboarding/submit]", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data. Coba lagi." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
