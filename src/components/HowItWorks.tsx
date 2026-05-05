"use client";

import { Button } from "@/components/ui/button";

const HowItWorks = () => {
  const steps = [
    {
      step: "1",
      title: "Export produk dari Seller Center",
      description: "Download file Excel dari dashboard Shopee Seller Center Anda"
    },
    {
      step: "2", 
      title: "Kirim file Excel ke Storo.id",
      description: "Upload file melalui form atau kirim langsung via WhatsApp"
    },
    {
      step: "3",
      title: "Webstore siap transaksi",
      description: "Produk, ongkir, dan pembayaran langsung aktif dalam 1-3 hari kerja"
    }
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Cara Pindah dari Shopee ke{" "}
            <span className="text-primary">Webstore Sendiri</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Hanya 3 langkah mudah untuk memiliki toko online sendiri di luar marketplace
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                {/* Connection line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary to-secondary transform translate-x-6 z-0"></div>
                )}
                
                {/* Step circle */}
                <div className="step-indicator mb-6 mx-auto relative z-10">
                  {step.step}
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA after steps */}
          <div className="text-center mt-12">
            <p className="text-lg text-gray-600 mb-6">
              Tidak yakin? Konsultasi dulu gratis!
            </p>
            <Button 
              variant="secondary"
              onClick={() => window.open('https://wa.me/6285157406969?text=Halo%20Storo.id,%20saya%20mau%20tanya%20tentang%20cara%20kerja%20webstore', '_blank')}
            >
              Tanya via WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;