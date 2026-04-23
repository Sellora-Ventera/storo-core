import Link from "next/link";
import Image from "next/image";
import { Compass, ArrowLeft, Store, Tag, LayoutGrid, MessageCircle } from "lucide-react";
import storoLogo from "@/assets/storo-logo.png";

const QUICK_LINKS = [
  { href: "/", label: "Beranda", icon: ArrowLeft },
  { href: "/pricing", label: "Pricing", icon: Tag },
  { href: "/templates", label: "Template", icon: LayoutGrid },
  { href: "/onboarding", label: "Pesan Toko", icon: Store },
];

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-secondary/5 px-6 py-12 relative overflow-hidden">
      {/* Decorative blurs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-2xl text-center">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center justify-center mb-8 cursor-pointer">
          <Image
            src={storoLogo}
            alt="Storo.id"
            className="h-10 w-auto object-contain"
            height={40}
            priority
          />
        </Link>

        {/* 404 hero with compass as "0" */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-2">
          <span className="text-[120px] sm:text-[180px] font-bold text-primary leading-none select-none">
            4
          </span>
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl" />
            <div className="relative w-[100px] h-[100px] sm:w-[150px] sm:h-[150px] bg-white border-4 border-primary rounded-full flex items-center justify-center shadow-xl">
              <Compass className="w-14 h-14 sm:w-20 sm:h-20 text-primary animate-[spin_8s_linear_infinite]" />
            </div>
          </div>
          <span className="text-[120px] sm:text-[180px] font-bold text-primary leading-none select-none">
            4
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Waduh, halamannya tersesat
        </h1>
        <p className="text-gray-500 text-base max-w-md mx-auto mb-8">
          Sepertinya kamu salah jalan. Halaman yang dituju mungkin sudah dipindah, dihapus, atau belum pernah ada.
        </p>

        {/* Primary CTAs */}
        <div className="flex items-center justify-center gap-3 flex-wrap mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 font-semibold px-6 py-3 rounded-xl border border-gray-200 transition-all duration-200 cursor-pointer"
          >
            <Store className="w-4 h-4" />
            Pesan Toko
          </Link>
        </div>

        {/* Quick links grid */}
        <div className="bg-white/60 backdrop-blur-sm border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Atau coba halaman berikut
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer"
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Help */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
          <span>Butuh bantuan?</span>
          <a
            href="https://wa.me/6285157406969"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 font-medium cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            Chat via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
