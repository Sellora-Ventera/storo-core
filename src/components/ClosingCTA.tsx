"use client";

import { MessageCircle, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

const ClosingCTA = () => {
  return (
    <section className="section-padding bg-gradient-to-r from-primary to-secondary">
      <div className="container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto text-white">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Saatnya Toko Anda Bekerja untuk Anda — Bukan untuk Marketplace
          </h2>

          <p className="text-xl md:text-2xl mb-8 opacity-90 leading-relaxed">
            Pesan webstore hari ini, live dalam 1–3 hari kerja. Setup beres, hemat 23% per
            transaksi, data pelanggan jadi milik Anda — selamanya.
          </p>

          <div className="space-y-4 md:space-y-0 md:space-x-6 md:flex md:justify-center md:items-center">
            <Button
              asChild
              size="lg"
              className="bg-white text-primary hover:bg-gray-100 font-bold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <a href="/onboarding">Pesan Toko Sekarang</a>
            </Button>
          </div>

          <div className="mt-8 text-base md:text-lg opacity-80 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
            <span className="inline-flex items-center gap-2">
              <MessageCircle className="w-5 h-5 shrink-0" />
              Respon cepat dalam 5 menit
            </span>
            <span className="inline-flex items-center gap-2">
              <Target className="w-5 h-5 shrink-0" />
              Konsultasi gratis tanpa komitmen
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClosingCTA;
