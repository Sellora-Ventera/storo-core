"use client";

import { useReducer, useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import storoLogo from "@/assets/storo-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Check,
  Star,
  MessageCircle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Search,
  XCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  User,
  Globe,
  CreditCard,
  ClipboardList,
} from "lucide-react";
import { PLANS, getPlan, formatIDR, type PlanId } from "@/lib/plans";

// ── Types ────────────────────────────────────────────────────────────────
interface DomainResult {
  domain: string;
  extension: string;
  fullDomain: string;
  price: number;
  priceOriginal?: number;
  available: boolean;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6; // 6 = success

type State = {
  step: Step;
  // Step 1: Profile & store
  fullName: string;
  phone: string;
  shopeeStoreLink: string;
  storeName: string;
  // Step 2: Plan
  plan: PlanId | "";
  // Step 3: Domain
  selectedDomain: string;
  selectedDomainPrice: number;
  // Step 4: Account
  email: string;
  password: string;
  // Step 5: Summary & pay
  invoiceId: string;
  xenditInvoiceUrl: string;
};

type Action =
  | { type: "UPDATE"; payload: Partial<State> }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "GOTO"; step: Step };

function reducer(state: State, action: Action): State {
  if (action.type === "UPDATE") return { ...state, ...action.payload };
  if (action.type === "NEXT") return { ...state, step: Math.min(state.step + 1, 6) as Step };
  if (action.type === "PREV") return { ...state, step: Math.max(state.step - 1, 1) as Step };
  if (action.type === "GOTO") return { ...state, step: action.step };
  return state;
}

const WA_NUMBER = "6285157406969";

function buildWaUrl(name: string, phone: string, plan: string, domain: string) {
  const planLabel = plan ? ` Paket ${plan.charAt(0).toUpperCase() + plan.slice(1)}` : "";
  const domainLabel = domain ? `, Domain: ${domain}` : "";
  const msg = `Halo Storo.id! Saya ${name || "tertarik"} daftar${planLabel}${domainLabel}. WA: ${phone || "-"}`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

const STEP_META = [
  { num: 1, label: "Profil", icon: User },
  { num: 2, label: "Paket", icon: ShoppingBag },
  { num: 3, label: "Domain", icon: Globe },
  { num: 4, label: "Akun", icon: CreditCard },
  { num: 5, label: "Bayar", icon: ClipboardList },
];

// ── Root Wizard ──────────────────────────────────────────────────────────
export default function OnboardingWizard() {
  const searchParams = useSearchParams();

  const [state, dispatch] = useReducer(reducer, {
    step: 1,
    fullName: "",
    phone: "",
    shopeeStoreLink: "",
    storeName: "",
    plan: "",
    selectedDomain: "",
    selectedDomainPrice: 0,
    email: "",
    password: "",
    invoiceId: "",
    xenditInvoiceUrl: "",
  });

  // Pre-select plan from ?plan= query param
  useEffect(() => {
    const planParam = searchParams.get("plan");
    if (planParam && getPlan(planParam)) {
      dispatch({ type: "UPDATE", payload: { plan: planParam as PlanId } });
    }
  }, [searchParams]);

  // Pick up referral code from sessionStorage
  const [referralCode, setReferralCode] = useState<string | null>(null);
  useEffect(() => {
    const code = sessionStorage.getItem("storo_referral_code");
    if (code) setReferralCode(code);
  }, []);

  const update = (partial: Partial<State>) => dispatch({ type: "UPDATE", payload: partial });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5">
      <div className="max-w-xl mx-auto px-4 py-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link href="/">
            <Image src={storoLogo} alt="Storo.id" width={120} height={36} className="h-9 w-auto" priority />
          </Link>
        </div>

        {/* Progress bar */}
        {state.step <= 5 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {STEP_META.map((s, idx) => {
                const isActive = state.step === s.num;
                const isDone = state.step > s.num;
                const Icon = s.icon;
                return (
                  <div key={s.num} className="flex-1 flex flex-col items-center relative">
                    {/* Connector line */}
                    {idx > 0 && (
                      <div
                        className={`absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2 ${
                          isDone || isActive ? "bg-primary" : "bg-gray-200"
                        }`}
                      />
                    )}
                    {/* Circle */}
                    <div
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        isDone
                          ? "bg-primary text-white"
                          : isActive
                          ? "bg-primary text-white ring-4 ring-primary/20"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                    </div>
                    <span
                      className={`text-[10px] mt-1 font-medium ${
                        isActive ? "text-primary" : isDone ? "text-gray-700" : "text-gray-400"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Steps */}
        {state.step === 1 && <Step1Profile state={state} update={update} onNext={() => dispatch({ type: "NEXT" })} />}
        {state.step === 2 && <Step2Plan state={state} update={update} onNext={() => dispatch({ type: "NEXT" })} onPrev={() => dispatch({ type: "PREV" })} />}
        {state.step === 3 && <Step3Domain state={state} update={update} onNext={() => dispatch({ type: "NEXT" })} onPrev={() => dispatch({ type: "PREV" })} />}
        {state.step === 4 && <Step4Account state={state} update={update} onNext={() => dispatch({ type: "NEXT" })} onPrev={() => dispatch({ type: "PREV" })} />}
        {state.step === 5 && <Step5Summary state={state} update={update} referralCode={referralCode} onPrev={() => dispatch({ type: "PREV" })} onSuccess={() => dispatch({ type: "GOTO", step: 6 })} />}
        {state.step === 6 && <Step6Success state={state} />}

        {/* WhatsApp fallback */}
        {state.step <= 5 && (
          <div className="mt-6 text-center">
            <a
              href={buildWaUrl(state.fullName, state.phone, state.plan, state.selectedDomain)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-600 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Butuh bantuan? Chat via WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step 1: Profile & Store ──────────────────────────────────────────────
function Step1Profile({
  state,
  update,
  onNext,
}: {
  state: State;
  update: (p: Partial<State>) => void;
  onNext: () => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!state.fullName.trim()) e.fullName = "Nama wajib diisi";
    if (!state.phone.trim()) {
      e.phone = "Nomor WhatsApp wajib diisi";
    } else if (!/^(08|\+62)/.test(state.phone.trim())) {
      e.phone = "Nomor harus diawali 08 atau +62";
    }
    if (!state.storeName.trim()) e.storeName = "Nama toko wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Profil & Toko Anda</h2>
        <p className="text-sm text-gray-500 mt-1">Isi data singkat untuk memulai pesanan webstore.</p>
      </div>

      <div className="space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Nama Lengkap <span className="text-red-500">*</span></Label>
          <Input
            id="fullName"
            value={state.fullName}
            onChange={(e) => update({ fullName: e.target.value })}
            placeholder="Nama Anda"
          />
          {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName}</p>}
        </div>

        {/* WhatsApp */}
        <div className="space-y-1.5">
          <Label htmlFor="phone">Nomor WhatsApp <span className="text-red-500">*</span></Label>
          <Input
            id="phone"
            type="tel"
            value={state.phone}
            onChange={(e) => update({ phone: e.target.value })}
            placeholder="08xxxxxxxxxx"
          />
          {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
        </div>

        {/* Store name */}
        <div className="space-y-1.5">
          <Label htmlFor="storeName">Nama Toko <span className="text-red-500">*</span></Label>
          <Input
            id="storeName"
            value={state.storeName}
            onChange={(e) => update({ storeName: e.target.value })}
            placeholder="contoh: Toko Serba Ada"
          />
          {errors.storeName && <p className="text-red-500 text-xs">{errors.storeName}</p>}
        </div>

        {/* Shopee link (optional) */}
        <div className="space-y-1.5">
          <Label htmlFor="shopee">
            Link Toko Shopee{" "}
            <span className="text-gray-400 font-normal text-xs">(opsional)</span>
          </Label>
          <Input
            id="shopee"
            type="url"
            value={state.shopeeStoreLink}
            onChange={(e) => update({ shopeeStoreLink: e.target.value })}
            placeholder="https://shopee.co.id/namatoko"
          />
        </div>
      </div>

      <Button
        onClick={handleNext}
        className="w-full mt-6 bg-primary text-white hover:bg-primary/90 h-11 text-sm font-semibold cursor-pointer"
      >
        Lanjut Pilih Paket
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}

// ── Step 2: Plan Selection ───────────────────────────────────────────────
function Step2Plan({
  state,
  update,
  onNext,
  onPrev,
}: {
  state: State;
  update: (p: Partial<State>) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const [error, setError] = useState("");
  const selectablePlans = PLANS.filter((p) => p.setup !== null);

  const handleNext = () => {
    if (!state.plan) {
      setError("Pilih paket terlebih dahulu");
      return;
    }
    setError("");
    onNext();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Pilih Paket</h2>
        <p className="text-sm text-gray-500 mt-1">Semua paket termasuk setup + import produk dari Shopee.</p>
      </div>

      <div className="space-y-3">
        {selectablePlans.map((plan) => {
          const isSelected = state.plan === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => update({ plan: plan.id })}
              className={`relative w-full flex flex-col text-left rounded-xl border-2 p-4 transition-all cursor-pointer focus:outline-none
                ${isSelected
                  ? "ring-2 ring-primary bg-primary/5 border-primary"
                  : "border-gray-200 hover:border-gray-300"
                }`}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 left-4 bg-secondary text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
                  <Star className="w-2.5 h-2.5" />
                  Terpopuler
                </span>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900 text-sm">{plan.name}</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-primary font-semibold text-base">{formatIDR(plan.setup!)}</span>
                    <span className="text-gray-400 text-[11px]">setup</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-600 text-xs">
                      {formatIDR(plan.monthly!)}<span className="text-gray-400">/bln</span>
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <div className="flex items-center gap-1 text-primary text-xs font-semibold">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {plan.features.slice(0, 4).map((f) => (
                  <span key={f} className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 rounded-full px-2 py-0.5">
                    <Check className="w-2.5 h-2.5 text-primary" />
                    {f}
                  </span>
                ))}
                {plan.features.length > 4 && (
                  <span className="text-[10px] text-gray-400 px-2 py-0.5">+{plan.features.length - 4} lagi</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {error && <p className="text-red-500 text-xs mt-3">{error}</p>}

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
          className="flex-1 bg-primary text-white hover:bg-primary/90 h-11 text-sm font-semibold cursor-pointer"
        >
          Lanjut
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ── Step 3: Domain ───────────────────────────────────────────────────────
function Step3Domain({
  state,
  update,
  onNext,
  onPrev,
}: {
  state: State;
  update: (p: Partial<State>) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Pilih Domain</h2>
        <p className="text-sm text-gray-500 mt-1">
          Cari domain untuk toko Anda. Bisa dilewati — pakai subdomain gratis <strong>{state.storeName ? state.storeName.toLowerCase().replace(/\s+/g, "") : "namatoko"}.storo.id</strong>
        </p>
      </div>

      <DomainSearch
        selected={state.selectedDomain}
        onSelect={(domain, price) => update({ selectedDomain: domain, selectedDomainPrice: price })}
      />

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
          onClick={onNext}
          className="flex-1 bg-primary text-white hover:bg-primary/90 h-11 text-sm font-semibold cursor-pointer"
        >
          {state.selectedDomain ? "Lanjut" : "Lewati, Pakai Subdomain"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ── Step 4: Account ──────────────────────────────────────────────────────
function Step4Account({
  state,
  update,
  onNext,
  onPrev,
}: {
  state: State;
  update: (p: Partial<State>) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!state.email.trim()) {
      e.email = "Email wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim())) {
      e.email = "Format email tidak valid";
    }
    if (!state.password) {
      e.password = "Password wajib diisi";
    } else if (state.password.length < 8) {
      e.password = "Password minimal 8 karakter";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Buat Akun</h2>
        <p className="text-sm text-gray-500 mt-1">
          Akun ini untuk login ke dashboard toko Anda setelah pembayaran selesai.
        </p>
      </div>

      <div className="space-y-5">
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
          <Input
            id="email"
            type="email"
            value={state.email}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="nama@email.com"
            autoComplete="email"
          />
          {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={state.password}
              onChange={(e) => update({ password: e.target.value })}
              placeholder="Minimal 8 karakter"
              autoComplete="new-password"
              className="pr-10"
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
          {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
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
          className="flex-1 bg-primary text-white hover:bg-primary/90 h-11 text-sm font-semibold cursor-pointer"
        >
          Lihat Ringkasan
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ── Step 5: Summary & Pay ────────────────────────────────────────────────
function Step5Summary({
  state,
  update,
  referralCode,
  onPrev,
  onSuccess,
}: {
  state: State;
  update: (p: Partial<State>) => void;
  referralCode: string | null;
  onPrev: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const plan = getPlan(state.plan);
  const setupCost = plan?.setup ?? 0;
  const domainCost = state.selectedDomainPrice || 0;
  const total = setupCost + domainCost;

  const handleCheckout = async () => {
    setLoading(true);
    setApiError(null);

    try {
      const res = await fetch("/api/onboarding/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: state.fullName,
          phone: state.phone,
          shopeeStoreLink: state.shopeeStoreLink,
          storeName: state.storeName,
          plan: state.plan,
          selectedDomain: state.selectedDomain,
          email: state.email,
          password: state.password,
          referralCode: referralCode || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error || "Terjadi kesalahan. Coba lagi.");
        return;
      }

      update({
        invoiceId: data.invoiceId,
        xenditInvoiceUrl: data.xenditInvoiceUrl || "",
      });

      if (data.xenditInvoiceUrl) {
        // Redirect to Xendit payment page
        window.location.href = data.xenditInvoiceUrl;
      } else {
        // No Xendit URL — show success with manual payment info
        onSuccess();
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
        <p className="text-sm text-gray-500 mt-1">Periksa data Anda sebelum melanjutkan ke pembayaran.</p>
      </div>

      {/* Summary card */}
      <div className="bg-gray-50 rounded-xl p-5 space-y-3">
        <SummaryRow label="Nama" value={state.fullName} />
        <SummaryRow label="WhatsApp" value={state.phone} />
        <SummaryRow label="Nama Toko" value={state.storeName} />
        <SummaryRow label="Email" value={state.email} />
        {state.shopeeStoreLink && <SummaryRow label="Shopee" value={state.shopeeStoreLink} />}

        <div className="border-t border-gray-200 pt-3 mt-3" />

        {plan && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Paket {plan.name}</span>
              <span className="text-sm font-semibold text-gray-900">{formatIDR(setupCost)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Biaya bulanan</span>
              <span className="text-xs text-gray-500">{formatIDR(plan.monthly!)}/bln</span>
            </div>
          </>
        )}

        {state.selectedDomain && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Domain: {state.selectedDomain}</span>
            <span className="text-sm font-semibold text-gray-900">
              {domainCost > 0 ? `${formatIDR(domainCost)}/thn` : "Termasuk"}
            </span>
          </div>
        )}

        {!state.selectedDomain && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Domain</span>
            <span className="text-sm text-gray-500">Subdomain gratis (.storo.id)</span>
          </div>
        )}

        <div className="border-t border-gray-200 pt-3 mt-3" />

        <div className="flex justify-between items-center">
          <span className="text-base font-bold text-gray-900">Total Bayar Sekarang</span>
          <span className="text-lg font-bold text-primary">{formatIDR(total)}</span>
        </div>
      </div>

      {referralCode && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mt-4">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Kode referral <strong>{referralCode}</strong> aktif</span>
        </div>
      )}

      {apiError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mt-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {apiError}
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <Button
          onClick={onPrev}
          variant="outline"
          className="h-11 text-sm font-semibold cursor-pointer px-6"
          disabled={loading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
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
      </div>

      <p className="text-center text-xs text-gray-400 mt-4">
        Dengan melanjutkan, Anda menyetujui{" "}
        <a href="/syarat-ketentuan" target="_blank" className="text-primary hover:underline">S&K</a>{" "}
        dan{" "}
        <a href="/kebijakan-privasi" target="_blank" className="text-primary hover:underline">Kebijakan Privasi</a>{" "}
        Storo.id
      </p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

// ── Step 6: Success ──────────────────────────────────────────────────────
function Step6Success({ state }: { state: State }) {
  const plan = getPlan(state.plan);
  const waUrl = buildWaUrl(state.fullName, state.phone, state.plan, state.selectedDomain);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-9 h-9 text-green-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Pesanan Berhasil Dibuat!</h2>
      <p className="text-sm text-gray-500 mb-6">
        Akun Anda sudah aktif. Silakan selesaikan pembayaran untuk memulai setup toko.<br />
        Tim Storo akan menghubungi Anda dalam <strong>1x24 jam</strong> setelah pembayaran.
      </p>

      {/* Summary */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
        {plan && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Paket</span>
              <span className="font-bold text-gray-900 text-sm">{plan.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Biaya setup</span>
              <span className="text-primary font-semibold text-sm">{plan.setup !== null ? formatIDR(plan.setup) : "-"}</span>
            </div>
          </>
        )}
        {state.selectedDomain && (
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500">Domain</span>
            <span className="text-sm font-medium text-gray-900">{state.selectedDomain}</span>
          </div>
        )}
      </div>

      {/* CTA: pay from dashboard if Xendit failed */}
      {state.invoiceId && !state.xenditInvoiceUrl && (
        <Link
          href={`/dashboard/billing/${state.invoiceId}`}
          className="flex items-center justify-center gap-2 w-full px-4 py-3.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm mb-3"
        >
          Bayar Invoice Sekarang
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </Link>
      )}

      {/* WhatsApp CTA */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full px-4 py-3.5 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors shadow-sm"
      >
        <MessageCircle className="w-4 h-4" />
        Chat Tim Storo via WhatsApp
        <ExternalLink className="w-3.5 h-3.5 opacity-70" />
      </a>

      <p className="text-xs text-gray-400 mt-3">
        Online <strong>Senin–Sabtu, 08.00–17.00 WIB</strong>
      </p>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <Link href="/sign-in" className="text-sm text-primary hover:underline font-medium">
          Login ke Dashboard →
        </Link>
      </div>
    </div>
  );
}

// ── Domain Search Component ──────────────────────────────────────────────
function DomainSearch({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (domain: string, price: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DomainResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setSearched(false);
    setResults([]);
    try {
      const res = await fetch(`/api/domains/search?q=${encodeURIComponent(query.trim())}`, {
        signal: ctrl.signal,
      });
      const data = await res.json();
      setResults(data.results ?? []);
      setSearched(true);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="namatoko (tanpa .com)"
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="shrink-0 bg-primary text-white hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cari"}
        </Button>
      </div>

      {/* Results */}
      {searched && results.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-2">Tidak ada hasil. Coba nama lain.</p>
      )}

      {results.length > 0 && (
        <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
          {results.map((r) => {
            const isSelected = selected === r.fullDomain;
            return (
              <button
                key={r.fullDomain}
                type="button"
                disabled={!r.available}
                onClick={() => onSelect(isSelected ? "" : r.fullDomain, isSelected ? 0 : r.price)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors cursor-pointer
                  ${r.available
                    ? isSelected
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "bg-white hover:bg-gray-50"
                    : "bg-gray-50 opacity-60 cursor-not-allowed"
                  }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0
                      ${isSelected ? "border-primary" : "border-gray-300"}`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className={`text-sm font-medium truncate ${r.available ? "text-gray-900" : "text-gray-400"}`}>
                    {r.fullDomain}
                  </span>
                  {!r.available && (
                    <span className="text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded font-medium shrink-0">
                      Tidak tersedia
                    </span>
                  )}
                </div>

                {r.available && (
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold text-primary">{formatIDR(r.price)}<span className="text-gray-400 font-normal text-xs">/thn</span></p>
                    {r.priceOriginal && r.priceOriginal > r.price && (
                      <p className="text-[11px] text-gray-400 line-through">{formatIDR(r.priceOriginal)}</p>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-medium text-primary flex-1">{selected}</span>
          <button
            type="button"
            onClick={() => onSelect("", 0)}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
