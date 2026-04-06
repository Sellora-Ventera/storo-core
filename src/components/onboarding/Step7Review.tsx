"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import type { WizardState } from "./OnboardingWizard";

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  business: "Business",
  enterprise: "Enterprise",
};

const PLAN_SETUP: Record<string, number> = {
  starter: 1500000,
  business: 3500000,
  enterprise: 7500000,
};

const PLAN_MONTHLY: Record<string, number> = {
  starter: 250000,
  business: 500000,
  enterprise: 1000000,
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

interface ReviewRowProps {
  label: string;
  value: string;
}

function ReviewRow({ label, value }: ReviewRowProps) {
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 shrink-0 w-36">{label}</span>
      <span className="text-sm text-gray-900 font-medium text-right">{value || "—"}</span>
    </div>
  );
}

interface ReviewSectionProps {
  title: string;
  children: React.ReactNode;
}

function ReviewSection({ title, children }: ReviewSectionProps) {
  return (
    <div className="mb-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
        {title}
      </h3>
      <div className="bg-gray-50 rounded-xl px-4 py-1">{children}</div>
    </div>
  );
}

interface Step7Props {
  state: WizardState;
  goBack: () => void;
  updateState: (partial: Partial<WizardState>) => void;
  userId: string;
  userEmail: string;
}

export default function Step7Review({
  state,
  goBack,
  updateState,
  userId,
  userEmail,
}: Step7Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const domainDisplay = () => {
    if (state.domainType === "subdomain") return `${state.subdomain}.storo.id`;
    if (state.domainType === "custom") return state.customDomain;
    return state.ownDomain;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...state,
          userId,
          userEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Terjadi kesalahan. Coba lagi.");
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setError("Gagal menghubungi server. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Review & Kirim</h2>
      <p className="text-sm text-gray-500 mb-6">
        Periksa kembali data Anda sebelum mengirim permohonan.
      </p>

      {/* Profile Section */}
      <ReviewSection title="Profil">
        <ReviewRow label="Nama Lengkap" value={state.fullName} />
        <ReviewRow label="WhatsApp" value={state.phone} />
        <ReviewRow
          label="Toko Shopee"
          value={
            state.shopeeVerified && state.shopeeStoreName
              ? `${state.shopeeStoreName} ✓`
              : state.shopeeStoreName || "—"
          }
        />
        <ReviewRow label="Link Shopee" value={state.shopeeStoreLink || "—"} />
        <ReviewRow label="Alamat Usaha" value={state.address} />
      </ReviewSection>

      {/* Identity Section */}
      <ReviewSection title="Identitas">
        <ReviewRow label="Foto KTP" value={state.ktpImageUrl ? "Sudah diupload" : "—"} />
        <ReviewRow label="Nama Bank" value={state.bankName} />
        <ReviewRow label="No. Rekening" value={state.bankAccountNumber} />
      </ReviewSection>

      {/* Plan Section */}
      <ReviewSection title="Paket">
        <ReviewRow label="Paket" value={PLAN_LABELS[state.plan] || state.plan} />
        {state.plan && (
          <>
            <ReviewRow label="Biaya Setup" value={formatCurrency(PLAN_SETUP[state.plan])} />
            <ReviewRow
              label="Biaya Bulanan"
              value={`${formatCurrency(PLAN_MONTHLY[state.plan])}/bln`}
            />
          </>
        )}
      </ReviewSection>

      {/* Template Section */}
      <ReviewSection title="Template">
        <ReviewRow label="Template" value={state.templateName} />
      </ReviewSection>

      {/* Domain Section */}
      <ReviewSection title="Domain">
        <ReviewRow
          label="Tipe Domain"
          value={
            state.domainType === "subdomain"
              ? "Subdomain Storo"
              : state.domainType === "custom"
              ? "Beli Domain"
              : "Domain Sendiri"
          }
        />
        <ReviewRow label="Alamat Toko" value={domainDisplay()} />
      </ReviewSection>

      {/* Agreement Checkbox */}
      <div className="mt-6 mb-4 flex items-start gap-3">
        <div className="relative flex items-center mt-0.5">
          <input
            type="checkbox"
            id="agreed"
            checked={state.agreed}
            onChange={(e) => updateState({ agreed: e.target.checked })}
            className="peer w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
          />
        </div>
        <label htmlFor="agreed" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
          Saya menyetujui{" "}
          <a
            href="/syarat-ketentuan"
            target="_blank"
            className="text-primary hover:underline font-medium"
          >
            Syarat &amp; Ketentuan
          </a>{" "}
          dan{" "}
          <a
            href="/kebijakan-privasi"
            target="_blank"
            className="text-primary hover:underline font-medium"
          >
            Kebijakan Privasi
          </a>{" "}
          Storo.id
        </label>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={goBack} disabled={loading}>
          ← Kembali
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!state.agreed || loading}
          className="bg-primary text-white hover:bg-primary/90 px-8 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Mengirim...
            </>
          ) : (
            "Kirim Permohonan"
          )}
        </Button>
      </div>
    </div>
  );
}
