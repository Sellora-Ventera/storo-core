"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  MessageCircle,
  TrendingDown,
  Store,
  Users,
  CreditCard,
  Truck,
  Gift,
  Database,
} from "lucide-react";
import storoLogo from "@/assets/storo-logo.png";

const stats = [
  { icon: Users, value: "500+", label: "Seller Sudah Pindah ke Toko Sendiri" },
  { icon: Store, value: "1–3", label: "Hari Kerja Toko Kamu Langsung Live" },
  { icon: TrendingDown, value: "28%", label: "Fee Shopee & Terus Naik Tiap Tahun", red: true },
];

const featurePills = [
  {
    icon: CreditCard,
    title: "Bayar Pakai Apa Aja",
    desc: "Transfer, e-wallet, QRIS, kartu kredit — semua metode pembayaran sudah siap dari hari pertama.",
  },
  {
    icon: Truck,
    title: "Ongkir Otomatis, Kurir Bebas Pilih",
    desc: "JNE, J&T, SiCepat, AnterAja dan 11+ kurir lain — harga ongkir muncul real-time di checkout.",
  },
  {
    icon: Gift,
    title: "Promo Gratis Ongkir di Tangan Kamu",
    desc: "Kasih gratis ongkir khusus Jabodetabek, Pulau Jawa, atau subsidi ongkir se-Indonesia — kamu yang tentukan.",
  },
  {
    icon: Database,
    title: "Data Pelanggan 100% Milik Kamu",
    desc: "Nama, kontak, riwayat beli — semua tersimpan di tokomu. Bukan di Shopee, bukan di marketplace lain.",
  },
];

const Hero = () => {
  const handleWhatsApp = () => {
    window.open(
      "https://wa.me/6285148416700?text=Halo%20Storo.id,%20saya%20mau%20konsultasi%20gratis%20untuk%20webstore",
      "_blank"
    );
  };

  return (
    <section className="relative overflow-hidden bg-white pt-16">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 rounded-full translate-y-1/3 -translate-x-1/3" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-primary/3 to-secondary/3 rounded-full" />
      </div>

      <div className="relative container mx-auto px-6 py-20 md:py-28">
        <div className="max-w-4xl mx-auto text-center">

          {/* Logo */}
          <div className="flex justify-center mb-8 fade-in">
            <Image
              src={storoLogo}
              alt="Storo.id"
              height={56}
              width={180}
              priority
              className="h-12 md:h-14 w-auto object-contain"
            />
          </div>

          {/* Pain badge */}
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-full text-sm font-semibold mb-6 fade-in">
            <TrendingDown className="w-4 h-4" />
            Fee Shopee sudah 28% — dan tahun depan makin tinggi
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-5 leading-tight fade-in">
            Makin Laku di Shopee,{" "}
            <span className="bg-gradient-to-r from-red-500 to-secondary bg-clip-text text-transparent">
              Makin Besar
            </span>{" "}
            yang Dipotong?
          </h1>

          {/* Kicker */}
          <p className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 fade-in">
            Sudah saatnya punya toko online sendiri.{" "}
            <span className="text-primary">Tanpa ribet. Storo yang urus semuanya.</span>
          </p>

          {/* Supporting copy */}
          <p className="text-base md:text-lg text-gray-500 mb-10 leading-relaxed max-w-2xl mx-auto fade-in">
            Kamu nggak perlu ngerti teknis, nggak perlu ngurus apapun.
            Cukup daftar — Tim Storo yang siapkan toko kamu dari nol sampai live.{" "}
            <span className="font-semibold text-gray-700">Terima beres dalam 1–3 hari kerja.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 fade-in">
            <Button
              size="lg"
              asChild
              className="btn-hero text-base h-14 px-8 gap-2 cursor-pointer"
            >
              <Link href="/sign-up">
                Mulai Sekarang — Gratis Konsultasi
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-gray-300 text-gray-700 hover:border-primary hover:text-primary h-14 px-8 gap-2 rounded-xl font-semibold transition-all duration-200 cursor-pointer"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="w-5 h-5" />
              Tanya Tim Storo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-16 fade-in">
            {stats.map(({ icon: Icon, value, label, red }, i) => (
              <div
                key={i}
                className={`flex flex-col items-center gap-1 p-4 rounded-2xl shadow-sm border ${
                  red ? "bg-red-50 border-red-100" : "bg-white border-gray-100"
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${red ? "text-red-500" : "text-primary"}`} />
                <span className={`text-xl font-bold ${red ? "text-red-500" : "text-gray-900"}`}>
                  {value}
                </span>
                <span className="text-xs text-gray-500 text-center leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Feature pills — what you get */}
        <div className="max-w-5xl mx-auto fade-in">
          <p className="text-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">
            Semua sudah disiapkan Tim Storo untuk kamu
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featurePills.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={i}
                className="bg-gray-50 border border-gray-100 rounded-2xl p-5 hover:border-primary/30 hover:bg-primary/3 transition-all duration-200"
              >
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1 leading-snug">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
