"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import storoLogo from "@/assets/storo-logo.png";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    // Pick up referral code stored by /r/[code] page
    const code = sessionStorage.getItem("storo_referral_code");
    if (code) setReferralCode(code);
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          referral_code: referralCode ?? undefined,
        },
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user && !data.session) {
      // Email confirmation required
      setSuccess(true);
      setLoading(false);
      return;
    }

    // Auto-confirmed (e.g. dev mode) — go straight to onboarding
    router.push("/onboarding");
    router.refresh();
  };

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Cek Email Kamu!
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            Kami kirim link konfirmasi ke{" "}
            <span className="font-semibold text-gray-900">{email}</span>.
            Klik link tersebut untuk mengaktifkan akun dan lanjut ke onboarding.
          </p>
          <p className="text-xs text-gray-400">
            Tidak menerima email?{" "}
            <button
              className="text-primary underline cursor-pointer"
              onClick={() => setSuccess(false)}
            >
              Coba lagi
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        {/* Logo */}
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
          <div className="bg-secondary/10 border border-secondary/20 text-secondary-foreground text-sm rounded-lg px-4 py-3 mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-secondary flex-shrink-0" />
            <span>
              Kode referral <strong>{referralCode}</strong> aktif — Anda akan mendapat diskon setup fee!
            </span>
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nama Lengkap</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Nama lengkap Anda"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="h-11 pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full btn-hero h-11 cursor-pointer"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Membuat akun...
              </>
            ) : (
              "Daftar Sekarang"
            )}
          </Button>
        </form>

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
