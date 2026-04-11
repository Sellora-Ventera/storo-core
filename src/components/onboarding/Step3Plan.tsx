"use client";

import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";
import type { WizardState } from "./OnboardingWizard";

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
    features: [
      "Import produk",
      "Custom domain",
      "Payment gateway",
      "Ongkos kirim otomatis",
      "Dashboard dasar",
    ],
  },
  {
    id: "business",
    name: "Business",
    setup: 3500000,
    monthly: 500000,
    badge: "Direkomendasikan",
    features: [
      "Semua fitur Starter",
      "Blog & SEO",
      "Promo & diskon",
      "Analitik penjualan",
      "Prioritas support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    setup: 7500000,
    monthly: 1000000,
    features: [
      "Semua fitur Business",
      "Multi-admin",
      "Custom theme",
      "Integrasi API",
      "Dedicated support",
    ],
  },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

interface Step3Props {
  state: WizardState;
  goNext: () => void;
  goBack: () => void;
  updateState: (partial: Partial<WizardState>) => void;
}

export default function Step3Plan({ state, goNext, goBack, updateState }: Step3Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Pilih Paket</h2>
      <p className="text-sm text-gray-500 mb-6">
        Pilih paket yang sesuai dengan kebutuhan bisnis Anda.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isSelected = state.plan === plan.id;
          const isBusiness = plan.id === "business";

          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => updateState({ plan: plan.id as WizardState["plan"] })}
              className={`relative flex flex-col text-left rounded-xl border-2 p-5 transition-all focus:outline-none
                ${
                  isSelected
                    ? "ring-2 ring-primary bg-primary/5 border-primary"
                    : isBusiness
                    ? "border-secondary/40 hover:border-secondary"
                    : "border-gray-200 hover:border-gray-300"
                }`}
            >
              {/* Badge */}
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-white text-xs font-semibold px-3 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {plan.badge}
                </span>
              )}

              <div className="mt-1">
                <h3 className="font-bold text-gray-900 text-base">{plan.name}</h3>
                <p className="text-primary font-semibold text-lg mt-1">
                  {formatCurrency(plan.setup)}
                </p>
                <p className="text-gray-500 text-xs">biaya setup</p>
                <p className="text-gray-700 text-sm font-medium mt-1">
                  {formatCurrency(plan.monthly)}
                  <span className="text-gray-400 font-normal">/bln</span>
                </p>
              </div>

              <div className="mt-4 space-y-1.5 flex-1">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <span className="text-xs text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>

              {isSelected && (
                <div className="mt-3 flex items-center gap-1.5 text-primary text-xs font-semibold">
                  <Check className="w-4 h-4" />
                  Dipilih
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={goBack}>
          ← Kembali
        </Button>
        <Button
          onClick={goNext}
          disabled={!state.plan}
          className="bg-primary text-white hover:bg-primary/90 px-8 disabled:opacity-50"
        >
          Lanjut →
        </Button>
      </div>
    </div>
  );
}
