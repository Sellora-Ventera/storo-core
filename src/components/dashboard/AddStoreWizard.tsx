"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShoppingBag,
  Globe,
  CreditCard,
  MessageCircle,
} from "lucide-react";
import { getActivePlans, getPlan, formatIDR, type PlanId } from "@/lib/plans";

type Step = 1 | 2 | 3;

interface DomainResult {
  domain: string;
  extension: string;
  fullDomain: string;
  price: number;
  priceOriginal?: number;
  available: boolean;
}

const STEP_META = [
  { num: 1, label: "Paket", icon: ShoppingBag },
  { num: 2, label: "Domain", icon: Globe },
  { num: 3, label: "Bayar", icon: CreditCard },
] as const;

const WA_NUMBER = "6285148416700";

function buildWaUrl(name: string, phone: string, plan: string, website: string) {
  const planLabel = plan ? ` Paket ${plan.charAt(0).toUpperCase() + plan.slice(1)}` : "";
  const siteLabel = website ? `, Website: ${website}.storo.id` : "";
  const msg = `Halo Storo.id! Saya ${name || "ingin"} tambah toko baru${planLabel}${siteLabel}. WA: ${phone || "-"}`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export interface AddStoreWizardProps {
  client: { full_name: string; phone: string };
  userEmail: string;
  discountPercent?: number;
  referralCode?: string | null;
  /** Cookie-prefilled referral code untuk user yang baru klik link /r/<code>.
   *  Hanya dipakai kalau `referralCode` (existing attribution) null. */
  prefilledReferralCode?: string | null;
}

export default function AddStoreWizard({
  client,
  userEmail,
  discountPercent = 0,
  referralCode = null,
  prefilledReferralCode = null,
}: AddStoreWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [plan, setPlan] = useState<PlanId>("pro");
  const [storeName, setStoreName] = useState("");
  const [websiteName, setWebsiteName] = useState("");
  // Full domain string yang user pilih, mis. "wijaayas.storo.id" atau "wijaayas.com".
  // customDomain ke API = selectedDomain kalau bukan subdomain .storo.id.
  const [selectedDomain, setSelectedDomain] = useState("");

  const goNext = () => setStep((s) => (Math.min(s + 1, 3) as Step));
  const goPrev = () => setStep((s) => (Math.max(s - 1, 1) as Step));

  return (
    <div className={`mx-auto px-4 py-8 ${step === 1 ? "max-w-5xl" : "max-w-xl"}`}>
      {/* Progress bar — sama seperti OnboardingWizard */}
      <div className="mb-8 max-w-lg mx-auto">
        <div className="flex items-center">
          {STEP_META.map((s, idx) => {
            const isActive = step === s.num;
            const isDone = step > s.num;
            const Icon = s.icon;
            return (
              <div key={s.num} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      isDone
                        ? "bg-primary text-white shadow-md shadow-primary/25"
                        : isActive
                        ? "bg-primary text-white shadow-lg shadow-primary/30 scale-110"
                        : "bg-white text-gray-400 border border-gray-200"
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span
                    className={`text-[11px] mt-1.5 font-semibold transition-colors ${
                      isActive ? "text-primary" : isDone ? "text-primary/70" : "text-gray-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < STEP_META.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 mb-5 rounded-full overflow-hidden bg-gray-200">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isDone ? "w-full bg-primary" : "w-0 bg-primary"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {step === 1 && (
        <Step1Plan plan={plan} onChange={setPlan} onNext={goNext} />
      )}
      {step === 2 && (
        <Step2Domain
          websiteName={websiteName}
          selectedDomain={selectedDomain}
          storeName={storeName}
          onWebsiteName={setWebsiteName}
          onSelectedDomain={setSelectedDomain}
          onStoreName={setStoreName}
          onNext={goNext}
          onPrev={goPrev}
        />
      )}
      {step === 3 && (
        <Step3Summary
          plan={plan}
          websiteName={websiteName}
          selectedDomain={selectedDomain}
          storeName={storeName}
          client={client}
          userEmail={userEmail}
          discountPercent={discountPercent}
          referralCode={referralCode}
          prefilledReferralCode={prefilledReferralCode}
          onPrev={goPrev}
          onCancel={() => router.push("/dashboard/stores")}
        />
      )}

      {/* WhatsApp fallback — sama seperti OnboardingWizard */}
      <div className="mt-6 text-center">
        <a
          href={buildWaUrl(client.full_name, client.phone, plan, websiteName)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-600 transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Butuh bantuan? Chat via WhatsApp
        </a>
      </div>
    </div>
  );
}

// ── Step 1: Plan Selection ───────────────────────────────────────────────
function Step1Plan({
  plan,
  onChange,
  onNext,
}: {
  plan: PlanId;
  onChange: (p: PlanId) => void;
  onNext: () => void;
}) {
  const [error, setError] = useState("");
  const selectablePlans = getActivePlans().filter((p) => p.setup !== null);

  const planDescriptions: Record<string, string> = {
    basic: "Untuk seller yang baru mulai jualan online",
    standard: "Untuk seller aktif yang siap scale",
    business: "Untuk brand established dengan tim & volume tinggi",
  };

  const handleNext = () => {
    if (!plan) {
      setError("Pilih paket terlebih dahulu");
      return;
    }
    setError("");
    onNext();
  };

  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          Pilih Paket untuk <span className="text-primary">Toko Baru</span>
        </h2>
        <p className="text-gray-600 mt-2">
          Setiap toko punya paket dan tagihan setup terpisah.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-4 max-w-5xl mx-auto">
        {selectablePlans.map((p) => {
          const isSelected = plan === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              className={`relative bg-white rounded-xl shadow-lg p-6 text-left cursor-pointer transition-all duration-200 flex flex-col h-full focus:outline-none
                ${
                  isSelected
                    ? "ring-2 ring-primary shadow-xl scale-[1.02]"
                    : p.popular
                    ? "ring-2 ring-primary"
                    : "hover:shadow-xl"
                }`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-primary text-white px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap">
                    Paling Populer
                  </span>
                </div>
              )}

              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{p.name}</h3>
                <div className="text-2xl font-bold text-primary mb-1">
                  {formatIDR(p.setup!)}
                </div>
                <p className="text-gray-600 text-sm">{planDescriptions[p.id] || ""}</p>
              </div>

              <div className="space-y-3 mb-6 flex-1">
                {p.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <div
                className={`w-full text-center py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isSelected
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 group-hover:bg-gray-200"
                }`}
              >
                {isSelected ? "Dipilih" : `Pilih Paket ${p.name}`}
              </div>
            </button>
          );
        })}
      </div>

      {error && <p className="text-red-500 text-xs mt-4 text-center">{error}</p>}

      <div className="text-center mt-8">
        <Button onClick={handleNext} size="lg" className="btn-hero px-12">
          Lanjut Pilih Domain
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ── Domain cache ────────────────────────────────────────────────────────
const DOMAIN_CACHE_PREFIX = "storo:dashboard:add-store:domain:v1:";
const DOMAIN_CACHE_TTL_MS = 60 * 60 * 1000;

function readDomainCache(query: string): DomainResult[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DOMAIN_CACHE_PREFIX + query);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { results: DomainResult[]; timestamp: number };
    if (Date.now() - parsed.timestamp > DOMAIN_CACHE_TTL_MS) {
      window.localStorage.removeItem(DOMAIN_CACHE_PREFIX + query);
      return null;
    }
    return parsed.results;
  } catch {
    return null;
  }
}

function writeDomainCache(query: string, results: DomainResult[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      DOMAIN_CACHE_PREFIX + query,
      JSON.stringify({ results, timestamp: Date.now() }),
    );
  } catch {
    // ignore
  }
}

// ── Step 2: Domain ──────────────────────────────────────────────────────
function Step2Domain({
  websiteName,
  selectedDomain,
  storeName,
  onWebsiteName,
  onSelectedDomain,
  onStoreName,
  onNext,
  onPrev,
}: {
  websiteName: string;
  selectedDomain: string;
  storeName: string;
  onWebsiteName: (v: string) => void;
  onSelectedDomain: (v: string) => void;
  onStoreName: (v: string) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const [error, setError] = useState("");
  const [results, setResults] = useState<DomainResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const subdomainFull = websiteName ? `${websiteName}.storo.id` : "";

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (websiteName.length >= 3 && !searched) {
      searchDomains(websiteName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (value: string) => {
    const slug = slugify(value);
    onWebsiteName(slug);
    onSelectedDomain("");
    setError("");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (slug.length >= 3) {
      debounceRef.current = setTimeout(() => searchDomains(slug), 500);
    } else {
      setResults([]);
      setSearched(false);
    }
  };

  const searchDomains = async (query: string) => {
    const cached = readDomainCache(query);
    if (cached) {
      setResults(cached);
      setSearched(true);
      setSearching(false);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/domains/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const fetched: DomainResult[] = data.results ?? [];
      setResults(fetched);
      setSearched(true);
      if (fetched.length > 0) writeDomainCache(query, fetched);
    } catch {
      setResults([]);
      setSearched(true);
    } finally {
      setSearching(false);
    }
  };

  const handleNext = () => {
    if (!websiteName.trim()) {
      setError("Nama website wajib diisi");
      return;
    }
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(websiteName.trim())) {
      setError("Hanya huruf kecil, angka, dan tanda hubung (-)");
      return;
    }
    if (!selectedDomain) {
      setError("Pilih satu domain terlebih dahulu");
      return;
    }
    setError("");
    onNext();
  };

  const showResults = websiteName.length >= 3;
  const hasFreshResults = searched && !searching && results.length > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Nama Toko & Website</h2>
        <p className="text-sm text-gray-500 mt-1">
          <strong className="text-primary">Semua domain (.com, .id, .co.id, dll.) gratis langsung</strong> — biaya domain ditanggung VenteraAI. Cukup klik domain pilihan Anda.
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="storeName">
            Nama Toko <span className="text-gray-400 font-normal">(opsional)</span>
          </Label>
          <Input
            id="storeName"
            value={storeName}
            onChange={(e) => onStoreName(e.target.value)}
            placeholder="Toko Baju Keren"
            className="h-11"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="websiteName">
            Nama Website <span className="text-red-500">*</span>
          </Label>
          <Input
            id="websiteName"
            value={websiteName}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="namatoko"
            className="text-lg h-12"
          />

          {error && <p className="text-red-500 text-xs">{error}</p>}

          {searching && (
            <div className="flex items-center justify-center py-4 text-sm text-gray-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Mengecek ketersediaan domain...
            </div>
          )}

          {showResults && (
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">
                Pilih domain favorit Anda — semua gratis langsung <span className="text-red-500">*</span>
              </p>
              <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
                {/* Subdomain .storo.id selalu tersedia (gratis, instant) */}
                {(() => {
                  const isSelected = selectedDomain === subdomainFull;
                  return (
                    <button
                      key={subdomainFull}
                      type="button"
                      onClick={() => onSelectedDomain(isSelected ? "" : subdomainFull)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-primary/5 ring-1 ring-inset ring-primary"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 ${
                            isSelected ? "text-primary" : "text-green-500"
                          }`}
                        />
                        <span
                          className={
                            isSelected
                              ? "text-primary font-semibold"
                              : "text-gray-900 font-medium"
                          }
                        >
                          {subdomainFull}
                        </span>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                          Subdomain
                        </span>
                      </div>
                      <span className="text-green-600 font-semibold text-sm">Gratis</span>
                    </button>
                  );
                })()}

                {/* Custom domains dari Namecheap */}
                {hasFreshResults &&
                  results.map((r) => {
                    const isSelected = r.available && selectedDomain === r.fullDomain;
                    return (
                      <button
                        key={r.fullDomain}
                        type="button"
                        disabled={!r.available}
                        onClick={() => {
                          if (!r.available) return;
                          onSelectedDomain(isSelected ? "" : r.fullDomain);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-primary/5 ring-1 ring-inset ring-primary"
                            : r.available
                            ? "bg-white hover:bg-gray-50"
                            : "bg-gray-50 opacity-60 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {r.available ? (
                            <CheckCircle2
                              className={`w-4 h-4 shrink-0 ${
                                isSelected ? "text-primary" : "text-green-500"
                              }`}
                            />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-gray-300 shrink-0" />
                          )}
                          <span
                            className={
                              isSelected
                                ? "text-primary font-semibold"
                                : r.available
                                ? "text-gray-900 font-medium"
                                : "text-gray-400"
                            }
                          >
                            {r.fullDomain}
                          </span>
                        </div>
                        {r.available ? (
                          <div className="text-right flex items-center gap-1.5">
                            <span className="text-gray-400 line-through text-xs">
                              {formatIDR(r.price)}
                            </span>
                            <span className="text-green-600 font-semibold text-sm">
                              Gratis
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-red-400 font-medium">
                            Tidak tersedia
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
              {selectedDomain && (
                <p className="text-[11px] text-primary mt-2 font-medium">
                  Domain <strong>{selectedDomain}</strong> akan dikonfigurasi untuk toko
                  Anda.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Button
          onClick={onPrev}
          variant="outline"
          className="flex-1 h-11 text-sm font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
        <Button
          onClick={handleNext}
          disabled={!selectedDomain}
          className="flex-1 bg-primary text-white hover:bg-primary/90 h-11 text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Lanjut ke Ringkasan
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ── Step 3: Summary & Pay ──────────────────────────────────────────────
function Step3Summary({
  plan,
  websiteName,
  selectedDomain,
  storeName,
  client,
  userEmail,
  discountPercent: initialDiscountPercent,
  referralCode: initialReferralCode,
  prefilledReferralCode,
  onPrev,
  onCancel,
}: {
  plan: PlanId;
  websiteName: string;
  selectedDomain: string;
  storeName: string;
  client: { full_name: string; phone: string };
  userEmail: string;
  discountPercent: number;
  referralCode: string | null;
  prefilledReferralCode: string | null;
  onPrev: () => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [manualInvoiceId, setManualInvoiceId] = useState<string | null>(null);

  // Referral code state. If the user already has an attribution from a prior
  // signup (`initialReferralCode` from the server), it's locked — UI shows
  // the code as readonly. If they don't, expose an optional input so they
  // can claim a code at add-store time. Cookie-prefilled value (from a recent
  // /r/<code> visit) auto-populates the input — user can still edit it.
  const isLocked = Boolean(initialReferralCode);
  const [codeInput, setCodeInput] = useState(prefilledReferralCode ?? "");
  const [codeStatus, setCodeStatus] = useState<
    | { kind: "idle" }
    | { kind: "checking" }
    | { kind: "valid"; percent: number; referrerName?: string }
    | { kind: "invalid"; reason: string }
  >({ kind: "idle" });

  // Effective values used for display + payment. Server stays the source of
  // truth — these are mirrored for UI only. If user types a code AND it
  // validates, prefer that over the (zero) initial discount.
  const effectiveReferralCode = isLocked
    ? initialReferralCode!
    : codeStatus.kind === "valid"
      ? codeInput.trim()
      : null;
  const effectiveDiscountPercent = isLocked
    ? initialDiscountPercent
    : codeStatus.kind === "valid"
      ? codeStatus.percent
      : 0;

  // Debounced validation — fetch /api/referral/preview-discount when the user
  // types a code (only when input is unlocked).
  useEffect(() => {
    if (isLocked) return;
    const trimmed = codeInput.trim();
    if (!trimmed) {
      setCodeStatus({ kind: "idle" });
      return;
    }
    setCodeStatus({ kind: "checking" });
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/referral/preview-discount?code=${encodeURIComponent(trimmed)}`,
        );
        if (!res.ok) {
          setCodeStatus({ kind: "invalid", reason: "Server error" });
          return;
        }
        const data = await res.json();
        if (!data?.valid) {
          setCodeStatus({ kind: "invalid", reason: "Kode tidak ditemukan" });
          return;
        }
        setCodeStatus({
          kind: "valid",
          percent:
            typeof data.discountPercent === "number" ? data.discountPercent : 0,
          referrerName: data.referrerName ?? undefined,
        });
      } catch {
        setCodeStatus({ kind: "invalid", reason: "Gagal menghubungi server" });
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [codeInput, isLocked]);

  const planObj = getPlan(plan);
  const setupFee = planObj?.setup ?? 0;
  const discountAmount =
    effectiveDiscountPercent > 0
      ? Math.round((setupFee * effectiveDiscountPercent) / 100)
      : 0;
  const total = setupFee - discountAmount;
  const isSubdomain = selectedDomain.endsWith(".storo.id");
  const customDomainForApi = isSubdomain ? undefined : selectedDomain;

  const handleCheckout = async () => {
    setLoading(true);
    setApiError(null);
    setManualInvoiceId(null);

    try {
      const res = await fetch("/api/dashboard/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          websiteName,
          customDomain: customDomainForApi,
          storeName: storeName || undefined,
          // Only send code if user typed a new one and it validated. If they
          // already had attribution (isLocked), backend reads from DB — don't
          // need to send.
          referralCode:
            !isLocked && codeStatus.kind === "valid"
              ? codeInput.trim()
              : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error || "Terjadi kesalahan. Coba lagi.");
        return;
      }

      if (data.xenditInvoiceUrl) {
        window.location.href = data.xenditInvoiceUrl;
        return;
      }

      if (data.invoiceId) {
        setManualInvoiceId(data.invoiceId);
        setApiError(
          data.error ||
            "Pembayaran online belum siap. Bayar manual dari halaman billing.",
        );
      }
    } catch {
      setApiError("Gagal menghubungi server. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Ringkasan Pesanan</h2>
        <p className="text-sm text-gray-500 mt-1">
          Periksa detail toko baru Anda sebelum melanjutkan ke pembayaran.
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-5 space-y-3">
        <SummaryRow label="Pemilik" value={client.full_name} />
        <SummaryRow label="Email" value={userEmail} />
        <SummaryRow label="WhatsApp" value={client.phone} />
        {storeName && <SummaryRow label="Nama Toko" value={storeName} />}
        <SummaryRow label="Website" value={selectedDomain} />

        <div className="border-t border-gray-200 pt-3 mt-3" />

        {planObj && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Paket {planObj.name}</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatIDR(planObj.setup!)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Biaya bulanan</span>
              <span className="text-xs text-gray-500">
                {formatIDR(planObj.monthly!)}/bln
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">
                  Diskon Referral {effectiveDiscountPercent}%
                </span>
                <span className="text-sm font-semibold text-green-700">
                  −{formatIDR(discountAmount)}
                </span>
              </div>
            )}
          </>
        )}

        <div className="border-t border-gray-200 pt-3 mt-3" />

        <div className="flex justify-between items-center">
          <span className="text-base font-bold text-gray-900">Total Bayar Sekarang</span>
          <span className="text-lg font-bold text-primary">{formatIDR(total)}</span>
        </div>
      </div>

      {/* Referral code: locked banner (existing attribution) or input field */}
      {isLocked ? (
        discountAmount > 0 && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mt-4">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              Diskon {effectiveDiscountPercent}% diterapkan dari kode referral{" "}
              <strong>{effectiveReferralCode}</strong>
            </span>
          </div>
        )
      ) : (
        <div className="mt-4">
          <Label htmlFor="referralCodeInput" className="text-xs text-gray-500">
            Punya kode referral? <span className="text-gray-400">(opsional)</span>
          </Label>
          <Input
            id="referralCodeInput"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            placeholder="Misal: ADMSELLORA5K26"
            className="h-10 mt-1 font-mono uppercase text-sm"
            disabled={loading}
            maxLength={50}
          />
          {codeStatus.kind === "checking" && (
            <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              Mengecek kode…
            </p>
          )}
          {codeStatus.kind === "valid" && (
            <p className="text-xs text-green-700 mt-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" />
              Diskon {codeStatus.percent}% dari{" "}
              <strong>{codeStatus.referrerName ?? "referrer"}</strong>{" "}
              diterapkan.
            </p>
          )}
          {codeStatus.kind === "invalid" && (
            <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3" />
              {codeStatus.reason}
            </p>
          )}
        </div>
      )}

      {apiError && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {manualInvoiceId && (
        <Link
          href={`/dashboard/billing/${manualInvoiceId}`}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors mt-4"
        >
          Lihat Invoice
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}

      <div className="flex gap-3 mt-6">
        <Button
          onClick={manualInvoiceId ? onCancel : onPrev}
          variant="outline"
          className="h-11 text-sm font-semibold cursor-pointer px-6"
          disabled={loading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {manualInvoiceId ? "Ke Toko Saya" : "Kembali"}
        </Button>
        {!manualInvoiceId && (
          <Button
            onClick={handleCheckout}
            disabled={loading}
            className="flex-1 bg-primary text-white hover:bg-primary/90 h-11 text-sm font-semibold cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                Bayar {formatIDR(total)}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>

      <p className="text-center text-xs text-gray-400 mt-4">
        Dengan melanjutkan, Anda menyetujui{" "}
        <a
          href="/syarat-ketentuan"
          target="_blank"
          className="text-primary hover:underline"
        >
          S&K
        </a>{" "}
        dan{" "}
        <a
          href="/kebijakan-privasi"
          target="_blank"
          className="text-primary hover:underline"
        >
          Kebijakan Privasi
        </a>{" "}
        Storo.id
      </p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 font-medium text-right max-w-[60%] truncate">
        {value}
      </span>
    </div>
  );
}
