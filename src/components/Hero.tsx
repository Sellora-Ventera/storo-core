"use client";

import Link from "next/link";
import { Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="bg-gradient-to-br from-primary/5 to-secondary/5 section-padding">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo */}
          <div className="mb-8 fade-in">
            <p className="text-4xl md:text-6xl font-bold text-primary mb-2">
              Storo.id
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto"></div>
          </div>

          {/* Pre-headline pain hook */}
          <div className="mb-5 fade-in">
            <span className="inline-block text-xs sm:text-sm font-semibold text-red-600 bg-red-50 border border-red-100 px-4 py-1.5 rounded-full">
              Stop kasih 28% omset Anda ke marketplace
            </span>
          </div>

          {/* Main Headline — H1 dengan primary keyword */}
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight fade-in">
            Punya Webstore Sendiri —{" "}
            <span className="text-primary">Tanpa Ribet, Tanpa Fee 28%, Tanpa Coding.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-2xl text-gray-600 mb-8 leading-relaxed fade-in">
            Tim Storo setup webstore lengkap untuk Anda — produk, payment gateway,
            11+ kurir, loyalty &amp; membership, blog SEO. Live dalam{" "}
            <span className="font-semibold text-secondary">
              1–3 hari kerja
            </span>
            , data pelanggan 100% milik Anda.
          </p>

          {/* Quick value bullets */}
          <ul className="fade-in flex flex-wrap justify-center gap-x-5 gap-y-2 mb-8 text-sm text-gray-700">
            <li className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-secondary" />
              Hemat puluhan juta/tahun dari fee
            </li>
            <li className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-secondary" />
              Database pelanggan 100% milik Anda
            </li>
            <li className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-secondary" />
              Setup beres oleh tim kami
            </li>
          </ul>

          {/* CTA Buttons */}
          <div className="fade-in flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="btn-hero text-lg"
            >
              <Link href="/onboarding">Pesan Toko Sekarang</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg border-2 border-green-500 text-green-600 hover:bg-green-500 hover:text-white cursor-pointer"
              onClick={() => window.open('https://wa.me/6285148416700?text=Halo%20Storo.id,%20saya%20mau%20konsultasi%20gratis%20untuk%20webstore', '_blank')}
            >
              Konsultasi Gratis
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 fade-in">
            <p className="text-sm text-gray-500 mb-4">Dipercaya oleh 500+ seller Shopee yang sudah pindah ke webstore sendiri</p>
            <div className="flex justify-center items-center space-x-8 opacity-80">
              <div className="flex items-center gap-2 text-2xl font-bold text-primary">
                <Star className="w-6 h-6 fill-secondary text-secondary" />
                4.9/5
              </div>
              <div className="text-sm text-gray-600">Rating dari klien</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;