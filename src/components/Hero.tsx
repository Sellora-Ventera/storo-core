"use client";

import Link from "next/link";
import { Star } from "lucide-react";
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

          {/* Main Headline — H1 dengan primary keyword */}
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight fade-in">
            Jasa Buat Webstore dari Shopee –{" "}
            <span className="text-primary">Punya Toko Online Sendiri Tanpa Ribet</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed fade-in">
            Cukup kirim file Excel dari Seller Center, Storo.id akan siapkan webstore lengkap 
            dengan pembayaran & ekspedisi. <span className="font-semibold text-secondary">Praktis, langsung jalan.</span>
          </p>

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
              onClick={() => window.open('https://wa.me/6285157406969?text=Halo%20Storo.id,%20saya%20mau%20konsultasi%20gratis%20untuk%20webstore', '_blank')}
            >
              Konsultasi Gratis
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 fade-in">
            <p className="text-sm text-gray-500 mb-4">Dipercaya oleh 500+ seller Shopee</p>
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