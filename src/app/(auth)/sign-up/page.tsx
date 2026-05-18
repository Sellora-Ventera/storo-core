"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, CheckCircle2, Gift } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import storoLogo from "@/assets/storo-logo.png";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
      <path d="M47.532 24.552c0-1.636-.141-3.2-.402-4.704H24.48v8.897h12.984c-.56 3.018-2.26 5.576-4.814 7.29v6.056h7.794c4.56-4.2 7.088-10.39 7.088-17.539z" fill="#4285F4" />
      <path d="M24.48 48c6.514 0 11.978-2.16 15.97-5.91l-7.794-6.056c-2.16 1.446-4.92 2.3-8.176 2.3-6.288 0-11.618-4.248-13.522-9.953H2.904v6.25C6.876 42.612 15.106 48 24.48 48z" fill="#34A853" />
      <path d="M10.958 28.381A14.48 14.48 0 0 1 9.72 24c0-1.52.26-2.994.716-4.381v-6.25H2.904A23.97 23.97 0 0 0 .48 24c0 3.864.928 7.52 2.424 10.631l8.054-6.25z" fill="#FBBC05" />
      <path d="M24.48 9.666c3.542 0 6.718 1.218 9.216 3.61l6.912-6.912C36.446 2.428 30.994 0 24.48 0 15.106 0 6.876 5.388 2.904 13.369l8.054 6.25c1.904-5.705 7.234-9.953 13.522-9.953z" fill="#EA4335" />
    </svg>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    // Pick up referral code stored by /r/[code] page (sessionStorage script tag)
    // or by middleware (cookie). sessionStorage wins because it's same-tab and
    // implies fresh intent.
    const fromSession = sessionStorage.getItem("storo_referral_code");
    if (fromSession) {
      setReferralCode(fromSession);
      return;
    }
    const cookieMatch = document.cookie.match(/(?:^|;\s*)storo_referral_code=([^;]+)/);
    if (cookieMatch) setReferralCode(decodeURIComponent(cookieMatch[1]));
  }, []);

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    // Pass the referral code via the OAuth `next` URL so /api/auth/callback
    // can stash it on the new client row. Cookie storo_referral_code is set
    // by middleware and survives the OAuth round-trip too as a fallback.
    const next = referralCode
      ? `/onboarding?ref=${encodeURIComponent(referralCode)}`
      : "/onboarding";
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
  };

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

        {/* Google OAuth — primary path */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={googleLoading || loading}
          className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
          <span>{googleLoading ? "Menghubungkan..." : "Daftar dengan Google"}</span>
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">atau daftar dengan email</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

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
            disabled={loading || googleLoading}
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
