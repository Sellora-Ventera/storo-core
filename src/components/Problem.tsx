import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrendingDown, ShieldOff, RepeatIcon, AlertTriangle, ArrowRight } from "lucide-react";

const problems = [
  {
    icon: TrendingDown,
    stat: "28%",
    statLabel: "fee Shopee & terus naik",
    title: "Fee Shopee Sudah 28% dan Terus Naik",
    description:
      "Komisi + admin fee + service fee Shopee kini menyentuh 28% per transaksi — dan proyeksi tahun depan makin tinggi. Margin Anda terus tergerus setiap kali ada yang beli.",
  },
  {
    icon: ShieldOff,
    stat: null,
    statLabel: null,
    title: "Data Pelanggan Bukan Milik Anda",
    description:
      "Di marketplace, Anda tidak tahu siapa yang beli. Tidak ada kontak, tidak bisa remarketing, tidak bisa bangun loyalitas. Saat Shopee ganti algoritma, omset bisa langsung jatuh.",
  },
  {
    icon: RepeatIcon,
    stat: null,
    statLabel: null,
    title: "Repeat Order Susah Dipertahankan",
    description:
      "Pelanggan lama Anda beli lagi dari Shopee — tapi lewat kompetitor yang muncul di rekomendasi. Anda bayar iklan terus hanya untuk menjangkau orang yang sudah kenal brand Anda.",
  },
  {
    icon: AlertTriangle,
    stat: null,
    statLabel: null,
    title: "Ketergantungan Satu Platform",
    description:
      "Akun suspended, kebijakan berubah, atau flash sale dipaksa — bisnis Anda langsung terdampak. Tidak ada kendali, tidak ada jalan keluar.",
  },
];

const Problem = () => {
  return (
    <section className="section-padding bg-gray-50">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 fade-in">
          <span className="inline-block text-sm font-semibold text-red-500 bg-red-50 px-4 py-1.5 rounded-full mb-4">
            Kenapa Seller Shopee Rugi Diam-diam?
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Fee 28%, Pelanggan Bukan Milik Anda,{" "}
            <span className="text-red-500">dan Akan Semakin Mencekik</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Semakin besar omset Anda di Shopee, semakin besar potongan yang masuk ke kantong marketplace
          </p>
        </div>

        {/* Problem cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <div
                key={index}
                className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-red-100 hover:shadow-lg transition-all duration-300 cursor-default fade-in"
              >
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-100 transition-colors duration-300">
                  <Icon className="w-6 h-6 text-red-500" />
                </div>

                {/* Stat callout for fee card */}
                {problem.stat && (
                  <div className="mb-3">
                    <span className="text-3xl font-black text-red-500">{problem.stat}</span>
                    <span className="text-xs text-red-400 ml-1 font-medium">{problem.statLabel}</span>
                  </div>
                )}

                <h3 className="text-base font-bold text-gray-900 mb-2 leading-snug">
                  {problem.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {problem.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA + Transition */}
        <div className="text-center mt-12 fade-in">
          <p className="text-gray-600 font-medium mb-5">
            Masih mau terus bayar 28% ke Shopee?{" "}
            <span className="text-gray-900 font-semibold">Ada cara yang lebih masuk akal.</span>
          </p>
          <Button asChild className="btn-hero gap-2 cursor-pointer">
            <Link href="/sign-up">
              Lihat Solusinya
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <div className="w-px h-10 bg-gradient-to-b from-gray-300 to-transparent mx-auto mt-8" />
        </div>
      </div>
    </section>
  );
};

export default Problem;
