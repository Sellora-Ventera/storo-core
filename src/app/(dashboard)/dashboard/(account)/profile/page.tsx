"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, CreditCard, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ClientProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);

  // Editable fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/sign-in");
        return;
      }

      setEmail(user.email ?? "");

      const { data: client } = await supabase
        .from("clients")
        .select("id, full_name, phone, address, bank_name, bank_account_number, created_at")
        .eq("user_id", user.id)
        .single();

      if (client) {
        const c = client as ClientProfile;
        setClientId(c.id);
        setFullName(c.full_name ?? "");
        setPhone(c.phone ?? "");
        setAddress(c.address ?? "");
        setBankName(c.bank_name ?? "");
        setBankAccountNumber(c.bank_account_number ?? "");
        setCreatedAt(c.created_at);
      }

      setLoading(false);
    }

    init();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;

    setSaving(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    const { error: updateError } = await supabase
      .from("clients")
      .update({
        full_name: fullName,
        phone,
        address,
        bank_name: bankName,
        bank_account_number: bankAccountNumber,
      })
      .eq("id", clientId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSuccess(true);
    setSaving(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-gray-500 mt-1">Kelola informasi akun dan data pembayaran Anda.</p>
      </div>

      {/* Success toast */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-green-700">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Profil berhasil disimpan!</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal info */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
              <User className="w-4.5 h-4.5 text-primary" />
            </div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Informasi Pribadi
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Read-only email */}
            <div className="space-y-1.5">
              <Label className="text-gray-500">Email (hanya baca)</Label>
              <Input value={email} readOnly disabled className="bg-gray-50 text-gray-500 cursor-not-allowed" />
            </div>

            {/* Read-only created_at */}
            <div className="space-y-1.5">
              <Label className="text-gray-500">Bergabung Sejak (hanya baca)</Label>
              <Input
                value={createdAt
                  ? new Date(createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : ""}
                readOnly
                disabled
                className="bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nama Lengkap</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nama lengkap Anda"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Nomor WhatsApp</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="address">Alamat</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Alamat lengkap Anda"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Bank info */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-secondary/10 rounded-lg flex items-center justify-center">
              <CreditCard className="w-4.5 h-4.5 text-secondary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Informasi Bank
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Untuk pencairan dana Anda</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bank_name">Nama Bank</Label>
              <Input
                id="bank_name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Contoh: BCA, BRI, Mandiri"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bank_account_number">Nomor Rekening</Label>
              <Input
                id="bank_account_number"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="1234567890"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-white cursor-pointer px-8"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Perubahan"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
