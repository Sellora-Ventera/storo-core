"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Database, TrendingUp, ShieldCheck, AlertCircle } from "lucide-react";

const sellerWins = [
  {
    icon: Database,
    stat: "2.000+",
    statColor: "text-primary",
    title: "Data pelanggan sudah di tangan mereka",
    desc: "Seller lain sudah tahu siapa yang beli, kapan beli, dan beli apa. Mereka bisa follow up, bisa retarget, bisa kirim promo personal. Kamu?",
  },
  {
    icon: TrendingUp,
    stat: "+40%",
    statColor: "text-green-600",
    title: "Repeat order naik tanpa bayar iklan",
    desc: "Karena pelanggan sudah kenal brand mereka sendiri — bukan brand Shopee. Promo gratis ongkir cukup untuk bikin mereka balik beli lagi.",
  },
  {
    icon: ShieldCheck,
    stat: "5%",
    statColor: "text-primary",
    title: "Profit terjaga dengan customer retention",
    desc: "Fee 5% vs 28% Shopee. Uang yang tadinya habis ke marketplace, sekarang dipakai untuk promo sendiri — hasilnya lebih besar, lebih efisien.",
  },
];

const FOMOSection = () => {
  return (
    <section className="section-padding bg-gray-900 relative overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary rounded-full translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="relative container mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-14 fade-in">
          <div className="inline-flex items-center gap-2 bg-red-500/15 text-red-400 border border-red-500/20 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <AlertCircle className="w-4 h-4" />
            Sementara Kamu Masih Pikir-pikir...
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
            Seller Lain Sudah Jauh di Depan
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Setiap hari kamu menunggu, pelanggan makin nyaman belanja di toko kompetitor — dan makin susah balik ke kamu.
          </p>
        </div>

        {/* Win cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-14">
          {sellerWins.map(({ icon: Icon, stat, statColor, title, desc }, i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 rounded-2xl p-7 hover:border-primary/40 hover:bg-white/8 transition-all duration-300 fade-in"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className={`text-3xl font-black ${statColor}`}>{stat}</span>
              </div>
              <h3 className="text-white font-bold text-base mb-2 leading-snug">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* FOMO kicker */}
        <div className="text-center fade-in">
          <div className="bg-gradient-to-r from-primary/20 to-secondary/20 border border-white/10 rounded-2xl p-8 max-w-2xl mx-auto mb-8">
            <p className="text-white text-xl font-bold mb-2">
              Kamu kapan?
            </p>
            <p className="text-gray-300 text-base leading-relaxed">
              Jangan tunggu sampai pelanggan kamu terlanjur nyaman di toko kompetitor.
              Pindah ke website sendiri sekarang — sebelum terlambat.
            </p>
          </div>

          <Button
            size="lg"
            asChild
            className="btn-hero text-base h-14 px-10 gap-2 cursor-pointer"
          >
            <Link href="/sign-up">
              Buka Toko Sendiri Sekarang
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>

      </div>
    </section>
  );
};

export default FOMOSection;
