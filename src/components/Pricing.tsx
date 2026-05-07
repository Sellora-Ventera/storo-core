"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { PLANS, formatIDR } from "@/lib/plans";
import DownloadCatalog from "./DownloadCatalog";

const planDescriptions: Record<string, string> = {
  standard: "Custom design oleh tim Storo, fitur lengkap",
  custom: "Bespoke design + integrasi API + dedicated support",
};

const ACTIVE_PLANS = PLANS.filter((p) => p.isActive);

const Pricing = () => {
  return (
    <section id="pricing" className="section-padding bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Paket Harga <span className="text-primary">Transparan</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Pilih paket yang sesuai dengan kebutuhan bisnis Anda
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-6">
          {ACTIVE_PLANS.map((pkg) => {
            const priceLabel =
              pkg.setup !== null ? formatIDR(pkg.setup) : "Custom Price";
            const monthlyLabel =
              pkg.monthly !== null
                ? `Maintenance & hosting: ${formatIDR(pkg.monthly)}/bulan`
                : null;
            const features = monthlyLabel
              ? [...pkg.features, monthlyLabel]
              : pkg.features;
            return (
              <div
                key={pkg.id}
                className={`relative bg-white rounded-xl shadow-lg p-8 ${
                  pkg.popular ? "ring-2 ring-primary" : ""
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="bg-primary text-white px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap">
                      Paling Populer
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {pkg.name}
                  </h3>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {priceLabel}
                  </div>
                  <p className="text-gray-600">
                    {planDescriptions[pkg.id] ?? ""}
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  {features.map((feature) => (
                    <div key={feature} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  asChild
                  className={`w-full cursor-pointer ${
                    pkg.popular ? "btn-hero" : "btn-outline"
                  }`}
                >
                  <Link
                    href={
                      pkg.enterprise
                        ? "https://wa.me/6285157406969"
                        : `/onboarding?plan=${pkg.id}`
                    }
                  >
                    {pkg.enterprise
                      ? "Hubungi Kami"
                      : `Pilih Paket ${pkg.name}`}
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Button asChild size="lg" className="btn-hero">
            <Link href="/onboarding">Pesan Sekarang</Link>
          </Button>
          <DownloadCatalog />
        </div>
      </div>
    </section>
  );
};

export default Pricing;
