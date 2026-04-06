"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import storoLogo from "@/assets/storo-logo.png";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
      <path d="M47.532 24.552c0-1.636-.141-3.2-.402-4.704H24.48v8.897h12.984c-.56 3.018-2.26 5.576-4.814 7.29v6.056h7.794c4.56-4.2 7.088-10.39 7.088-17.539z" fill="#4285F4"/>
      <path d="M24.48 48c6.514 0 11.978-2.16 15.97-5.91l-7.794-6.056c-2.16 1.446-4.92 2.3-8.176 2.3-6.288 0-11.618-4.248-13.522-9.953H2.904v6.25C6.876 42.612 15.106 48 24.48 48z" fill="#34A853"/>
      <path d="M10.958 28.381A14.48 14.48 0 0 1 9.72 24c0-1.52.26-2.994.716-4.381v-6.25H2.904A23.97 23.97 0 0 0 .48 24c0 3.864.928 7.52 2.424 10.631l8.054-6.25z" fill="#FBBC05"/>
      <path d="M24.48 9.666c3.542 0 6.718 1.218 9.216 3.61l6.912-6.912C36.446 2.428 30.994 0 24.48 0 15.106 0 6.876 5.388 2.904 13.369l8.054 6.25c1.904-5.705 7.234-9.953 13.522-9.953z" fill="#EA4335"/>
    </svg>
  );
}

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") ?? "/dashboard";
  // Only allow internal paths (prevent open redirect)
  const redirectTo = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${redirectTo}`,
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "Email atau password salah."
          : authError.message
      );
      setLoading(false);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
      <div className="mb-6 text-center">
        <Link href="/">
          <Image src={storoLogo} alt="Storo.id" height={40} className="h-10 w-auto mx-auto" />
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-4">Masuk ke Akun</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola toko online Anda di satu tempat
        </p>
      </div>

      {/* Google — primary */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading || loading}
        className="w-full flex items-center justify-center gap-3 border border-border rounded-lg py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {googleLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        {googleLoading ? "Menghubungkan..." : "Lanjutkan dengan Google"}
      </button>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">atau masuk dengan email</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-3 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="nama@email.com"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
              Lupa password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-3 py-2 pr-10 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Belum punya akun?{" "}
        <Link href="/sign-up" className="text-primary font-medium hover:underline">
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}
