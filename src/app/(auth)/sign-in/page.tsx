"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import storoLogo from "@/assets/storo-logo.png";

const SSO_FALLBACK_ENABLED = process.env.NEXT_PUBLIC_SSO_FALLBACK === "true";

function ssoErrorMessage(error: string | null, reason: string | null): string | null {
  if (!error) return null;
  switch (error) {
    case "sso_state_missing":
      return "Sesi login kedaluwarsa. Silakan coba lagi.";
    case "sso_provider_error":
      return `Login Ventera SSO gagal${reason ? `: ${reason}` : ""}.`;
    case "sso_exchange_failed":
      return "Gagal menukar kode login dengan Ventera SSO. Silakan coba lagi.";
    case "sso_missing_claims":
      return "Akun Ventera SSO tidak mengirim email. Hubungi admin untuk lengkapi profil.";
    case "sso_sync_failed":
      return "Gagal sinkronisasi akun Ventera SSO ke Storo. Silakan coba lagi atau hubungi support.";
    case "sso_discovery_failed":
      return "Tidak dapat terhubung ke server Ventera SSO. Cek koneksi internet atau coba lagi.";
    case "sso_not_configured":
      return "SSO belum dikonfigurasi di server ini. Hubungi admin.";
    case "auth_callback_failed":
      return reason ? `Login gagal: ${reason}` : "Login gagal.";
    default:
      return reason ? `${error}: ${reason}` : error;
  }
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirectTo") ?? "/dashboard";
  const redirectTo =
    rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/dashboard";

  const ssoError = ssoErrorMessage(
    searchParams.get("error"),
    searchParams.get("reason"),
  );

  const ssoHref = `/auth/sso/login?next=${encodeURIComponent(redirectTo)}`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Email atau password salah. Silakan coba lagi."
          : error.message
      );
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  };

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
          Masuk ke Akun
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Login terpadu dengan akun Ventera Anda.
        </p>

        {ssoError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
            {ssoError}
          </div>
        )}

        <Link
          href={ssoHref}
          className="w-full inline-flex items-center justify-center gap-3 rounded-lg h-11 bg-primary text-white font-medium hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          Lanjutkan dengan Ventera SSO
        </Link>

        <p className="text-xs text-gray-400 text-center mt-3">
          Belum punya akun Ventera? Akun otomatis dibuat saat login pertama.
        </p>

        {SSO_FALLBACK_ENABLED && (
          <>
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">fallback dev: email & password</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <form onSubmit={handleSignIn} className="space-y-5">
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
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
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
                    Masuk...
                  </>
                ) : (
                  "Masuk (fallback)"
                )}
              </Button>
            </form>
          </>
        )}

        <p className="text-xs text-gray-400 text-center mt-6">
          Dengan masuk, Anda menyetujui{" "}
          <Link href="/terms" className="underline hover:text-gray-600">
            Syarat & Ketentuan
          </Link>{" "}
          dan{" "}
          <Link href="/privacy" className="underline hover:text-gray-600">
            Kebijakan Privasi
          </Link>{" "}
          kami.
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
