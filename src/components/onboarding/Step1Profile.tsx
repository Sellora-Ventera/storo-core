"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import type { WizardState } from "./OnboardingWizard";

interface Step1Props {
  state: WizardState;
  goNext: () => void;
  updateState: (partial: Partial<WizardState>) => void;
}

export default function Step1Profile({ state, goNext, updateState }: Step1Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!state.shopeeStoreLink.trim()) {
      setVerifyError("Masukkan link toko Shopee terlebih dahulu");
      return;
    }

    setVerifying(true);
    setVerifyError(null);
    // Reset verification state when re-verifying
    updateState({ shopeeVerified: false, shopeeStoreId: "", shopeeStoreName: "" });

    try {
      const res = await fetch("/api/verify-shopee-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: state.shopeeStoreLink.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setVerifyError(data.error || "Verifikasi gagal. Coba lagi.");
      } else {
        updateState({
          shopeeVerified: true,
          shopeeStoreId: data.store_id,
          shopeeStoreName: data.store_name,
        });
      }
    } catch {
      setVerifyError("Gagal terhubung ke server. Periksa koneksi Anda.");
    } finally {
      setVerifying(false);
    }
  };

  const handleShopeeChange = (value: string) => {
    // Reset verification when URL changes
    updateState({
      shopeeStoreLink: value,
      shopeeVerified: false,
      shopeeStoreId: "",
      shopeeStoreName: "",
    });
    setVerifyError(null);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!state.fullName.trim()) newErrors.fullName = "Nama lengkap wajib diisi";
    if (!state.phone.trim()) {
      newErrors.phone = "Nomor WhatsApp wajib diisi";
    } else if (!/^(08|\+62)/.test(state.phone.trim())) {
      newErrors.phone = "Nomor harus diawali 08 atau +62";
    }
    if (!state.shopeeStoreLink.trim()) {
      newErrors.shopeeStoreLink = "Link toko Shopee wajib diisi";
    } else if (!state.shopeeVerified) {
      newErrors.shopeeStoreLink = "Verifikasi link toko Shopee terlebih dahulu";
    }
    if (!state.address.trim()) newErrors.address = "Alamat usaha wajib diisi";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) goNext();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Profil Anda</h2>
      <p className="text-sm text-gray-500 mb-6">Lengkapi data profil untuk memulai proses pembuatan toko.</p>

      <div className="space-y-5">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Nama Lengkap <span className="text-red-500">*</span></Label>
          <Input
            id="fullName"
            type="text"
            value={state.fullName}
            onChange={(e) => updateState({ fullName: e.target.value })}
            placeholder="Masukkan nama lengkap Anda"
          />
          {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
        </div>

        {/* WhatsApp */}
        <div className="space-y-1.5">
          <Label htmlFor="phone">Nomor WhatsApp <span className="text-red-500">*</span></Label>
          <Input
            id="phone"
            type="tel"
            value={state.phone}
            onChange={(e) => updateState({ phone: e.target.value })}
            placeholder="08xxxxxxxxxx"
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>

        {/* Shopee Store Link */}
        <div className="space-y-1.5">
          <Label htmlFor="shopeeStoreLink">
            Link Toko Shopee <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="shopeeStoreLink"
              type="url"
              value={state.shopeeStoreLink}
              onChange={(e) => handleShopeeChange(e.target.value)}
              placeholder="https://shopee.co.id/namatoko"
              className={
                state.shopeeVerified
                  ? "border-green-400 focus-visible:ring-green-300"
                  : ""
              }
              disabled={verifying}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleVerify}
              disabled={verifying || !state.shopeeStoreLink.trim()}
              className="shrink-0 min-w-[110px]"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Cek...
                </>
              ) : state.shopeeVerified ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1.5 text-green-500" />
                  Terverifikasi
                </>
              ) : (
                "Verifikasi"
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-400">
            Paste link toko Shopee Anda, lalu klik Verifikasi. Contoh:{" "}
            <span className="font-mono">https://shopee.co.id/namatoko</span>
          </p>

          {/* Verification success badge */}
          {state.shopeeVerified && state.shopeeStoreName && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-1">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800 truncate">
                  {state.shopeeStoreName}
                </p>
                <p className="text-xs text-green-600">Toko berhasil diverifikasi</p>
              </div>
              <a
                href={state.shopeeStoreLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-500 hover:text-green-700 shrink-0"
                title="Buka di Shopee"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Verify error */}
          {verifyError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-1">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{verifyError}</p>
            </div>
          )}

          {errors.shopeeStoreLink && !verifyError && (
            <p className="text-red-500 text-sm mt-1">{errors.shopeeStoreLink}</p>
          )}
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <Label htmlFor="address">Alamat Usaha <span className="text-red-500">*</span></Label>
          <Textarea
            id="address"
            value={state.address}
            onChange={(e) => updateState({ address: e.target.value })}
            placeholder="Masukkan alamat lengkap usaha Anda"
            rows={3}
          />
          {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          onClick={handleNext}
          className="bg-primary text-white hover:bg-primary/90 px-8"
        >
          Lanjut →
        </Button>
      </div>
    </div>
  );
}
