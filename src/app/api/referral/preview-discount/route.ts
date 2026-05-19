import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getDiscountPercentForPlan, getPlan } from "@/lib/plans";

export const dynamic = "force-dynamic";

/**
 * Public endpoint untuk personalize /r/[code] landing + checkout discount.
 *
 * Flow:
 *   GET /api/referral/preview-discount?code=STORO-XXXXXX
 *   → Lookup clients.own_referral_code → ambil active plan dari onboarding_requests
 *   → Return { valid, discountPercent, referrerName, referrerPlan }
 *
 * CORS: open (`Access-Control-Allow-Origin: *`) karena dipanggil dari halaman
 * /r/[code] yang bisa di-share lewat link mana saja.
 *
 * Sharelink TIDAK menyimpan discount_config — sumber kebenaran ada di Storo
 * (lihat plan: "Opsi B — lookup real-time di Storo"). Discount % berubah
 * otomatis kalau referrer upgrade plan, tanpa perlu sync ke Sharelink.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")?.trim();

  if (!code) {
    return jsonCORS({ valid: false, error: "Missing code parameter" }, 400);
  }

  const supabase = await createSupabaseServiceClient();

  // 1. Find the client (referrer) who owns this code
  const { data: client, error: clientErr } = await supabase
    .from("clients")
    .select("id, full_name, user_id, own_referral_code")
    .eq("own_referral_code", code)
    .maybeSingle();

  if (clientErr || !client) {
    return jsonCORS({ valid: false }, 200);
  }

  // 2. Determine referrer's active plan
  //    Storo merchants can have multiple stores; pick the most recent live
  //    onboarding_request as the "active plan" signal. Fallback to the latest
  //    pending one if no live store exists yet (new referrer who's already
  //    signed up but not deployed).
  const { data: requests } = await supabase
    .from("onboarding_requests")
    .select("plan, status, created_at")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const liveOrPending = (requests ?? []).find((r) => r.status === "live")
    ?? (requests ?? []).find((r) => r.status !== "rejected");
  const planId = liveOrPending?.plan ?? null;

  if (!planId) {
    // Referrer signed up but no plan yet — kode valid tapi diskon 0 sampai plan aktif
    return jsonCORS({
      valid: true,
      referrerName: client.full_name ?? "Storo merchant",
      referrerPlan: null,
      discountPercent: 0,
      capRupiah: null,
    });
  }

  const plan = getPlan(planId);
  const discountPercent = getDiscountPercentForPlan(planId);

  return jsonCORS({
    valid: true,
    referrerName: client.full_name ?? "Storo merchant",
    referrerPlan: plan?.name ?? planId,
    discountPercent,
    capRupiah: null, // no nominal cap per user decision
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

function jsonCORS(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
