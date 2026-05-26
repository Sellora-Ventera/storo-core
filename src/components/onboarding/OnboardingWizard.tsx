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
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  Globe,
  User,
  CreditCard,
  ClipboardList,
  LogIn,
} from "lucide-react";
import { getPlan, getActivePlans, formatIDR, type PlanId } from "@/lib/plans";

// ── Types ────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4 | 5 | 6;

type State = {
  step: Step;
  plan: PlanId | "";
  websiteName: string;
  subdomain: string;
  domainType: "subdomain" | "custom" | "own";
  ownDomain: string;
  customDomain: string;
  domainPicked: boolean;
  fullName: string;
  storeName: string;
  phone: string;
  address: string;
  shopeeStoreLink: string;
  shopeeVerified: boolean;
  shopeeStoreId: string;
  shopeeStoreName: string;
  ktpImageUrl: string;
  bankName: string;
  bankAccountNumber: string;
  templateId: string;
  templateName: string;
  authMethod: "sso" | "";
  email: string;
  invoiceId: string;
  xenditInvoiceUrl: string;
  agreed: boolean;
};

export type WizardState = State;

type Action =
  | { type: "UPDATE"; payload: Partial<State> }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "GOTO"; step: Step };

const STEP_RESET_FIELDS: Record<number, Partial<State>> = {
  1: { plan: "" },
  2: { websiteName: "", customDomain: "", domainPicked: false },
  3: {
    fullName: "",
    storeName: "",
    phone: "",
    shopeeStoreLink: "",
    shopeeVerified: false,
    shopeeStoreId: "",
    shopeeStoreName: "",
  },
  4: { authMethod: "", email: "" },
  5: { invoiceId: "", xenditInvoiceUrl: "", agreed: false },
};

function reducer(state: State, action: Action): State {
  if (action.type === "UPDATE") return { ...state, ...action.payload };
  if (action.type === "NEXT") return { ...state, step: Math.min(state.step + 1, 6) as Step };
  if (action.type === "PREV") {
    const newStep = Math.max(state.step - 1, 1) as Step;
    return { ...state, ...STEP_RESET_FIELDS[newStep], step: newStep };
  }
  if (action.type === "GOTO") return { ...state, step: action.step };
  return state;
}

const WA_NUMBER = "6285148416700";

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

const LEGACY_WIZARD_KEY = "storo:onboarding:wizard:v1";
const LEGACY_DOMAIN_PREFIX = "storo:onboarding:domain-search:v1:";

function purgeLegacyPersistence() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LEGACY_WIZARD_KEY);
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(LEGACY_DOMAIN_PREFIX)) {
        window.localStorage.removeItem(k);
      }
    }
  } catch {
    // ignore
  }
}

// ── Draft persistence (SSO round-trip) ────────────────────────────────────
// Step 4 redirects to Ventera SSO (full-page nav), wiping in-memory state.
// We persist a draft snapshot to sessionStorage before redirect and restore
// on return via ?resume=<draftId>.
const DRAFT_KEY_PREFIX = "storo_onboarding_draft_";

type DraftSnapshot = Pick<
  State,
  | "plan"
  | "websiteName"
  | "customDomain"
  | "domainPicked"
  | "fullName"
  | "storeName"
  | "phone"
  | "shopeeStoreLink"
>;

function saveDraft(draftId: string, snapshot: DraftSnapshot) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(DRAFT_KEY_PREFIX + draftId, JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}

function loadDraft(draftId: string): DraftSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY_PREFIX + draftId);
    if (!raw) return null;
    return JSON.parse(raw) as DraftSnapshot;
  } catch {
    return null;
  }
}

function clearDraft(draftId: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(DRAFT_KEY_PREFIX + draftId);
  } catch {
    /* ignore */
  }
}

// ── Root Wizard ──────────────────────────────────────────────────────────
export default function OnboardingWizard() {
  const searchParams = useSearchParams();

  const [state, dispatch] = useReducer(reducer, {
    step: 1,
    plan: "pro" as PlanId,
    websiteName: "",
    subdomain: "",
    domainType: "subdomain",
    ownDomain: "",
    customDomain: "",
    domainPicked: false,
    fullName: "",
    storeName: "",
    phone: "",
    address: "",
    shopeeStoreLink: "",
    shopeeVerified: false,
    shopeeStoreId: "",
    shopeeStoreName: "",
    ktpImageUrl: "",
    bankName: "",
    bankAccountNumber: "",
    templateId: "",
    templateName: "",
    authMethod: "",
    email: "",
    invoiceId: "",
    xenditInvoiceUrl: "",
    agreed: false,
  });

  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    purgeLegacyPersistence();

    const planParam = searchParams.get("plan");
    if (planParam && getPlan(planParam)) {
      dispatch({ type: "UPDATE", payload: { plan: planParam as PlanId } });
    }

    // Resume after SSO round-trip
    const resumeId = searchParams.get("resume");
    if (resumeId) {
      const draft = loadDraft(resumeId);
      if (draft) {
        dispatch({
          type: "UPDATE",
          payload: {
            ...draft,
            authMethod: "sso",
          },
        });
        // Probe Supabase session to confirm SSO sync landed
        (async () => {
          const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
          const supabase = getSupabaseBrowserClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.email) {
            dispatch({ type: "UPDATE", payload: { email: user.email, authMethod: "sso" } });
            dispatch({ type: "GOTO", step: 5 });
          } else {
            // Session not present — SSO may have failed; land at step 4 so
            // user can retry.
            dispatch({ type: "GOTO", step: 4 });
          }
          clearDraft(resumeId);
        })();
      }
    }
  }, [searchParams]);

  const [referralCode, setReferralCode] = useState<string | null>(null);
  useEffect(() => {
    const code = sessionStorage.getItem("storo_referral_code");
    if (code) setReferralCode(code);
  }, []);

  const update = (partial: Partial<State>) => dispatch({ type: "UPDATE", payload: partial });

  return (
    <div className={`mx-auto px-4 py-8 ${state.step === 1 ? "max-w-5xl" : "max-w-xl"}`}>
      {state.step <= 5 && (
        <div className="mb-8 max-w-lg mx-auto">
          <div className="flex items-center">
            {STEP_META.map((s, idx) => {
              const isActive = state.step === s.num;
              const isDone = state.step > s.num;
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
      )}

      {state.step === 1 && <Step1Plan state={state} update={update} onNext={() => dispatch({ type: "NEXT" })} />}
      {state.step === 2 && <Step2Domain state={state} update={update} onNext={() => dispatch({ type: "NEXT" })} onPrev={() => dispatch({ type: "PREV" })} />}
      {state.step === 3 && <Step3Profile state={state} update={update} onNext={() => dispatch({ type: "NEXT" })} onPrev={() => dispatch({ type: "PREV" })} />}
      {state.step === 4 && <Step4Account state={state} update={update} onNext={() => dispatch({ type: "NEXT" })} onPrev={() => dispatch({ type: "PREV" })} />}
      {state.step === 5 && <Step5Summary state={state} update={update} referralCode={referralCode} onPrev={() => dispatch({ type: "PREV" })} onSuccess={() => dispatch({ type: "GOTO", step: 6 })} />}
      {state.step === 6 && <Step6Success state={state} />}

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
  const selectablePlans = getActivePlans().filter((p) => p.setup !== null);

  const handleNext = () => {
    if (!state.plan) {
      setError("Pilih paket terlebih dahulu");
      return;
    }
    setError("");
    onNext();
  };

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-4 max-w-5xl mx-auto">
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

              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                {plan.setupOriginal && (
                  <div className="text-sm text-gray-400 line-through">
                    {formatIDR(plan.setupOriginal)}
                  </div>
                )}
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
          Lanjut Pilih Domain
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

interface DomainResult {
  domain: string;
  extension: string;
  fullDomain: string;
  price: number;
  priceOriginal?: number;
  available: boolean;
}

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

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const handleChange = (value: string) => {
    const slug = slugify(value);
    update({ websiteName: slug, customDomain: "", domainPicked: false });
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
    setSearching(true);
    try {
      const res = await fetch(`/api/domains/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const fetched: DomainResult[] = data.results ?? [];
      setResults(fetched);
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
    if (!state.domainPicked) {
      setError("Pilih satu domain terlebih dahulu");
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
          Nama ini akan jadi alamat toko Anda. <strong className="text-primary">Semua domain (.com, .id, .co.id, dll.) gratis langsung</strong> — biaya domain ditanggung VenteraAI.
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

        {error && <p className="text-red-500 text-xs">{error}</p>}

        {searching && (
          <div className="flex items-center justify-center py-4 text-sm text-gray-400 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Mengecek ketersediaan domain...
          </div>
        )}

        {searched && !searching && results.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2 font-medium">Pilih satu domain — semua gratis langsung <span className="text-red-500">*</span></p>
            <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
              {(() => {
                const subdomainFull = `${state.websiteName}.storo.id`;
                const isSelected = state.domainPicked && !state.customDomain;
                return (
                  <button
                    key={subdomainFull}
                    type="button"
                    onClick={() => update({ customDomain: "", domainPicked: true })}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-primary/5 ring-1 ring-inset ring-primary"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${isSelected ? "text-primary" : "text-green-500"}`} />
                      <span className={isSelected ? "text-primary font-semibold" : "text-gray-900 font-medium"}>
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
              {results.map((r) => {
                const isSelected = r.available && state.customDomain === r.fullDomain;
                return (
                  <button
                    key={r.fullDomain}
                    type="button"
                    disabled={!r.available}
                    onClick={() => {
                      if (!r.available) return;
                      update({ customDomain: r.fullDomain, domainPicked: true });
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors cursor-pointer
                      ${isSelected
                        ? "bg-primary/5 ring-1 ring-inset ring-primary"
                        : r.available
                        ? "bg-white hover:bg-gray-50"
                        : "bg-gray-50 opacity-60 cursor-not-allowed"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      {r.available ? (
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${isSelected ? "text-primary" : "text-green-500"}`} />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-gray-300 shrink-0" />
                      )}
                      <span className={isSelected ? "text-primary font-semibold" : r.available ? "text-gray-900 font-medium" : "text-gray-400"}>
                        {r.fullDomain}
                      </span>
                    </div>
                    {r.available ? (
                      <div className="text-right flex items-center gap-1.5">
                        <span className="text-gray-400 line-through text-xs">{formatIDR(r.price)}</span>
                        <span className="text-green-600 font-semibold text-sm">Gratis</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-red-400 font-medium">Tidak tersedia</span>
                    )}
                  </button>
                );
              })}
            </div>
            {state.domainPicked && state.customDomain ? (
              <p className="text-[11px] text-primary mt-2 font-medium">
                Domain <strong>{state.customDomain}</strong> akan dikonfigurasi untuk toko Anda.
              </p>
            ) : state.domainPicked ? (
              <p className="text-[11px] text-primary mt-2 font-medium">
                Subdomain <strong>{state.websiteName}.storo.id</strong> akan langsung aktif untuk toko Anda.
              </p>
            ) : (
              <p className="text-[11px] text-gray-400 mt-2">
                Klik salah satu domain di atas untuk lanjut — semua gratis langsung.
              </p>
            )}
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
          disabled={!state.websiteName.trim() || !state.domainPicked}
          className="flex-1 bg-primary text-white hover:bg-primary/90 h-11 text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Lanjut Isi Profil
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

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

// ── Step 4: SSO Account ──────────────────────────────────────────────────
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
  const [sessionLoading, setSessionLoading] = useState(true);
  const [redirectLoading, setRedirectLoading] = useState(false);

  // Detect existing Supabase session (e.g. user already logged in earlier or
  // came back via SSO callback and landed here instead of step 5).
  useEffect(() => {
    (async () => {
      try {
        const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          update({ email: user.email, authMethod: "sso" });
        }
      } finally {
        setSessionLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSsoLogin = () => {
    setRedirectLoading(true);
    const draftId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `d_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    saveDraft(draftId, {
      plan: state.plan,
      websiteName: state.websiteName,
      customDomain: state.customDomain,
      domainPicked: state.domainPicked,
      fullName: state.fullName,
      storeName: state.storeName,
      phone: state.phone,
      shopeeStoreLink: state.shopeeStoreLink,
    });

    const next = `/onboarding`;
    window.location.href = `/auth/sso/login?next=${encodeURIComponent(next)}&draft=${encodeURIComponent(draftId)}`;
  };

  const handleSignOut = async () => {
    const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    update({ email: "", authMethod: "" });
  };

  const isLoggedIn = state.authMethod === "sso" && Boolean(state.email);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Buat Akun</h2>
        <p className="text-sm text-gray-500 mt-1">
          Login dengan Ventera SSO. Akun otomatis dibuat di Storo jika belum ada.
        </p>
      </div>

      {sessionLoading ? (
        <div className="flex items-center justify-center py-10 gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memeriksa sesi...
        </div>
      ) : isLoggedIn ? (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800">Terhubung dengan Ventera SSO</p>
            <p className="text-xs text-green-600 truncate">{state.email}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs text-gray-500 hover:text-red-500 transition-colors cursor-pointer whitespace-nowrap"
          >
            Ganti akun
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleSsoLogin}
          disabled={redirectLoading}
          className="w-full inline-flex items-center justify-center gap-3 rounded-lg h-12 bg-primary text-white font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60"
        >
          {redirectLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          {redirectLoading ? "Mengalihkan..." : "Lanjutkan dengan Ventera SSO"}
        </button>
      )}

      <div className="flex gap-3 mt-6">
        <Button
          onClick={onPrev}
          variant="outline"
          className="flex-1 h-11 text-sm font-semibold cursor-pointer"
          disabled={redirectLoading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
        <Button
          onClick={onNext}
          disabled={!isLoggedIn || redirectLoading}
          className="flex-1 bg-primary text-white hover:bg-primary/90 h-11 text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Lihat Ringkasan
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

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
  void onSuccess;
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0);

  const plan = getPlan(state.plan);
  const setupFee = plan?.setup ?? 0;
  const discountAmount =
    discountPercent > 0 ? Math.round((setupFee * discountPercent) / 100) : 0;
  const total = setupFee - discountAmount;

  useEffect(() => {
    if (!referralCode) {
      setDiscountPercent(0);
      return;
    }
    let cancelled = false;
    fetch(`/api/referral/preview-discount?code=${encodeURIComponent(referralCode)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.valid) return;
        if (typeof data.discountPercent === "number") {
          setDiscountPercent(data.discountPercent);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [referralCode]);

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
          customDomain: state.customDomain || undefined,
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
        window.location.href = "/dashboard";
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

      <div className="bg-gray-50 rounded-xl p-5 space-y-3">
        <SummaryRow label="Nama" value={state.fullName} />
        <SummaryRow label="Nama Toko" value={state.storeName} />
        <SummaryRow
          label="Website"
          value={`${state.websiteName}.storo.id`}
        />
        {state.customDomain && (
          <SummaryRow label="Custom Domain" value={state.customDomain} />
        )}
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
            {state.customDomain && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Domain {state.customDomain}</span>
                <span className="text-sm font-semibold text-green-600">Gratis</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">
                  Diskon Referral {discountPercent}%
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

      {referralCode && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mt-4">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>
            {discountAmount > 0
              ? <>Diskon {discountPercent}% diterapkan dari kode referral <strong>{referralCode}</strong></>
              : <>Kode referral <strong>{referralCode}</strong> aktif</>}
          </span>
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
        <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">S&K</a>{" "}
        dan{" "}
        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Kebijakan Privasi</a>{" "}
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

function Step6Success({ state }: { state: State }) {
  const plan = getPlan(state.plan);
  const waUrl = buildWaUrl(state.fullName, state.phone, state.plan, state.websiteName);
  void Star;

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
        {state.customDomain && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Custom Domain</span>
            <span className="text-sm font-medium text-gray-900">{state.customDomain}</span>
          </div>
        )}
      </div>

      {state.invoiceId && !state.xenditInvoiceUrl && (
        <Link
          href={`/dashboard/billing/${state.invoiceId}`}
          className="flex items-center justify-center gap-2 w-full px-4 py-3.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm mb-3"
        >
          Bayar Invoice Sekarang
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </Link>
      )}

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
        {/* Plain anchor so the browser does a top-level navigation; next/link
            triggers an RSC fetch that follows the 302 to sso.ventera.ai as
            CORS and is blocked. */}
        <a href="/auth/sso/login" className="text-sm text-primary hover:underline font-medium">
          Login ke Dashboard →
        </a>
      </div>
    </div>
  );
}
