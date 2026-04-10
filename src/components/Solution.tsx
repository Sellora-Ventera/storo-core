import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  CreditCard,
  Truck,
  Globe,
  LayoutDashboard,
  Gift,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    color: "primary",
    title: "Toko Jadi, Anda Terima Beres",
    description:
      "Tim Storo yang setup semuanya — ribuan produk, foto, deskripsi, payment gateway, ongkir, hingga domain. Anda tidak perlu sentuh apapun. Dalam 1–3 hari kerja, toko online Anda langsung live.",
  },
  {
    icon: CreditCard,
    color: "secondary",
    title: "Payment Gateway Siap Pakai",
    description:
      "Xendit & Midtrans sudah terhubung. Terima transfer bank, e-wallet (GoPay, OVO, Dana), QRIS, dan kartu kredit. Dana masuk langsung ke rekening Anda.",
  },
  {
    icon: Truck,
    color: "primary",
    title: "Ongkir Otomatis 11+ Kurir",
    description:
      "JNE, J&T, SiCepat, AnterAja, Pos Indonesia, dan kurir lainnya via Biteship. Harga ongkir real-time langsung di checkout — pelanggan pilih sendiri.",
  },
  {
    icon: Gift,
    color: "secondary",
    title: "Promo Gratis Ongkir & Subsidi Ongkir",
    description:
      "Buat promo gratis ongkir untuk area tertentu — misalnya khusus Jabodetabek, Pulau Jawa, atau subsidi ongkir ke seluruh Indonesia. Tanpa biaya iklan, repeat order naik karena pelanggan makin sering balik ke toko Anda.",
  },
  {
    icon: LayoutDashboard,
    color: "primary",
    title: "Dashboard Kelola Toko Sendiri",
    description:
      "Setelah toko live, Anda bisa pantau pesanan, update stok, tambah produk baru, dan kelola konten toko dari dashboard yang sederhana — kapanpun, dari HP sekalipun.",
  },
  {
    icon: Globe,
    color: "secondary",
    title: "Domain & Brand Sendiri",
    description:
      "Gunakan subdomain gratis (namatoko.storo.id) atau beli domain .com/.co.id/.id langsung dari platform. Pelanggan kenal brand Anda — bukan nama marketplace.",
  },
];

const Solution = () => {
  return (
    <section className="section-padding bg-white">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 fade-in">
          <span className="inline-block text-sm font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4">
            Kenapa Storo.id?
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Toko Online Lengkap,{" "}
            <span className="text-primary">Anda Terima Beres</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Bukan sekadar template kosong — Tim Storo setup semua dari nol sampai toko siap transaksi
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isPrimary = feature.color === "primary";
            return (
              <div
                key={index}
                className="group bg-white rounded-2xl p-7 border border-gray-100 hover:shadow-xl hover:border-transparent transition-all duration-300 cursor-default fade-in"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors duration-300 ${
                    isPrimary
                      ? "bg-primary/10 group-hover:bg-primary/20"
                      : "bg-secondary/10 group-hover:bg-secondary/20"
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      isPrimary ? "text-primary" : "text-secondary"
                    }`}
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 leading-snug">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Retention callout */}
        <div className="mt-14 bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10 rounded-2xl p-8 max-w-4xl mx-auto fade-in">
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Omset Naik Tanpa Biaya Iklan
            </h3>
            <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto mb-6">
              Di webstore sendiri, pelanggan lama <strong>sudah kenal brand kamu</strong>.
              Kasih promo gratis ongkir atau subsidi ongkir — mereka balik beli lagi
              tanpa kamu perlu bayar iklan. Retensi naik, omset naik, margin terjaga.
            </p>
            <Button asChild className="btn-hero gap-2 cursor-pointer">
              <Link href="/onboarding">
                Saya Mau Toko Sendiri
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Solution;
