import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Rocket,
  CreditCard,
  Truck,
  Globe,
  HelpCircle,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Dokumentasi",
  description:
    "Pusat dokumentasi Storo.id. Panduan onboarding, payment gateway, ongkir, domain, dan FAQ untuk seller webstore.",
};

const sections = [
  {
    icon: Rocket,
    title: "Mulai Cepat",
    description:
      "Cara memesan webstore dari awal sampai live: kirim file Excel Shopee, pilih paket, bayar, dan tunggu setup oleh tim.",
    href: "/onboarding",
    cta: "Mulai onboarding",
  },
  {
    icon: CreditCard,
    title: "Pembayaran",
    description:
      "Konfigurasi payment gateway Xendit & Midtrans, metode pembayaran yang didukung, dan alur pencairan dana.",
    href: "/dashboard/billing",
    cta: "Lihat tagihan",
  },
  {
    icon: Truck,
    title: "Pengiriman",
    description:
      "Integrasi 11+ kurir lewat Biteship, aturan gratis ongkir per area, dan estimasi tarif real-time saat checkout.",
    href: "/pricing",
    cta: "Lihat paket",
  },
  {
    icon: Globe,
    title: "Domain",
    description:
      "Subdomain gratis (namatoko.storo.id), beli domain via Namecheap, atau pakai DNS sendiri.",
    href: "/dashboard/domains",
    cta: "Atur domain",
  },
  {
    icon: HelpCircle,
    title: "FAQ",
    description:
      "Pertanyaan paling sering diajukan: keamanan data, custom desain, lama setup, biaya bulanan, dan integrasi marketplace lain.",
    href: "/#faq",
    cta: "Baca FAQ",
  },
  {
    icon: BookOpen,
    title: "Blog",
    description:
      "Artikel dan tutorial tentang e-commerce, strategi webstore, dan tips bisnis untuk seller Indonesia.",
    href: "/blog",
    cta: "Baca artikel",
  },
];

export default function DocsPage() {
  return (
    <div className="font-inter min-h-screen flex flex-col bg-white">
      <Header />
      <main className="pt-24 pb-16 flex-1">
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Dokumentasi Storo.id
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Panduan singkat untuk semua fitur platform. Tidak menemukan yang
              dicari?{" "}
              <a
                href="https://wa.me/6285148416700"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Tanya tim kami
              </a>
              .
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sections.map(({ icon: Icon, title, description, href, cta }) => (
              <Link
                key={title}
                href={href}
                className="group bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex flex-col"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-base font-semibold text-gray-900 mb-2">
                  {title}
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-4">
                  {description}
                </p>
                <span className="text-sm font-medium text-primary group-hover:underline">
                  {cta} →
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
