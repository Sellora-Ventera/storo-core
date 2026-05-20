"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Gift, LogIn } from "lucide-react";
import storoLogo from "@/assets/storo-logo.png";

export default function SignUpPage() {
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    const fromSession = sessionStorage.getItem("storo_referral_code");
    if (fromSession) {
      setReferralCode(fromSession);
      return;
    }
    const cookieMatch = document.cookie.match(/(?:^|;\s*)storo_referral_code=([^;]+)/);
    if (cookieMatch) setReferralCode(decodeURIComponent(cookieMatch[1]));
  }, []);

  const next = referralCode
    ? `/onboarding?ref=${encodeURIComponent(referralCode)}`
    : "/onboarding";
  const ssoHref = `/auth/sso/login?next=${encodeURIComponent(next)}`;

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex justify-center mb-8">
          <Image
            src={storoLogo}
            alt="Storo.id"
            height={44}
            width={140}
            priority
            className="h-11 w-auto object-contain"
          />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">
          Buat Akun Gratis
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Sudah punya akun?{" "}
          <Link href="/sign-in" className="text-primary font-medium hover:underline">
            Masuk di sini
          </Link>
        </p>

        {referralCode && (
          <div className="relative mb-6 overflow-hidden rounded-xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-emerald-50/60 to-white px-4 py-3.5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30">
                <Gift className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700/90">
                  Kode referral aktif
                </p>
                <p className="mt-0.5 font-mono text-base font-bold tracking-wider text-emerald-900">
                  {referralCode}
                </p>
                <p className="mt-1 text-xs text-emerald-700/80">
                  Diskon setup fee akan otomatis di-apply saat onboarding
                </p>
              </div>
            </div>
          </div>
        )}

        <Link
          href={ssoHref}
          className="w-full inline-flex items-center justify-center gap-3 rounded-lg h-11 bg-primary text-white font-medium hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          Daftar dengan Ventera SSO
        </Link>

        <p className="text-xs text-gray-400 text-center mt-3">
          Akun Storo otomatis dibuat saat pertama kali login via Ventera SSO.
        </p>

        <p className="text-xs text-gray-400 text-center mt-6">
          Dengan mendaftar, Anda menyetujui{" "}
          <Link href="/terms" className="underline hover:text-gray-600">
            Syarat & Ketentuan
          </Link>{" "}
          dan{" "}
          <Link href="/privacy" className="underline hover:text-gray-600">
            Kebijakan Privasi
          </Link>{" "}
          kami.
        </p>

        <p className="text-sm text-gray-500 text-center mt-4">
          Mau langsung pesan toko?{" "}
          <Link href="/onboarding" className="text-primary font-medium hover:underline">
            Pesan di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
