"use client";

import { Button } from "@/components/ui/button";

const ClosingCTA = () => {
  return (
    <section className="section-padding bg-gradient-to-r from-primary to-secondary">
      <div className="container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto text-white">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Mulai Bangun Webstore Milikmu Sekarang
          </h2>
          
          <p className="text-xl md:text-2xl mb-8 opacity-90 leading-relaxed">
            Cukup kirim file Excel Shopee, sisanya biar Storo.id yang urus.
          </p>

          <div className="space-y-4 md:space-y-0 md:space-x-6 md:flex md:justify-center md:items-center">
            <Button 
              size="lg"
              className="bg-white text-primary hover:bg-gray-100 font-bold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              onClick={() => window.open('https://wa.me/6285148416700?text=Halo%20Storo.id,%20saya%20siap%20mulai%20buat%20webstore!', '_blank')}
            >
              Hubungi via WhatsApp Sekarang
            </Button>
          </div>

          <div className="mt-8 text-lg opacity-80">
            <p>💬 Respon cepat dalam 5 menit</p>
            <p>🎯 Konsultasi gratis tanpa komitmen</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClosingCTA;