import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X, ChevronRight, MessageCircle } from "lucide-react";
import { PLANS, formatIDR } from "@/lib/plans";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Harga Paket - Storo.id",
  description:
    "Pilih paket yang tepat untuk bisnis Anda. Semua paket sudah termasuk setup toko, import produk, dan dukungan tim kami.",
};

const WA_NUMBER = "6285157406969";
const WA_LINK = `https://wa.me/${WA_NUMBER}`;

// Extend shared Plan with pricing-page-specific CTA config
interface PricingPlan {
  id: string;
  name: string;
  setup: number | null;
  monthly: number | null;
  monthlyLabel?: string;
  popular?: boolean;
  enterprise?: boolean;
  ctaLabel: string;
  ctaHref: string;
  ctaVariant?: "primary" | "outline" | "wa";
}

const plans: PricingPlan[] = PLANS.map((p) => ({
  id: p.id,
  name: p.name,
  setup: p.setup,
  monthly: p.monthly,
  monthlyLabel: p.monthlyLabel,
  popular: p.popular,
  enterprise: p.enterprise,
  ctaLabel: p.enterprise ? "Hubungi Kami" : "Pesan Sekarang",
  ctaHref: p.enterprise ? WA_LINK : `/onboarding?plan=${p.id}`,
  ctaVariant: p.enterprise ? "wa" as const : p.popular ? "primary" as const : "outline" as const,
}));

interface Feature {
  label: string;
  starter: boolean;
  pro: boolean;
  advance: boolean;
  flexible: boolean;
  custom: boolean;
}

const features: Feature[] = [
  {
    label: "Import produk dari Shopee",
    starter: true,
    pro: true,
    advance: true,
    flexible: true,
    custom: true,
  },
  {
    label: "Custom domain",
    starter: true,
    pro: true,
    advance: true,
    flexible: true,
    custom: true,
  },
  {
    label: "Payment gateway (Xendit)",
    starter: true,
    pro: true,
    advance: true,
    flexible: true,
    custom: true,
  },
  {
    label: "Ongkos kirim otomatis (Biteship)",
    starter: true,
    pro: true,
    advance: true,
    flexible: true,
    custom: true,
  },
  {
    label: "Dashboard dasar",
    starter: true,
    pro: true,
    advance: true,
    flexible: true,
    custom: true,
  },
  {
    label: "Blog & SEO tools",
    starter: false,
    pro: true,
    advance: true,
    flexible: true,
    custom: true,
  },
  {
    label: "Promo & kode diskon",
    starter: false,
    pro: true,
    advance: true,
    flexible: true,
    custom: true,
  },
  {
    label: "Analitik penjualan",
    starter: false,
    pro: true,
    advance: true,
    flexible: true,
    custom: true,
  },
  {
    label: "Prioritas support",
    starter: false,
    pro: true,
    advance: true,
    flexible: true,
    custom: true,
  },
  {
    label: "Multi-admin",
    starter: false,
    pro: false,
    advance: true,
    flexible: false,
    custom: true,
  },
  {
    label: "Custom theme/design",
    starter: false,
    pro: false,
    advance: true,
    flexible: false,
    custom: true,
  },
  {
    label: "Integrasi API",
    starter: false,
    pro: false,
    advance: true,
    flexible: false,
    custom: true,
  },
  {
    label: "Dedicated support",
    starter: false,
    pro: false,
    advance: true,
    flexible: false,
    custom: true,
  },
];

const faqs = [
  {
    q: "Apakah ada biaya tambahan?",
    a: "Tidak ada biaya tersembunyi. Hanya biaya setup dan langganan bulanan.",
  },
  {
    q: "Bisakah upgrade paket?",
    a: "Ya, Anda bisa upgrade kapan saja. Biaya prorated akan dihitung otomatis.",
  },
  {
    q: "Bagaimana cara bayar?",
    a: "Transfer bank atau via Xendit (QRIS, kartu kredit, VA).",
  },
];

function FeatureIcon({ active }: { active: boolean }) {
  if (active) {
    return <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" aria-label="Tersedia" />;
  }
  return <X className="w-5 h-5 text-gray-300 mx-auto" aria-label="Tidak tersedia" />;
}

function PlanFeatureIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
      </div>
    );
  }
  return <X className="w-4 h-4 text-gray-300 flex-shrink-0" />;
}

function getPlanFeature(plan: PricingPlan, feature: Feature): boolean {
  return feature[plan.id as keyof Omit<Feature, "label">] as boolean;
}

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-white to-secondary/5 pt-28 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">Harga</span>
          </nav>

          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-block text-sm font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4">
              Paket Harga
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              Pilih Paket yang Tepat untuk{" "}
              <span className="text-primary">Bisnis Anda</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Semua paket sudah termasuk setup toko, import produk, dan dukungan
              tim kami.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
            {plans.map((plan) => {
              const planFeatures = features.map((f) => ({
                label: f.label,
                active: getPlanFeature(plan, f),
              }));

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col bg-white rounded-2xl p-6 transition-all duration-300 ${
                    plan.popular
                      ? "ring-2 ring-primary shadow-2xl shadow-primary/20 scale-105 z-10"
                      : plan.enterprise
                      ? "border border-dashed border-gray-200 shadow-sm hover:shadow-md"
                      : "border border-gray-100 shadow-sm hover:shadow-md"
                  }`}
                >
                  {/* Popular badge */}
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                      <span className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-md">
                        ⭐ Paling Populer
                      </span>
                    </div>
                  )}

                  {/* Enterprise badge */}
                  {plan.enterprise && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                      <span className="bg-gray-800 text-white px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-md">
                        Untuk Enterprise
                      </span>
                    </div>
                  )}

                  {/* Plan name & price */}
                  <div className="mb-5 mt-2">
                    <h2
                      className={`text-lg font-bold mb-3 ${
                        plan.popular ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {plan.name}
                    </h2>

                    {plan.setup !== null ? (
                      <>
                        <div
                          className={`text-xl font-black mb-1 ${
                            plan.popular ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {formatIDR(plan.setup)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          setup +{" "}
                          {plan.monthly !== null
                            ? `${formatIDR(plan.monthly)}/bln`
                            : plan.monthlyLabel}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-xl font-black mb-1 text-gray-700">
                          —
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {plan.monthlyLabel}
                        </p>
                      </>
                    )}
                  </div>

                  <div
                    className={`h-px mb-5 ${
                      plan.popular
                        ? "bg-gradient-to-r from-primary/30 to-secondary/30"
                        : "bg-gray-100"
                    }`}
                  />

                  {/* Features */}
                  <div className="space-y-2.5 mb-6 flex-1">
                    {planFeatures.map((f) => (
                      <div key={f.label} className="flex items-start gap-2.5">
                        <div className="flex-shrink-0 mt-0.5">
                          <PlanFeatureIcon active={f.active} />
                        </div>
                        <span
                          className={`text-xs leading-snug ${
                            f.active ? "text-gray-700" : "text-gray-400"
                          }`}
                        >
                          {f.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  {plan.ctaVariant === "wa" ? (
                    <Button
                      asChild
                      variant="outline"
                      className="w-full font-semibold rounded-xl h-11 border-2 border-green-500 text-green-600 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all duration-200"
                    >
                      <a href={plan.ctaHref} target="_blank" rel="noopener noreferrer">
                        {plan.ctaLabel}
                      </a>
                    </Button>
                  ) : plan.popular ? (
                    <Button
                      asChild
                      className="w-full font-semibold rounded-xl h-11 bg-primary hover:bg-primary/90 text-white transition-all duration-200"
                    >
                      <Link href={plan.ctaHref}>{plan.ctaLabel}</Link>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      variant="outline"
                      className="w-full font-semibold rounded-xl h-11 border-2 border-primary/30 text-primary hover:bg-primary hover:text-white hover:border-primary transition-all duration-200"
                    >
                      <Link href={plan.ctaHref}>{plan.ctaLabel}</Link>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Full Comparison Table — desktop only */}
      <section className="hidden md:block py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-foreground mb-10">
            Perbandingan Lengkap Fitur
          </h2>
          <div className="max-w-5xl mx-auto overflow-x-auto rounded-2xl border border-gray-200 shadow-sm bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-6 py-4 font-semibold text-foreground w-64">
                    Fitur
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan.id}
                      className={`px-4 py-4 text-center font-semibold ${
                        plan.popular
                          ? "text-primary bg-primary/5"
                          : "text-foreground"
                      }`}
                    >
                      {plan.name}
                      {plan.popular && (
                        <span className="block text-xs font-normal text-primary/70 mt-0.5">
                          Paling Populer
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((feature, idx) => (
                  <tr
                    key={feature.label}
                    className={`border-b border-gray-100 last:border-0 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    <td className="px-6 py-3.5 text-gray-700 font-medium">
                      {feature.label}
                    </td>
                    {plans.map((plan) => (
                      <td
                        key={plan.id}
                        className={`px-4 py-3.5 text-center ${
                          plan.popular ? "bg-primary/5" : ""
                        }`}
                      >
                        <FeatureIcon active={getPlanFeature(plan, feature)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          <h2 className="text-2xl font-bold text-center text-foreground mb-10">
            Pertanyaan Umum
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-xl border border-gray-100 p-6 shadow-sm bg-white hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-gradient-to-br from-primary/5 via-white to-secondary/5">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg font-semibold text-foreground mb-2">
            Masih bingung? Chat dengan tim kami
          </p>
          <p className="text-muted-foreground mb-6 text-sm">
            Konsultasi gratis, kami bantu pilihkan paket yang paling sesuai.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-green-500 hover:bg-green-600 text-white font-semibold gap-2 rounded-xl px-8"
          >
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-5 h-5" />
              Chat via WhatsApp
            </a>
          </Button>
        </div>
      </section>
      <Footer />
    </div>
  );
}
