"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import type { WizardState } from "./OnboardingWizard";

type TabType = "subdomain" | "custom" | "own";

interface DomainResult {
  domain: string;
  extension: string;
  price: number;
  available: boolean;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-")
    .slice(0, 30);
}

interface Step5Props {
  state: WizardState;
  goNext: () => void;
  goBack: () => void;
  updateState: (partial: Partial<WizardState>) => void;
}

export default function Step5Domain({ state, goNext, goBack, updateState }: Step5Props) {
  const [activeTab, setActiveTab] = useState<TabType>(state.domainType);

  // Subdomain state
  const [slugInput, setSlugInput] = useState(state.subdomain);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  // Custom domain state
  const [domainQuery, setDomainQuery] = useState("");
  const [domainResults, setDomainResults] = useState<DomainResult[]>([]);
  const [searchingDomain, setSearchingDomain] = useState(false);

  // Own domain state
  const [ownDomainInput, setOwnDomainInput] = useState(state.ownDomain);
  const [showDnsInstructions, setShowDnsInstructions] = useState(false);

  // Debounced slug check
  const checkSlug = useCallback(
    async (slug: string) => {
      if (!slug || slug.length < 3) {
        setSlugStatus("idle");
        return;
      }
      setSlugStatus("checking");
      try {
        const res = await fetch(`/api/slugs/check?slug=${encodeURIComponent(slug)}`);
        const data = await res.json();
        setSlugStatus(data.available ? "available" : "taken");
        if (data.available) {
          updateState({ subdomain: slug });
        }
      } catch {
        setSlugStatus("idle");
      }
    },
    [updateState]
  );

  useEffect(() => {
    if (activeTab !== "subdomain") return;
    const timer = setTimeout(() => {
      checkSlug(slugInput);
    }, 600);
    return () => clearTimeout(timer);
  }, [slugInput, activeTab, checkSlug]);

  const handleSlugChange = (value: string) => {
    const sanitized = slugify(value);
    setSlugInput(sanitized);
    setSlugStatus("idle");
    updateState({ subdomain: sanitized });
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    updateState({ domainType: tab });
  };

  const searchDomain = async () => {
    if (!domainQuery.trim()) return;
    setSearchingDomain(true);
    try {
      const res = await fetch(`/api/domains/search?q=${encodeURIComponent(domainQuery)}`);
      const data = await res.json();
      setDomainResults(data.results || []);
    } catch {
      setDomainResults([]);
    } finally {
      setSearchingDomain(false);
    }
  };

  const isNextEnabled = () => {
    if (activeTab === "subdomain") {
      return state.subdomain.length >= 3 && slugStatus === "available";
    }
    if (activeTab === "custom") {
      return !!state.customDomain;
    }
    if (activeTab === "own") {
      return !!state.ownDomain && state.ownDomain.includes(".");
    }
    return false;
  };

  const TAB_CONFIG: { id: TabType; label: string }[] = [
    { id: "subdomain", label: "Subdomain" },
    { id: "custom", label: "Beli Domain" },
    { id: "own", label: "Sudah Punya Domain" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Konfigurasi Domain</h2>
      <p className="text-sm text-gray-500 mb-6">
        Tentukan alamat toko online Anda.
      </p>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-0 overflow-x-auto">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors focus:outline-none
              ${
                activeTab === tab.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Subdomain Tab */}
      {activeTab === "subdomain" && (
        <div className="space-y-4">
          <Label>Slug subdomain Anda</Label>
          <div className="flex items-center gap-0">
            <Input
              type="text"
              value={slugInput}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="nama-toko-anda"
              className="rounded-r-none border-r-0 flex-1"
              maxLength={30}
            />
            <span className="px-3 py-2 bg-gray-50 border border-input rounded-r-md text-sm text-gray-500 whitespace-nowrap">
              .storo.id
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Gunakan huruf kecil, angka, dan tanda hubung (-). Minimal 3 karakter, maksimal 30.
          </p>

          {/* Status indicator */}
          {slugStatus === "checking" && (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Memeriksa ketersediaan...
            </div>
          )}
          {slugStatus === "available" && (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              {slugInput}.storo.id — Tersedia!
            </div>
          )}
          {slugStatus === "taken" && (
            <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
              <XCircle className="w-4 h-4" />
              {slugInput}.storo.id — Sudah dipakai
            </div>
          )}

          {slugInput.length > 0 && slugInput.length < 3 && (
            <p className="text-amber-600 text-sm">Slug minimal 3 karakter</p>
          )}
        </div>
      )}

      {/* Custom Domain Tab */}
      {activeTab === "custom" && (
        <div className="space-y-4">
          <Label>Cari nama domain</Label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={domainQuery}
              onChange={(e) => setDomainQuery(e.target.value)}
              placeholder="contoh: toko-baju-murah"
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && searchDomain()}
            />
            <Button
              type="button"
              onClick={searchDomain}
              disabled={searchingDomain || !domainQuery.trim()}
              className="bg-primary text-white hover:bg-primary/90"
            >
              {searchingDomain ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cari"}
            </Button>
          </div>

          {domainResults.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Domain</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Ekstensi</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Harga/thn</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {domainResults.map((result) => (
                    <tr key={`${result.domain}${result.extension}`}>
                      <td className="px-4 py-3 font-medium">
                        {result.domain}
                        <span className="text-gray-500">{result.extension}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{result.extension}</td>
                      <td className="px-4 py-3">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                        }).format(result.price)}
                      </td>
                      <td className="px-4 py-3">
                        {result.available ? (
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              state.customDomain === `${result.domain}${result.extension}`
                                ? "default"
                                : "outline"
                            }
                            className={
                              state.customDomain === `${result.domain}${result.extension}`
                                ? "bg-primary text-white"
                                : ""
                            }
                            onClick={() =>
                              updateState({
                                customDomain: `${result.domain}${result.extension}`,
                              })
                            }
                          >
                            {state.customDomain === `${result.domain}${result.extension}`
                              ? "Dipilih"
                              : "Pilih"}
                          </Button>
                        ) : (
                          <span className="text-gray-400 text-xs">Tidak tersedia</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {state.customDomain && (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Domain dipilih: {state.customDomain}
            </div>
          )}
        </div>
      )}

      {/* Own Domain Tab */}
      {activeTab === "own" && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ownDomain">Domain Anda</Label>
            <Input
              id="ownDomain"
              type="text"
              value={ownDomainInput}
              onChange={(e) => {
                setOwnDomainInput(e.target.value);
                updateState({ ownDomain: e.target.value });
              }}
              placeholder="contoh: tokobajumurah.com"
            />
          </div>

          {/* DNS Instructions */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
              onClick={() => setShowDnsInstructions(!showDnsInstructions)}
            >
              <span>Cara menghubungkan domain</span>
              {showDnsInstructions ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {showDnsInstructions && (
              <div className="px-4 py-4 space-y-3 text-sm">
                <p className="text-gray-600 font-medium">
                  Tambahkan record DNS berikut di panel domain Anda:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 font-mono text-xs">
                    <span className="text-gray-500 w-14 shrink-0">A record</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-primary font-semibold">76.76.21.21</span>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 font-mono text-xs">
                    <span className="text-gray-500 w-14 shrink-0">CNAME www</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-primary font-semibold">cname.vercel-dns.com</span>
                  </div>
                </div>
                <p className="text-gray-400 text-xs">
                  Perubahan DNS biasanya memerlukan waktu 24-48 jam untuk aktif.
                </p>
              </div>
            )}
          </div>

          {state.ownDomain && state.ownDomain.includes(".") && (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Domain dikonfigurasi: {state.ownDomain}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={goBack}>
          ← Kembali
        </Button>
        <Button
          onClick={goNext}
          disabled={!isNextEnabled()}
          className="bg-primary text-white hover:bg-primary/90 px-8 disabled:opacity-50"
        >
          Lanjut →
        </Button>
      </div>
    </div>
  );
}
