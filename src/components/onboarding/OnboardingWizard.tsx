"use client";

import { useReducer, useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  Globe,
  User,
  CreditCard,
  ClipboardList,
} from "lucide-react";
import { PLANS, getPlan, formatIDR, type PlanId } from "@/lib/plans";

// ── Types ────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4 | 5 | 6; // 6 = success

type State = {
  step: Step;
  // Step 1: Plan
  plan: PlanId | "";
  // Step 2: Domain
  websiteName: string; // slug for <slug>.storo.id
  // Step 3: Profile
  fullName: string;
  storeName: string;
  phone: string;
  shopeeStoreLink: string;
  // Step 4: Account
  authMethod: "email" | "google" | "";
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

function buildWaUrl(name: string, phone: string, plan: string, website: string) {
  const planLabel = plan ? ` Paket ${plan.charAt(0).toUpperCase() + plan.slice(1)}` : "";
  const siteLabel = website ? `, Website: ${website}.storo.id` : "";
  const msg = `Halo Storo.id! Saya ${name || "tertarik"} daftar${planLabel}${siteLabel}. WA: ${phone || "-"}`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const STEP_META = [
  { num: 1, label: "Paket", icon: ShoppingBag },
  { num: 2, label: "Domain", icon: Globe },
  { num: 3, label: "Profil", icon: User },
  { num: 4, label: "Akun", icon: CreditCard },
  { num: 5, label: "Bayar", icon: ClipboardList },
];

// ── Root Wizard ──────────────────────────────────────────────────────────
export default function OnboardingWizard() {
  const searchParams = useSearchParams();

  const [state, dispatch] = useReducer(reducer, {
    step: 1,
    plan: "",
    websiteName: "",
    fullName: "",
    storeName: "",
    phone: "",
    shopeeStoreLink: "",
    authMethod: "",
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
    <div className={`mx-auto px-4 py-8 ${state.step === 1 ? "max-w-5xl" : "max-w-xl"}`}>
      {/* Progress bar */}
      {state.step <= 5 && (
        <div className="mb-8 max-w-lg mx-auto">
          <div className="flex items-center">
            {STEP_META.map((s, idx) => {
              const isActive = state.step === s.num;
              const isDone = state.step > s.num;
              const Icon = s.icon;
              return (
                <div key={s.num} className="flex items-center flex-1 last:flex-none">
                  {/* Step pill */}
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
                  {/* Connector */}
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
      )}

      {/* Steps */}
      {state.step === 1 && <Step1Plan state={state} update={update} onNext={() => dispatch({ type: "NEXT" })} />}
      {state.step === 2 && <Step2Domain state={state} update={update} onNext={() => dispatch({ type: "NEXT" })} onPrev={() => dispatch({ type: "PREV" })} />}
      {state.step === 3 && <Step3Profile state={state} update={update} onNext={() => dispatch({ type: "NEXT" })} onPrev={() => dispatch({ type: "PREV" })} />}
      {state.step === 4 && <Step4Account state={state} update={update} onNext={() => dispatch({ type: "NEXT" })} onPrev={() => dispatch({ type: "PREV" })} />}
      {state.step === 5 && <Step5Summary state={state} update={update} referralCode={referralCode} onPrev={() => dispatch({ type: "PREV" })} onSuccess={() => dispatch({ type: "GOTO", step: 6 })} />}
      {state.step === 6 && <Step6Success state={state} />}

      {/* WhatsApp fallback */}
      {state.step <= 5 && (
        <div className="mt-6 text-center">
          <a
            href={buildWaUrl(state.fullName, state.phone, state.plan, state.websiteName)}
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
  );
}

// ── Step 1: Plan Selection ───────────────────────────────────────────────
function Step1Plan({
  state,
  update,
  onNext,
}: {
  state: State;
  update: (p: Partial<State>) => void;
  onNext: () => void;
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

  // Descriptions matching landing page Pricing
  const planDescriptions: Record<string, string> = {
    starter: "Untuk bisnis yang baru mulai",
    pro: "Paling populer untuk seller aktif",
    advance: "Untuk seller dengan volume tinggi",
    flexible: "Domain & hosting customer sendiri",
  };

  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          Pilih Paket yang <span className="text-primary">Tepat</span>
        </h2>
        <p className="text-gray-600 mt-2">Pilih paket yang sesuai dengan kebutuhan bisnis Anda</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 pt-4">
        {selectablePlans.map((plan) => {
          const isSelected = state.plan === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => update({ plan: plan.id })}
              className={`relative bg-white rounded-xl shadow-lg p-6 text-left cursor-pointer transition-all duration-200 flex flex-col h-full focus:outline-none
                ${isSelected
                  ? "ring-2 ring-primary shadow-xl scale-[1.02]"
                  : plan.popular
                  ? "ring-2 ring-primary"
                  : "hover:shadow-xl"
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-primary text-white px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap">
                    Paling Populer
                  </span>
                </div>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-2xl font-bold text-primary mb-1">{formatIDR(plan.setup!)}</div>
                <p className="text-gray-600 text-sm">{planDescriptions[plan.id] || ""}</p>
              </div>

              <div className="space-y-3 mb-6 flex-1">
                {plan.features.map((feature) => (
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
                {isSelected ? "Dipilih" : `Pilih Paket ${plan.name}`}
              </div>
            </button>
          );
        })}
      </div>

      {error && <p className="text-red-500 text-xs mt-4 text-center">{error}</p>}

      <div className="text-center mt-8">
        <Button
          onClick={handleNext}
          size="lg"
          className="btn-hero px-12"
        >
          Lanjut Isi Profil
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ── Domain result type ───────────────────────────────────────────────────
interface DomainResult {
  domain: string;
  extension: string;
  fullDomain: string;
  price: number;
  priceOriginal?: number;
  available: boolean;
}

// ── Step 2: Domain ───────────────────────────────────────────────────────
function Step2Domain({
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
  const [results, setResults] = useState<DomainResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const handleChange = (value: string) => {
    const slug = slugify(value);
    update({ websiteName: slug });
    setError("");

    // Auto-search after typing stops
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (slug.length >= 3) {
      debounceRef.current = setTimeout(() => searchDomains(slug), 500);
    } else {
      setResults([]);
      setSearched(false);
    }
  };

  const searchDomains = async (query: string) => {
    setSearching(true);
    try {
      const res = await fetch(`/api/domains/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setSearched(true);
    } catch {
      setResults([]);
      setSearched(true);
    } finally {
      setSearching(false);
    }
  };

  const handleNext = () => {
    if (!state.websiteName.trim()) {
      setError("Nama website wajib diisi");
      return;
    }
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(state.websiteName.trim())) {
      setError("Hanya huruf kecil, angka, dan tanda hubung (-)");
      return;
    }
    setError("");
    onNext();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Pilih Nama Website</h2>
        <p className="text-sm text-gray-500 mt-1">
          Nama ini akan menjadi alamat toko online Anda. Subdomain <strong>.storo.id</strong> gratis untuk semua paket.
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="websiteName">Nama Website <span className="text-red-500">*</span></Label>
        <Input
          id="websiteName"
          value={state.websiteName}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="namatoko"
          className="text-lg h-12"
        />

        {/* Free subdomain preview - shown only before domain search results load */}
        {error && <p className="text-red-500 text-xs">{error}</p>}

        {/* Domain availability results */}
        {searching && (
          <div className="flex items-center justify-center py-4 text-sm text-gray-400 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Mengecek ketersediaan domain...
          </div>
        )}

        {searched && !searching && results.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2 font-medium">Mau custom domain? Cek ketersediaan:</p>
            <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
              {results.map((r) => (
                <div
                  key={r.fullDomain}
                  className={`flex items-center justify-between px-4 py-2.5 text-sm ${
                    r.available ? "bg-white" : "bg-gray-50 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {r.available ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-300 shrink-0" />
                    )}
                    <span className={r.available ? "text-gray-900 font-medium" : "text-gray-400"}>
                      {r.fullDomain}
                    </span>
                  </div>
                  {r.available ? (
                    <div className="text-right">
                      <span className="text-primary font-semibold text-sm">{formatIDR(r.price)}</span>
                      <span className="text-gray-400 text-[10px]">/thn</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-red-400 font-medium">Tidak tersedia</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              Custom domain bisa ditambahkan nanti dari dashboard. Lanjutkan dulu dengan subdomain gratis.
            </p>
          </div>
        )}
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
          Lanjut Isi Profil
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ── Step 3: Profile ──────────────────────────────────────────────────────
function Step3Profile({
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

  const validate = () => {
    const e: Record<string, string> = {};
    if (!state.fullName.trim()) e.fullName = "Nama wajib diisi";
    if (!state.storeName.trim()) e.storeName = "Nama toko wajib diisi";
    if (!state.phone.trim()) {
      e.phone = "Nomor WhatsApp wajib diisi";
    } else if (!/^(08|\+62)/.test(state.phone.trim())) {
      e.phone = "Nomor harus diawali 08 atau +62";
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
        <h2 className="text-xl font-bold text-gray-900">Profil Anda</h2>
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

// ── Google Icon ──────────────────────────────────────────────────────────
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

// ── Step 3: Account ──────────────────────────────────────────────────────
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
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const handleGoogleSignUpPopup = async () => {
    setGoogleLoading(true);
    const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/api/auth/callback?popup=true`,
        skipBrowserRedirect: true,
      },
    });
    if (error || !data.url) {
      setErrors({ email: error?.message || "Gagal membuka Google Sign-In" });
      setGoogleLoading(false);
      return;
    }

    // Open popup
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(
      data.url,
      "google-auth",
      `width=${width},height=${height},left=${left},top=${top},popup=yes`
    );

    // Listen for message from popup
    const handler = async (event: MessageEvent) => {
      if (event.origin !== location.origin) return;
      if (event.data?.type === "AUTH_COMPLETE") {
        cleanup();
        const { data: session } = await supabase.auth.getSession();
        if (session?.session?.user) {
          update({
            email: session.session.user.email || "",
            authMethod: "google",
          });
          onNext();
        }
        setGoogleLoading(false);
      } else if (event.data?.type === "AUTH_FAILED") {
        cleanup();
        setErrors({ email: "Google sign-in gagal. Coba lagi." });
        setGoogleLoading(false);
      }
    };
    window.addEventListener("message", handler);

    // Fallback: poll for popup manually closed without postMessage
    const pollClosed = setInterval(() => {
      if (popup?.closed) {
        cleanup();
        setGoogleLoading(false);
      }
    }, 500);

    function cleanup() {
      window.removeEventListener("message", handler);
      clearInterval(pollClosed);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Buat Akun</h2>
        <p className="text-sm text-gray-500 mt-1">
          Akun ini untuk login ke dashboard toko Anda setelah pembayaran selesai.
        </p>
      </div>

      {/* Google Sign Up */}
      <button
        type="button"
        onClick={handleGoogleSignUpPopup}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 h-11 rounded-lg border-2 border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer disabled:opacity-50"
      >
        {googleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        {googleLoading ? "Menghubungkan..." : "Daftar dengan Google"}
      </button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-gray-400">atau daftar dengan email</span>
        </div>
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

// ── Step 4: Summary & Pay ────────────────────────────────────────────────
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
  const total = plan?.setup ?? 0;

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
          selectedDomain: `${state.websiteName}.storo.id`,
          email: state.email,
          password: state.authMethod === "google" ? undefined : state.password,
          authMethod: state.authMethod || "email",
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
        window.location.href = data.xenditInvoiceUrl;
      } else {
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
        <SummaryRow label="Nama Toko" value={state.storeName} />
        <SummaryRow label="Website" value={`${state.websiteName}.storo.id`} />
        <SummaryRow label="WhatsApp" value={state.phone} />
        <SummaryRow label="Email" value={state.email} />
        {state.shopeeStoreLink && <SummaryRow label="Shopee" value={state.shopeeStoreLink} />}

        <div className="border-t border-gray-200 pt-3 mt-3" />

        {plan && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Paket {plan.name}</span>
              <span className="text-sm font-semibold text-gray-900">{formatIDR(plan.setup!)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Biaya bulanan</span>
              <span className="text-xs text-gray-500">{formatIDR(plan.monthly!)}/bln</span>
            </div>
          </>
        )}

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Domain</span>
          <span className="text-sm font-medium text-gray-900">{state.websiteName}.storo.id</span>
        </div>

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

// ── Step 5: Success ──────────────────────────────────────────────────────
function Step6Success({ state }: { state: State }) {
  const plan = getPlan(state.plan);
  const waUrl = buildWaUrl(state.fullName, state.phone, state.plan, state.websiteName);

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
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">Website</span>
          <span className="text-sm font-medium text-gray-900">{state.websiteName}.storo.id</span>
        </div>
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
        Online <strong>Senin-Sabtu, 08.00-17.00 WIB</strong>
      </p>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <Link href="/sign-in" className="text-sm text-primary hover:underline font-medium">
          Login ke Dashboard →
        </Link>
      </div>
    </div>
  );
}
