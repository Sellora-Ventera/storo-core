"use client";

import { useReducer, useRef, useState } from "react";
import Image from "next/image";
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
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────
type Plan = "starter" | "business" | "enterprise" | "";

interface DomainResult {
  domain: string;
  extension: string;
  fullDomain: string;
  price: number;
  priceOriginal?: number;
  available: boolean;
}

type State = {
  step: 1 | 2;
  fullName: string;
  phone: string;
  shopeeStoreLink: string;
  plan: Plan;
  selectedDomain: string; // chosen domain full name, e.g. "tokoku.com"
};

type Action =
  | { type: "UPDATE"; payload: Partial<State> }
  | { type: "SUCCESS" };

function reducer(state: State, action: Action): State {
  if (action.type === "UPDATE") return { ...state, ...action.payload };
  if (action.type === "SUCCESS") return { ...state, step: 2 };
  return state;
}

// ── Plan config ──────────────────────────────────────────────────────────
interface PlanConfig {
  id: "starter" | "business" | "enterprise";
  name: string;
  setup: number;
  monthly: number;
  badge?: string;
  features: string[];
}

const PLANS: PlanConfig[] = [
  {
    id: "starter",
    name: "Starter",
    setup: 1500000,
    monthly: 250000,
    features: ["Import produk Shopee", "Custom domain", "Payment gateway", "Ongkir otomatis"],
  },
  {
    id: "business",
    name: "Business",
    setup: 3500000,
    monthly: 500000,
    badge: "Terpopuler",
    features: ["Semua fitur Starter", "Blog & SEO", "Promo & diskon", "Analitik penjualan", "Prioritas support"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    setup: 7500000,
    monthly: 1000000,
    features: ["Semua fitur Business", "Multi-admin", "Custom theme", "Integrasi API", "Dedicated support"],
  },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

const WA_NUMBER = "6285157406969";

function buildWaUrl(name: string, phone: string, plan: Plan, domain: string) {
  const planLabel = plan ? ` Paket ${plan.charAt(0).toUpperCase() + plan.slice(1)}` : "";
  const domainLabel = domain ? `, Domain: ${domain}` : "";
  const msg = `Halo Storo.id! Saya ${name || "tertarik"} daftar${planLabel}${domainLabel}. WA: ${phone || "-"}`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

// ── Root Wizard ──────────────────────────────────────────────────────────
export default function OnboardingWizard() {
  const [state, dispatch] = useReducer(reducer, {
    step: 1,
    fullName: "",
    phone: "",
    shopeeStoreLink: "",
    plan: "",
    selectedDomain: "",
  });

  const update = (partial: Partial<State>) => dispatch({ type: "UPDATE", payload: partial });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5">
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="flex justify-center mb-8">
          <Image src={storoLogo} alt="Storo.id" width={120} height={36} className="h-9 w-auto" priority />
        </div>

        {state.step === 1 ? (
          <FormStep state={state} update={update} onSuccess={() => dispatch({ type: "SUCCESS" })} />
        ) : (
          <SuccessStep state={state} />
        )}
      </div>
    </div>
  );
}

// ── Domain Search ────────────────────────────────────────────────────────
function DomainSearch({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (domain: string) => void;
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
          className="shrink-0 bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
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
                onClick={() => onSelect(isSelected ? "" : r.fullDomain)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors
                  ${r.available
                    ? isSelected
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "bg-white hover:bg-gray-50"
                    : "bg-gray-50 opacity-60 cursor-not-allowed"
                  }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Radio circle */}
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
                    <p className="text-sm font-semibold text-primary">{fmt(r.price)}<span className="text-gray-400 font-normal text-xs">/thn</span></p>
                    {r.priceOriginal && r.priceOriginal > r.price && (
                      <p className="text-[11px] text-gray-400 line-through">{fmt(r.priceOriginal)}</p>
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
            onClick={() => onSelect("")}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Step 1: Form ─────────────────────────────────────────────────────────
function FormStep({
  state,
  update,
  onSuccess,
}: {
  state: State;
  update: (p: Partial<State>) => void;
  onSuccess: () => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!state.fullName.trim()) e.fullName = "Nama wajib diisi";
    if (!state.phone.trim()) {
      e.phone = "Nomor WhatsApp wajib diisi";
    } else if (!/^(08|\+62)/.test(state.phone.trim())) {
      e.phone = "Nomor harus diawali 08 atau +62";
    }
    if (!state.plan) e.plan = "Pilih paket terlebih dahulu";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError(null);
    try {
      const res = await fetch("/api/onboarding/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: state.fullName,
          phone: state.phone,
          shopeeStoreLink: state.shopeeStoreLink,
          plan: state.plan,
          selectedDomain: state.selectedDomain,
          guestId: crypto.randomUUID(),
        }),
      });
      const data = await res.json();
      if (!res.ok && !data.success) {
        setApiError(data.error || "Terjadi kesalahan. Coba lagi.");
        return;
      }
      onSuccess();
    } catch {
      setApiError("Gagal menghubungi server. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Daftar Storo.id</h2>
        <p className="text-sm text-gray-500 mt-1">Isi data singkat, tim kami langsung proses.</p>
      </div>

      {/* Skip to WA — always visible */}
      <a
        href={buildWaUrl(state.fullName, state.phone, state.plan, state.selectedDomain)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full mb-6 px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-medium hover:bg-green-100 transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        Langsung chat tim Storo via WhatsApp
        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
      </a>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-100" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-gray-400">atau isi form di bawah</span>
        </div>
      </div>

      <div className="space-y-6">
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

        {/* Domain search (optional) */}
        <div className="space-y-2">
          <Label>
            Nama Domain yang Diinginkan{" "}
            <span className="text-gray-400 font-normal text-xs">(opsional)</span>
          </Label>
          <DomainSearch
            selected={state.selectedDomain}
            onSelect={(d) => update({ selectedDomain: d })}
          />
        </div>

        {/* Plan picker */}
        <div className="space-y-2">
          <Label>Pilih Paket <span className="text-red-500">*</span></Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PLANS.map((plan) => {
              const isSelected = state.plan === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => update({ plan: plan.id })}
                  className={`relative flex flex-col text-left rounded-xl border-2 p-4 transition-all focus:outline-none
                    ${isSelected
                      ? "ring-2 ring-primary bg-primary/5 border-primary"
                      : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-secondary text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
                      <Star className="w-2.5 h-2.5" />
                      {plan.badge}
                    </span>
                  )}
                  <span className="font-bold text-gray-900 text-sm">{plan.name}</span>
                  <span className="text-primary font-semibold text-base mt-0.5">{fmt(plan.setup)}</span>
                  <span className="text-gray-400 text-[11px]">setup</span>
                  <span className="text-gray-600 text-xs mt-1">
                    {fmt(plan.monthly)}
                    <span className="text-gray-400">/bln</span>
                  </span>
                  <div className="mt-2 space-y-1">
                    {plan.features.slice(0, 3).map((f) => (
                      <div key={f} className="flex items-start gap-1.5">
                        <Check className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                        <span className="text-[11px] text-gray-500 leading-tight">{f}</span>
                      </div>
                    ))}
                  </div>
                  {isSelected && (
                    <div className="mt-2 flex items-center gap-1 text-primary text-xs font-semibold">
                      <Check className="w-3.5 h-3.5" /> Dipilih
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {errors.plan && <p className="text-red-500 text-xs">{errors.plan}</p>}
        </div>
      </div>

      {apiError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mt-5 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {apiError}
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full mt-6 bg-primary text-white hover:bg-primary/90 disabled:opacity-50 h-11 text-sm font-semibold"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Memproses...
          </>
        ) : (
          "Daftar Sekarang →"
        )}
      </Button>

      <p className="text-center text-xs text-gray-400 mt-3">
        Dengan mendaftar, Anda menyetujui{" "}
        <a href="/syarat-ketentuan" target="_blank" className="text-primary hover:underline">S&K</a>{" "}
        dan{" "}
        <a href="/kebijakan-privasi" target="_blank" className="text-primary hover:underline">Kebijakan Privasi</a>{" "}
        Storo.id
      </p>
    </div>
  );
}

// ── Step 2: Success ───────────────────────────────────────────────────────
function SuccessStep({ state }: { state: State }) {
  const plan = PLANS.find((p) => p.id === state.plan);
  const waUrl = buildWaUrl(state.fullName, state.phone, state.plan, state.selectedDomain);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-9 h-9 text-green-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Pendaftaran Diterima!</h2>
      <p className="text-sm text-gray-500 mb-6">
        Tim Storo akan menghubungi Anda dalam <strong>1×24 jam</strong>.<br />
        Atau langsung chat kami untuk proses lebih cepat.
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
              <span className="text-primary font-semibold text-sm">{fmt(plan.setup)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Biaya bulanan</span>
              <span className="text-sm text-gray-700">{fmt(plan.monthly)}/bln</span>
            </div>
          </>
        )}
        {state.selectedDomain && (
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500">Domain dipilih</span>
            <span className="text-sm font-medium text-gray-900">{state.selectedDomain}</span>
          </div>
        )}
      </div>

      {/* Primary CTA */}
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
        <a href="/dashboard" className="text-sm text-primary hover:underline font-medium">
          Ke Dashboard →
        </a>
      </div>
    </div>
  );
}
