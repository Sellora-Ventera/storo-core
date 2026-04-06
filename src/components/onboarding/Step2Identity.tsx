"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import type { WizardState } from "./OnboardingWizard";

const BANK_OPTIONS = [
  "BCA",
  "BNI",
  "BRI",
  "Mandiri",
  "CIMB",
  "BSI",
  "Permata",
  "Danamon",
  "Lainnya",
];

interface Step2Props {
  state: WizardState;
  goNext: () => void;
  goBack: () => void;
  updateState: (partial: Partial<WizardState>) => void;
}

export default function Step2Identity({ state, goNext, goBack, updateState }: Step2Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!state.ktpImageUrl.trim()) newErrors.ktpImageUrl = "Link foto KTP wajib diisi";
    if (!state.bankName) newErrors.bankName = "Nama bank wajib dipilih";
    if (!state.bankAccountNumber.trim()) newErrors.bankAccountNumber = "Nomor rekening wajib diisi";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) goNext();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Data Identitas</h2>
      <p className="text-sm text-gray-500 mb-6">Kami memerlukan identitas untuk verifikasi akun Anda.</p>

      {/* Info Box */}
      <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
        <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700">
          Data identitas Anda digunakan untuk verifikasi dan pencairan dana ke rekening Anda.
        </p>
      </div>

      <div className="space-y-5">
        {/* KTP Image URL */}
        <div className="space-y-1.5">
          <Label htmlFor="ktpImageUrl">
            URL Foto KTP <span className="text-red-500">*</span>
          </Label>
          <Input
            id="ktpImageUrl"
            type="text"
            value={state.ktpImageUrl}
            onChange={(e) => updateState({ ktpImageUrl: e.target.value })}
            placeholder="https://drive.google.com/..."
          />
          <p className="text-xs text-gray-400">
            Upload foto KTP Anda ke Google Drive atau layanan cloud, lalu paste link di sini.
          </p>
          {errors.ktpImageUrl && <p className="text-red-500 text-sm mt-1">{errors.ktpImageUrl}</p>}
        </div>

        {/* Bank Name */}
        <div className="space-y-1.5">
          <Label htmlFor="bankName">
            Nama Bank <span className="text-red-500">*</span>
          </Label>
          <select
            id="bankName"
            value={state.bankName}
            onChange={(e) => updateState({ bankName: e.target.value })}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Pilih bank...</option>
            {BANK_OPTIONS.map((bank) => (
              <option key={bank} value={bank}>
                {bank}
              </option>
            ))}
          </select>
          {errors.bankName && <p className="text-red-500 text-sm mt-1">{errors.bankName}</p>}
        </div>

        {/* Bank Account Number */}
        <div className="space-y-1.5">
          <Label htmlFor="bankAccountNumber">
            Nomor Rekening <span className="text-red-500">*</span>
          </Label>
          <Input
            id="bankAccountNumber"
            type="text"
            value={state.bankAccountNumber}
            onChange={(e) => updateState({ bankAccountNumber: e.target.value })}
            placeholder="Masukkan nomor rekening"
          />
          {errors.bankAccountNumber && (
            <p className="text-red-500 text-sm mt-1">{errors.bankAccountNumber}</p>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={goBack}>
          ← Kembali
        </Button>
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
