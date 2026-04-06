"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageCircle, Clock, Zap, ArrowRight } from "lucide-react";

const ClosingCTA = () => {
  return (
    <section className="section-padding relative overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
      </div>

      <div className="relative container mx-auto px-6 text-center">
        <div className="max-w-3xl mx-auto text-white">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Tim kami siap membantu sekarang
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Siap Buka Toko Online
            <br />
            Milikmu Sendiri?
          </h2>

          <p className="text-lg md:text-xl mb-10 opacity-90 leading-relaxed">
            Daftar sekarang dan isi formulir onboarding.
            <br className="hidden md:block" />
            Tim kami setup toko Anda dalam 1–3 hari kerja.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              asChild
              className="bg-white text-primary hover:bg-gray-50 font-bold text-lg px-10 h-14 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer gap-2"
            >
              <Link href="/sign-up">
                Daftar Sekarang
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="text-white border-2 border-white/40 hover:bg-white/10 hover:border-white font-semibold text-base px-8 h-14 rounded-xl transition-all duration-300 cursor-pointer gap-2"
              onClick={() =>
                window.open(
                  "https://wa.me/6285148416700?text=Halo%20Storo.id,%20saya%20ingin%20konsultasi%20tentang%20webstore",
                  "_blank"
                )
              }
            >
              <MessageCircle className="w-5 h-5" />
              Konsultasi via WhatsApp
            </Button>
          </div>

          {/* Trust signals */}
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-6 text-sm opacity-85">
            <div className="flex items-center gap-2 justify-center">
              <Clock className="w-4 h-4" />
              <span>Respon dalam 5 menit</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <Zap className="w-4 h-4" />
              <span>Konsultasi gratis tanpa komitmen</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <MessageCircle className="w-4 h-4" />
              <span>Support via WhatsApp</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClosingCTA;
