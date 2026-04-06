"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClipboardList, Wrench, Rocket } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: ClipboardList,
    title: "Daftar & Pilih Paket",
    description:
      "Buat akun, isi profil bisnis, pilih plan yang sesuai, pilih template toko, dan tentukan domain Anda. Cukup isi formulir — Tim Storo yang kerjakan sisanya.",
    note: "Selesai dalam 10 menit",
  },
  {
    number: "02",
    icon: Wrench,
    title: "Tim Storo Setup Semua",
    description:
      "Tim kami yang menyiapkan ribuan produk, foto, deskripsi, payment gateway Xendit/Midtrans, ongkir otomatis 11+ kurir, hingga deploy ke domain Anda. Anda tidak perlu sentuh apapun.",
    note: "1–3 hari kerja",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Toko Live — Anda Terima Beres",
    description:
      "Toko online Anda langsung aktif dan siap transaksi. Kelola produk, pantau order, buat promo gratis ongkir, dan bangun repeat order dari pelanggan yang sudah kenal brand Anda.",
    note: "Siap terima pesanan pertama",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="section-padding bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 fade-in">
          <span className="inline-block text-sm font-semibold text-primary bg-white px-4 py-1.5 rounded-full border border-primary/20 mb-4">
            Cara Kerja
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Hanya <span className="text-primary">3 Langkah</span> untuk Punya Webstore
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Kami yang urus semua teknis — Anda cukup daftar, isi formulir, dan tunggu toko online siap
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-0.5 bg-gradient-to-r from-primary via-secondary to-primary opacity-30 z-0" />

            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative z-10 fade-in">
                  <div className="bg-white rounded-2xl p-7 shadow-md hover:shadow-xl transition-all duration-300 border border-white/80 h-full flex flex-col">
                    {/* Step number + icon */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-4xl font-black text-gray-100 select-none">
                        {step.number}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-bold text-gray-900 mb-3 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1">
                      {step.description}
                    </p>

                    {/* Note badge */}
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/8 px-3 py-1.5 rounded-full w-fit">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                      {step.note}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="text-center mt-12 fade-in">
            <p className="text-gray-600 mb-5">
              Proses mudah — mulai sekarang tanpa komitmen
            </p>
            <Button asChild className="btn-hero gap-2 cursor-pointer">
              <Link href="/sign-up">
                Daftar Sekarang
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
