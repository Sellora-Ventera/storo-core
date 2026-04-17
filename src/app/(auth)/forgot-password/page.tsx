"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import storoLogo from "@/assets/storo-logo.png";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=/dashboard`,
        shouldCreateUser: false,
      },
    });
    if (error) {
      setError(
        error.message.includes("not found") || error.message.includes("User not found")
          ? "Email tidak terdaftar. Silakan daftar terlebih dahulu."
          : error.message
      );
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <Link href="/">
            <Image src={storoLogo} alt="Storo.id" height={40} className="h-10 w-auto mx-auto" />
          </Link>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Sparkles size={20} className="text-primary" />
            <h1 className="text-2xl font-bold">Magic Link</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Masuk tanpa password — kami kirimkan link login ke email Anda
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <CheckCircle2 size={48} className="text-green-500 mx-auto" />
            <div>
              <p className="font-semibold text-foreground">Link terkirim!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Cek inbox <strong>{email}</strong> dan klik link untuk masuk langsung.
              </p>
              <p className="text-xs text-muted-foreground mt-2">Link berlaku 10 menit. Cek folder spam jika tidak muncul.</p>
            </div>
            <Link href="/sign-in">
              <Button variant="outline" className="w-full">Kembali ke Login</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3">
                {error}
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <Button type="submit" disabled={loading} className="btn-hero w-full">
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Sparkles size={16} className="mr-2" />
                  Kirim Magic Link
                </>
              )}
            </Button>
            <Link href="/sign-in" className="block text-center text-sm text-muted-foreground hover:text-primary">
              Kembali ke Login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
