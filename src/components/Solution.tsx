import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  CreditCard,
  Truck,
  Globe,
  Crown,
  Search,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    color: "primary",
    title: "Setup Beres oleh Tim Kami",
    description:
      "Anda tidak perlu sentuh coding, hosting, atau template builder. Tim Storo yang setup semuanya — produk, kategori, banner, foto, deskripsi, payment, ongkir, sampai domain. Dalam 1–3 hari kerja toko Anda live.",
  },
  {
    icon: CreditCard,
    color: "secondary",
    title: "Bayar Apapun, Dana Langsung Cair",
    description:
      "Xendit + Midtrans sudah terhubung. Terima transfer bank, e-wallet (GoPay, OVO, Dana, ShopeePay), QRIS, kartu kredit, dan paylater. Cuma 5% per transaksi (vs 28% Shopee) — dana masuk rekening Anda.",
  },
  {
    icon: Truck,
    color: "primary",
    title: "Ongkir Real-time 11+ Kurir",
    description:
      "JNE, J&T, SiCepat, AnterAja, Pos, Ninja, dan lainnya via Biteship. Pelanggan pilih kurir sendiri di checkout. Bisa atur gratis ongkir per area (Jabodetabek, Jawa, atau seluruh Indonesia) untuk bikin pelanggan balik beli.",
  },
  {
    icon: Crown,
    color: "secondary",
    title: "Loyalty & Membership Bawaan",
    description:
      "Fitur poin loyalty dan tier membership (Bronze/Silver/Gold) sudah terpasang dari hari pertama. Pelanggan beli → dapat poin → tukar diskon → balik beli lagi. Repeat order auto-naik tanpa biaya iklan tambahan.",
  },
  {
    icon: Search,
    color: "primary",
    title: "Blog SEO + Promo Codes",
    description:
      "CMS blog untuk artikel produk & tutorial — dapat traffic Google gratis. Plus sistem kode promo, banner homepage, dan ulasan pelanggan terverifikasi. Konversi naik, biaya akuisisi turun.",
  },
  {
    icon: Globe,
    color: "secondary",
    title: "Domain Sendiri & Multi-Toko",
    description:
      "Pakai subdomain gratis (namatoko.storo.id) atau domain .com/.co.id/.id custom. Punya beberapa brand? Kelola semua toko dari satu akun, satu dashboard — tinggal switch antar toko.",
  },
];

const Solution = () => {
  return (
    <section className="section-padding bg-white">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 fade-in">
          <span className="inline-block text-sm font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4">
            Solusi Storo.id
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Webstore Lengkap Siap Jualan,{" "}
            <span className="text-primary">Bukan Cuma Template Kosong</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Semua fitur yang Anda butuhkan untuk pindah dari marketplace ke toko sendiri —
            sudah terpasang, sudah terhubung, dan dikelola tim kami.
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
              Hemat 23% Per Transaksi, Repeat Order Naik Tanpa Iklan
            </h3>
            <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto mb-6">
              Fee Storo cuma <strong>5%</strong> (vs 28% Shopee) — itu saja sudah hemat
              puluhan juta per tahun untuk seller dengan omset Rp500jt/tahun. Tambah
              loyalty point, membership, dan promo gratis ongkir, pelanggan lama balik
              beli sendiri. <strong>Margin terjaga, brand jadi milik Anda.</strong>
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
