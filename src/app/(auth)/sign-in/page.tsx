"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import storoLogo from "@/assets/storo-logo.png";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path d="M47.532 24.552c0-1.636-.141-3.2-.402-4.704H24.48v8.897h12.984c-.56 3.018-2.26 5.576-4.814 7.29v6.056h7.794c4.56-4.2 7.088-10.39 7.088-17.539z" fill="#4285F4" />
      <path d="M24.48 48c6.514 0 11.978-2.16 15.97-5.91l-7.794-6.056c-2.16 1.446-4.92 2.3-8.176 2.3-6.288 0-11.618-4.248-13.522-9.953H2.904v6.25C6.876 42.612 15.106 48 24.48 48z" fill="#34A853" />
      <path d="M10.958 28.381A14.48 14.48 0 0 1 9.72 24c0-1.52.26-2.994.716-4.381v-6.25H2.904A23.97 23.97 0 0 0 .48 24c0 3.864.928 7.52 2.424 10.631l8.054-6.25z" fill="#FBBC05" />
      <path d="M24.48 9.666c3.542 0 6.718 1.218 9.216 3.61l6.912-6.912C36.446 2.428 30.994 0 24.48 0 15.106 0 6.876 5.388 2.904 13.369l8.054 6.25c1.904-5.705 7.234-9.953 13.522-9.953z" fill="#EA4335" />
    </svg>
  );
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirectTo") ?? "/dashboard";
  const redirectTo =
    rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
  };

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
          Masuk ke Akun
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Belum punya akun?{" "}
          <Link href="/sign-up" className="text-primary font-medium hover:underline">
            Daftar gratis
          </Link>
        </p>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg h-11 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {googleLoading ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
          {googleLoading ? "Menghubungkan..." : "Lanjutkan dengan Google"}
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">atau masuk dengan email</span>
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Lupa password?
              </Link>
            </div>
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
            disabled={loading || googleLoading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Masuk...
              </>
            ) : (
              "Masuk"
            )}
          </Button>
        </form>

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
