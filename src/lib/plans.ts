// ── Single source of truth for Storo.id plan data ───────────────────────
// Imported by: pricing page, onboarding wizard, checkout API route

export type PlanId = "starter" | "pro" | "advance" | "flexible" | "custom";

export interface Plan {
  id: PlanId;
  name: string;
  setup: number | null; // IDR, null = custom quote
  monthly: number | null; // IDR/month, null = custom quote
  monthlyLabel?: string;
  popular?: boolean;
  enterprise?: boolean;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    setup: 1500000,
    monthly: 250000,
    features: [
      "Import produk dari Shopee",
      "Custom domain",
      "Payment gateway (Xendit)",
      "Ongkos kirim otomatis (Biteship)",
      "Dashboard dasar",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    setup: 3500000,
    monthly: 500000,
    popular: true,
    features: [
      "Import produk dari Shopee",
      "Custom domain",
      "Payment gateway (Xendit)",
      "Ongkos kirim otomatis (Biteship)",
      "Dashboard dasar",
      "Blog & SEO tools",
      "Promo & kode diskon",
      "Analitik penjualan",
      "Prioritas support",
    ],
  },
  {
    id: "advance",
    name: "Advance",
    setup: 7500000,
    monthly: 1000000,
    features: [
      "Import produk dari Shopee",
      "Custom domain",
      "Payment gateway (Xendit)",
      "Ongkos kirim otomatis (Biteship)",
      "Dashboard dasar",
      "Blog & SEO tools",
      "Promo & kode diskon",
      "Analitik penjualan",
      "Prioritas support",
      "Multi-admin",
      "Custom theme/design",
      "Integrasi API",
      "Dedicated support",
    ],
  },
  {
    id: "flexible",
    name: "Flexible",
    setup: 5000000,
    monthly: 750000,
    features: [
      "Import produk dari Shopee",
      "Custom domain",
      "Payment gateway (Xendit)",
      "Ongkos kirim otomatis (Biteship)",
      "Dashboard dasar",
      "Blog & SEO tools",
      "Promo & kode diskon",
      "Analitik penjualan",
      "Prioritas support",
    ],
  },
  {
    id: "custom",
    name: "Custom",
    setup: null,
    monthly: null,
    monthlyLabel: "Hubungi Kami",
    enterprise: true,
    features: [
      "Import produk dari Shopee",
      "Custom domain",
      "Payment gateway (Xendit)",
      "Ongkos kirim otomatis (Biteship)",
      "Dashboard dasar",
      "Blog & SEO tools",
      "Promo & kode diskon",
      "Analitik penjualan",
      "Prioritas support",
      "Multi-admin",
      "Custom theme/design",
      "Integrasi API",
      "Dedicated support",
    ],
  },
];

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
