import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import AddStoreWizard from "@/components/dashboard/AddStoreWizard";
import { getDiscountPercentForPlan } from "@/lib/plans";

export const metadata = { title: "Tambah Toko Baru — Storo.id" };

export default async function AddStorePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: client } = await supabase
    .from("clients")
    .select("id, full_name, phone, referred_by_code")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!client) redirect("/dashboard");

  // Hitung diskon referral kalau client ini di-refer oleh seseorang.
  // Sumber kebenaran tetap dihitung lagi di POST /api/dashboard/stores —
  // angka di sini hanya untuk UI summary, tidak boleh dipercaya untuk pricing.
  let discountPercent = 0;
  if (client.referred_by_code) {
    const admin = await createSupabaseServiceClient();
    const { data: referrer } = await admin
      .from("clients")
      .select("id")
      .eq("own_referral_code", client.referred_by_code)
      .maybeSingle();

    if (referrer) {
      const { data: requests } = await admin
        .from("onboarding_requests")
        .select("plan, status, created_at")
        .eq("client_id", referrer.id)
        .order("created_at", { ascending: false })
        .limit(5);

      const liveOrPending = (requests ?? []).find((r) => r.status === "live")
        ?? (requests ?? []).find((r) => r.status !== "rejected");
      if (liveOrPending?.plan) {
        discountPercent = getDiscountPercentForPlan(liveOrPending.plan);
      }
    }
  }

  // Auto-fill referral code dari cookie kalau user belum punya attribution.
  // Cookie di-set oleh middleware saat user akses /r/<code> (persist 30 hari),
  // jadi user yang baru aja klik link referral lalu pergi ke /dashboard/stores/new
  // langsung dapet kode-nya pre-filled. Hanya untuk display awal — kalau user
  // ganti/hapus inputnya, backend tetap re-validate.
  const cookieStore = await cookies();
  const cookieReferralCode = cookieStore.get("storo_referral_code")?.value ?? null;
  const prefilledReferralCode =
    !client.referred_by_code && cookieReferralCode ? cookieReferralCode : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/stores"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800 transition-colors cursor-pointer mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Kembali ke Toko Saya
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Tambah Toko Baru</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Pesanan toko baru akan diproses oleh tim VenteraAI setelah pembayaran dikonfirmasi.
        </p>
      </div>

      <AddStoreWizard
        client={{ full_name: client.full_name ?? "", phone: client.phone ?? "" }}
        userEmail={user.email ?? ""}
        discountPercent={discountPercent}
        referralCode={client.referred_by_code ?? null}
        prefilledReferralCode={prefilledReferralCode}
      />
    </div>
  );
}
