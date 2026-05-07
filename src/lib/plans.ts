// ── Single source of truth for Storo plan data (V3) ─────────────────────
// Mirrors `plans` table in Supabase. Static for sync access during MVP;
// can be refactored to DB loader in future without changing consumer API.
//
// V3 active plans: standard + custom
// Legacy plans: starter, pro, advance, flexible (grandfathered, hidden from wizard)

export type PlanId =
  | "standard"
  | "custom"
  // legacy
  | "starter"
  | "pro"
  | "advance"
  | "flexible";

export type BillingModel = "storo_gateway" | "own_prepaid";

export interface Plan {
  id: PlanId;
  name: string;
  setup: number | null; // IDR, null = custom quote
  monthly: number | null; // IDR/month, null = custom quote
  monthlyLabel?: string;
  popular?: boolean;
  enterprise?: boolean;
  features: string[];
  /** false = legacy plan, hidden from new onboarding wizard */
  isActive: boolean;
  /** true = grandfathered, kept for existing customers' billing display */
  isLegacy: boolean;
  /** allowed billing models for this plan */
  allowedBillingModels: BillingModel[];
}

export const PLANS: Plan[] = [
  {
    id: "standard",
    name: "Standard",
    setup: 5_000_000,
    monthly: 750_000,
    isActive: true,
    isLegacy: false,
    allowedBillingModels: ["storo_gateway", "own_prepaid"],
    features: [
      "Custom design (template-inspired)",
      "Custom domain",
      "Payment gateway (Xendit & Midtrans)",
      "Ongkos kirim otomatis (Biteship)",
      "Dashboard lengkap",
      "Blog & SEO tools",
      "Promo & kode diskon",
      "Analitik penjualan",
      "Import produk dari Shopee",
    ],
  },
  {
    id: "custom",
    name: "Custom",
    setup: null,
    monthly: null,
    monthlyLabel: "Hubungi Kami",
    enterprise: true,
    isActive: true,
    isLegacy: false,
    allowedBillingModels: ["storo_gateway", "own_prepaid"],
    features: [
      "Bespoke design (animations, layout custom)",
      "Custom domain",
      "Payment gateway (Xendit & Midtrans)",
      "Ongkos kirim otomatis (Biteship)",
      "Dashboard lengkap",
      "Blog & SEO tools",
      "Promo & kode diskon",
      "Analitik penjualan",
      "Import produk dari Shopee",
      "Multi-admin",
      "Integrasi API",
      "Dedicated support",
    ],
  },
  // ── Legacy plans (hidden from wizard, kept for existing customer billing) ──
  {
    id: "starter",
    name: "Starter (Legacy)",
    setup: 1_500_000,
    monthly: 250_000,
    isActive: false,
    isLegacy: true,
    allowedBillingModels: ["storo_gateway"],
    features: ["Legacy plan"],
  },
  {
    id: "pro",
    name: "Pro (Legacy)",
    setup: 3_500_000,
    monthly: 500_000,
    popular: true,
    isActive: false,
    isLegacy: true,
    allowedBillingModels: ["storo_gateway"],
    features: ["Legacy plan"],
  },
  {
    id: "advance",
    name: "Advance (Legacy)",
    setup: 7_500_000,
    monthly: 1_000_000,
    isActive: false,
    isLegacy: true,
    allowedBillingModels: ["storo_gateway"],
    features: ["Legacy plan"],
  },
  {
    id: "flexible",
    name: "Flexible (Legacy)",
    setup: 5_000_000,
    monthly: 750_000,
    isActive: false,
    isLegacy: true,
    allowedBillingModels: ["storo_gateway"],
    features: ["Legacy plan"],
  },
];

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

/** Plans visible in onboarding wizard / pricing page (active, non-legacy) */
export function getActivePlans(): Plan[] {
  return PLANS.filter((p) => p.isActive);
}

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
