// ── Single source of truth for Storo plan data (V3) ─────────────────────
// Mirrors `plans` table in Supabase. Static for sync access during MVP;
// can be refactored to DB loader in future without changing consumer API.
//
// V3 active plans: basic + standard + business + custom
// Legacy plans: starter, pro, advance, flexible (grandfathered, hidden from wizard)

export type PlanId =
  | "basic"
  | "standard"
  | "business"
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
    id: "basic",
    name: "Basic",
    setup: 1_000_000,
    monthly: 150_000,
    isActive: true,
    isLegacy: false,
    allowedBillingModels: ["storo_gateway", "own_prepaid"],
    features: [
      "Template-inspired design (5 pilihan)",
      "Subdomain *.storo.id (custom domain add-on)",
      "Sampai 100 produk",
      "Payment gateway (Xendit)",
      "Ongkos kirim Biteship (3 kurir utama)",
      "Dashboard standar + analitik dasar",
      "Promo & kode diskon",
      "Email support (response 2x24 jam)",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    setup: 2_500_000,
    monthly: 350_000,
    popular: true,
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
    id: "business",
    name: "Business",
    setup: 5_000_000,
    monthly: 750_000,
    isActive: true,
    isLegacy: false,
    allowedBillingModels: ["storo_gateway", "own_prepaid"],
    features: [
      "Semua fitur Standard",
      "Loyalty points & membership tiers",
      "Reviews moderation & free shipping rules",
      "Multi-admin (sampai 10 user, role-based)",
      "Multi-toko (cabang/sub-brand, 1 billing)",
      "API access + custom webhook",
      "Onboarding & training 1-on-1 (2 sesi)",
      "Dedicated account manager",
      "SLA 99.9% uptime",
      "Backup mingguan",
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
      "Semua fitur Business",
      "Bespoke design (animations, layout 100% custom)",
      "Integrasi API custom (ERP/POS/CRM/marketplace)",
      "White-label option",
      "Dedicated infra / region",
      "24/7 support + on-call engineer",
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

// ─── Referral program helpers (Sharelink integration) ─────────────────────
// Tier mapping dipakai oleh:
//   - /api/referral/preview-discount → tampilkan diskon untuk referee
//   - Xendit webhook → cap cek reward kumulatif per bulan
//
// Legacy plans di-map ke tier setara berdasar harga monthly:
//   starter (250k) ≈ basic, pro (500k) ≈ standard, advance (1M) ≈ business,
//   flexible (750k) ≈ business

const DISCOUNT_PERCENT_BY_PLAN: Record<PlanId, number> = {
  basic: 10,
  standard: 15,
  business: 20,
  custom: 20,
  starter: 10,
  pro: 15,
  advance: 20,
  flexible: 20,
};

/** Persen diskon setup fee untuk referee, berdasar paket aktif referrer. */
export function getDiscountPercentForPlan(planId: string): number {
  return DISCOUNT_PERCENT_BY_PLAN[planId as PlanId] ?? 0;
}

/**
 * Cap reward kumulatif per bulan untuk referrer = monthly fee paket aktif.
 * Returns 0 kalau plan tidak ditemukan atau custom (null monthly).
 *
 * Filosofi: max referrer bisa "gratiskan" subscription bulan itu via referral.
 */
export function getRewardCapForPlan(planId: string): number {
  const plan = getPlan(planId);
  return plan?.monthly ?? 0;
}
