"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface PlanCard {
  key: string;
  name: string;
  defaultSetup: number;
  defaultMonthly: number;
}

const PLANS: PlanCard[] = [
  { key: "starter", name: "Starter", defaultSetup: 500000, defaultMonthly: 149000 },
  { key: "business", name: "Business", defaultSetup: 1000000, defaultMonthly: 299000 },
  { key: "enterprise", name: "Enterprise", defaultSetup: 2500000, defaultMonthly: 599000 },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

interface PlanPricing {
  plan_key: string;
  setup_price: number;
  monthly_price: number;
}

export default function PricingPage() {
  const [prices, setPrices] = useState<Record<string, { setup: number; monthly: number }>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, { type: "success" | "error"; text: string }>>({});
  const [tableExists, setTableExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase
      .from("plan_pricing")
      .select("plan_key, setup_price, monthly_price")
      .then(({ data, error }) => {
        if (error || !data) {
          setTableExists(false);
          // Use defaults
          const defaults: Record<string, { setup: number; monthly: number }> = {};
          PLANS.forEach((p) => {
            defaults[p.key] = { setup: p.defaultSetup, monthly: p.defaultMonthly };
          });
          setPrices(defaults);
        } else {
          setTableExists(true);
          const priceMap: Record<string, { setup: number; monthly: number }> = {};
          PLANS.forEach((p) => {
            const row = (data as PlanPricing[]).find((d) => d.plan_key === p.key);
            priceMap[p.key] = {
              setup: row?.setup_price ?? p.defaultSetup,
              monthly: row?.monthly_price ?? p.defaultMonthly,
            };
          });
          setPrices(priceMap);
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async (planKey: string) => {
    setSaving((prev) => ({ ...prev, [planKey]: true }));
    setMessages((prev) => ({ ...prev, [planKey]: { type: "success", text: "" } }));

    try {
      const res = await fetch("/api/superadmin/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_key: planKey,
          setup_price: prices[planKey].setup,
          monthly_price: prices[planKey].monthly,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");
      setMessages((prev) => ({
        ...prev,
        [planKey]: { type: "success", text: "Harga berhasil disimpan." },
      }));
    } catch (err: unknown) {
      setMessages((prev) => ({
        ...prev,
        [planKey]: {
          type: "error",
          text: err instanceof Error ? err.message : "Terjadi kesalahan",
        },
      }));
    } finally {
      setSaving((prev) => ({ ...prev, [planKey]: false }));
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-20 text-gray-400">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pricing & Plans</h1>
        <p className="text-gray-500 mt-1 text-sm">Kelola harga paket platform</p>
      </div>

      {!tableExists && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
          Harga saat ini adalah nilai default. Buat tabel <code className="font-mono bg-yellow-100 px-1 rounded">plan_pricing</code> di Supabase untuk mengaktifkan pengeditan dinamis.
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-4"
          >
            <div>
              <h2 className="font-semibold text-gray-900 text-lg">{plan.name}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Paket {plan.name}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Setup Price
                </label>
                <input
                  type="number"
                  value={prices[plan.key]?.setup ?? plan.defaultSetup}
                  onChange={(e) =>
                    setPrices((prev) => ({
                      ...prev,
                      [plan.key]: { ...prev[plan.key], setup: parseFloat(e.target.value) || 0 },
                    }))
                  }
                  disabled={!tableExists}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {formatCurrency(prices[plan.key]?.setup ?? plan.defaultSetup)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Monthly Price
                </label>
                <input
                  type="number"
                  value={prices[plan.key]?.monthly ?? plan.defaultMonthly}
                  onChange={(e) =>
                    setPrices((prev) => ({
                      ...prev,
                      [plan.key]: { ...prev[plan.key], monthly: parseFloat(e.target.value) || 0 },
                    }))
                  }
                  disabled={!tableExists}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {formatCurrency(prices[plan.key]?.monthly ?? plan.defaultMonthly)}
                </p>
              </div>
            </div>

            {messages[plan.key]?.text && (
              <div
                className={`text-xs px-3 py-2 rounded-lg ${
                  messages[plan.key].type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {messages[plan.key].text}
              </div>
            )}

            <button
              onClick={() => handleSave(plan.key)}
              disabled={!tableExists || saving[plan.key]}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving[plan.key] ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
