import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Gift } from "lucide-react";
import storoLogo from "@/assets/storo-logo.png";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface ReferralPageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: ReferralPageProps) {
  const { code } = await params;
  return {
    title: "Anda Diundang ke Storo.id — Buka Toko Online dari Shopee",
    description:
      "Teman Anda mengundang Anda untuk bergabung di Storo.id. Buka toko online dari produk Shopee Anda dalam 3 hari.",
    robots: { index: false },
  };
}

export default async function ReferralPage({ params }: ReferralPageProps) {
  const { code } = await params;

  // Set referral cookie (server-side, 30 days)
  const cookieStore = await cookies();
  cookieStore.set("storo_referral_code", code, {
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
  });

  // Fetch referrer name from Supabase
  let referrerName: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("clients")
      .select("full_name, store_name")
      .eq("referral_code", code)
      .single();
    if (data) {
      referrerName = data.full_name || data.store_name || null;
    }
  } catch {
    // Silently fail — generic message will be shown
  }

  const benefits = [
    "Import produk dari Shopee otomatis",
    "Domain & hosting termasuk",
    "Payment gateway & ongkos kirim otomatis",
    "Dashboard toko lengkap",
  ];

  return (
    <>
      {/* sessionStorage script — ensures sign-up page picks up referral code */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            try {
              sessionStorage.setItem("storo_referral_code", ${JSON.stringify(code)});
            } catch(e) {}
          `,
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 font-inter">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/80 to-secondary" />

        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4px)] px-4 py-16">
          {/* Card */}
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-primary/10 border border-gray-100 overflow-hidden">

            {/* Header section */}
            <div className="bg-gradient-to-br from-primary to-primary/80 px-8 py-10 text-white text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-white rounded-2xl px-6 py-3 shadow-lg">
                  <Image
                    src={storoLogo}
                    alt="Storo.id"
                    height={36}
                    className="h-9 w-auto"
                    priority
                  />
                </div>
              </div>

              {/* Invitation badge */}
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-5 border border-white/30">
                <Gift className="w-4 h-4" />
                <span>Undangan Eksklusif</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-3">
                Teman Anda mengundang Anda ke Storo.id
              </h1>

              {referrerName ? (
                <p className="text-white/90 text-base">
                  Diundang oleh:{" "}
                  <span className="font-semibold text-white">{referrerName}</span>
                </p>
              ) : (
                <p className="text-white/80 text-base">
                  Bergabunglah bersama ribuan penjual Shopee yang sudah punya toko sendiri
                </p>
              )}
            </div>

            {/* Body */}
            <div className="px-8 py-8">
              {/* Value prop */}
              <div className="text-center mb-7">
                <p className="text-lg font-semibold text-gray-800">
                  Buka toko online dari produk Shopee Anda
                  <span className="text-primary"> dalam 3 hari</span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Tanpa coding. Tanpa ribet. Langsung jualan.
                </p>
              </div>

              {/* Benefits */}
              <ul className="space-y-3 mb-8">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* Referral code display */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Kode referral Anda</p>
                  <p className="font-mono font-bold text-primary tracking-widest text-sm">{code}</p>
                </div>
                <span className="text-xs bg-secondary/10 text-secondary font-semibold px-2.5 py-1 rounded-full border border-secondary/20">
                  Aktif
                </span>
              </div>

              {/* CTA */}
              <Link
                href="/sign-up"
                className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 active:bg-primary/80 text-white font-semibold text-base py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-primary/25 hover:shadow-primary/40 group"
              >
                Daftar Sekarang
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <p className="text-center mt-4 text-sm text-gray-500">
                Sudah punya akun?{" "}
                <Link href="/sign-in" className="text-primary font-medium hover:underline">
                  Masuk
                </Link>
              </p>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
            <span>🔒 Data aman & terenkripsi</span>
            <span>✅ Lebih dari 500+ toko aktif</span>
            <span>⭐ Rating 4.9/5</span>
          </div>

          {/* Footer note */}
          <p className="mt-6 text-xs text-gray-400 text-center max-w-sm">
            Dengan mendaftar, Anda menyetujui{" "}
            <Link href="/terms" className="underline hover:text-primary">
              Syarat & Ketentuan
            </Link>{" "}
            dan{" "}
            <Link href="/privacy" className="underline hover:text-primary">
              Kebijakan Privasi
            </Link>{" "}
            Storo.id.
          </p>
        </div>
      </div>
    </>
  );
}
