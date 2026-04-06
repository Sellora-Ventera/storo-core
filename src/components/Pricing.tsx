"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, MessageCircle } from "lucide-react";

const packages = [
  {
    name: "Starter",
    setupPrice: "Rp 1.500.000",
    monthly: "Rp 250.000/bln",
    description: "Untuk bisnis yang baru mulai",
    features: [
      "1 toko, maks 500 produk",
      "Template basic",
      "Payment gateway siap pakai",
      "Ongkir otomatis 11+ kurir",
      "Subdomain gratis (.storo.id)",
      "Support via WhatsApp",
    ],
    popular: false,
    cta: "Mulai dengan Starter",
  },
  {
    name: "Business",
    setupPrice: "Rp 3.500.000",
    monthly: "Rp 500.000/bln",
    description: "Paling populer untuk seller aktif",
    features: [
      "1 toko, produk unlimited",
      "Template premium pilihan",
      "Payment gateway siap pakai",
      "Ongkir otomatis 11+ kurir",
      "Free domain 1 tahun",
      "Blog CMS + API automation",
      "Promo codes & banner",
      "Priority support",
    ],
    popular: true,
    cta: "Pilih Business",
  },
  {
    name: "Enterprise",
    setupPrice: "Rp 7.500.000",
    monthly: "Rp 1.000.000/bln",
    description: "Untuk seller dengan volume tinggi",
    features: [
      "Multi-toko",
      "Template custom design",
      "Semua fitur Business",
      "Priority support (SLA 24 jam)",
      "API access",
      "Analytics lanjutan",
    ],
    popular: false,
    cta: "Pilih Enterprise",
  },
  {
    name: "Flexible",
    setupPrice: "Rp 5.000.000",
    monthly: "Tanpa biaya bulanan",
    description: "Domain & hosting milik sendiri",
    features: [
      "Setup di hosting customer",
      "Domain customer sendiri",
      "Payment gateway siap pakai",
      "Template premium",
      "Priority support",
      "Lifetime use",
    ],
    popular: false,
    cta: "Pilih Flexible",
  },
  {
    name: "Custom",
    setupPrice: "Harga Khusus",
    monthly: "Sesuai kebutuhan",
    description: "Solusi enterprise skala besar",
    features: [
      "SKU & toko unlimited",
      "Custom features & integrasi",
      "SLA support 2 jam",
      "Marketing automation",
      "Dedicated account manager",
      "Konsultasi strategi bisnis",
    ],
    popular: false,
    cta: "Diskusi Sekarang",
  },
];

const Pricing = () => {
  const handleWhatsApp = (plan: string) => {
    window.open(
      `https://wa.me/6285148416700?text=${encodeURIComponent(
        `Halo Storo.id, saya tertarik dengan paket ${plan}`
      )}`,
      "_blank"
    );
  };

  return (
    <section id="pricing" className="section-padding bg-gray-50">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 fade-in">
          <span className="inline-block text-sm font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4">
            Paket Harga
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Harga <span className="text-primary">Transparan</span>, Tanpa Biaya Tersembunyi
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">
            Pilih paket yang sesuai dengan kebutuhan bisnis Anda. Semua sudah termasuk setup lengkap.
          </p>
          {/* Fee callout */}
          <div className="inline-flex items-center gap-2 bg-white border border-primary/20 text-gray-700 px-5 py-2.5 rounded-full text-sm shadow-sm">
            <span className="font-bold text-primary">+5% per transaksi</span>
            <span className="text-gray-400">|</span>
            <span>1% biaya operasional + 4% payment gateway</span>
            <span className="text-gray-400">|</span>
            <span className="text-green-600 font-medium">vs 28% di Shopee yang terus naik</span>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {packages.map((pkg, index) => (
            <div
              key={index}
              className={`relative flex flex-col bg-white rounded-2xl p-6 transition-all duration-300 fade-in ${
                pkg.popular
                  ? "ring-2 ring-primary shadow-2xl shadow-primary/20 scale-105"
                  : "border border-gray-100 shadow-sm hover:shadow-lg"
              }`}
            >
              {/* Popular badge */}
              {pkg.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-md">
                    Paling Populer
                  </span>
                </div>
              )}

              {/* Plan info */}
              <div className="mb-5">
                <h3
                  className={`text-lg font-bold mb-1 ${
                    pkg.popular ? "text-primary" : "text-gray-900"
                  }`}
                >
                  {pkg.name}
                </h3>
                <p className="text-xs text-gray-500 mb-4">{pkg.description}</p>

                <div
                  className={`text-xl font-black mb-0.5 ${
                    pkg.popular ? "text-primary" : "text-gray-900"
                  }`}
                >
                  {pkg.setupPrice}
                </div>
                <p className="text-xs text-gray-400">setup + {pkg.monthly}</p>
              </div>

              {/* Divider */}
              <div
                className={`h-px mb-5 ${
                  pkg.popular
                    ? "bg-gradient-to-r from-primary/30 to-secondary/30"
                    : "bg-gray-100"
                }`}
              />

              {/* Features */}
              <div className="space-y-2.5 mb-6 flex-1">
                {pkg.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        pkg.popular ? "bg-primary" : "bg-secondary"
                      }`}
                    >
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </div>
                    <span className="text-gray-700 text-xs leading-snug">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {pkg.name === "Custom" ? (
                <Button
                  className="w-full cursor-pointer font-semibold rounded-xl h-11 transition-all duration-200 border-2 border-primary/30 text-primary hover:bg-primary hover:text-white hover:border-primary bg-white"
                  onClick={() => handleWhatsApp(pkg.name)}
                >
                  {pkg.cta}
                </Button>
              ) : (
                <Button
                  asChild
                  className={`w-full cursor-pointer font-semibold rounded-xl h-11 transition-all duration-200 ${
                    pkg.popular
                      ? "btn-hero"
                      : "border-2 border-primary/30 text-primary hover:bg-primary hover:text-white hover:border-primary bg-white"
                  }`}
                >
                  <Link href="/sign-up">{pkg.cta}</Link>
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-14 fade-in">
          <p className="text-gray-600 mb-5">
            Tidak yakin pilih paket mana?{" "}
            <span className="font-medium text-gray-900">Konsultasi dulu gratis!</span>
          </p>
          <Button
            size="lg"
            variant="outline"
            className="border-2 border-primary text-primary hover:bg-primary hover:text-white gap-2 cursor-pointer"
            onClick={() =>
              window.open(
                "https://wa.me/6285148416700?text=Halo%20Storo.id,%20saya%20mau%20konsultasi%20pilih%20paket%20yang%20sesuai",
                "_blank"
              )
            }
          >
            <MessageCircle className="w-5 h-5" />
            Tanya via WhatsApp
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
