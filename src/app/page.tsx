import type { Metadata } from "next";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import Solution from "@/components/Solution";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import ClosingCTA from "@/components/ClosingCTA";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";
import FloatingChatbot from "@/components/FloatingChatbot";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import LeadCapturePopup from "@/components/LeadCapturePopup";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import TemplateShowcase from "@/components/TemplateShowcase";
import ScrollAnimator from "@/components/ScrollAnimator";

export const metadata: Metadata = {
  title: "Webstore Sendiri Tanpa Fee 28% — Setup Beres dalam 1-3 Hari | Storo.id",
  description:
    "Pindah dari Shopee ke webstore sendiri tanpa coding. Tim Storo setup lengkap — domain custom, payment gateway (GoPay/OVO/QRIS/transfer), 11+ kurir real-time, loyalty & membership, blog SEO, multi-store dashboard. Hemat 23% per transaksi, data pelanggan 100% milik Anda. Live 1-3 hari kerja.",
  alternates: {
    canonical: "https://storo.id",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Storo.id",
  url: "https://storo.id",
  logo: "https://storo.id/og-image.png",
  description:
    "Jasa pembuatan webstore terkelola untuk seller Indonesia. Setup beres oleh tim — payment gateway, ongkir real-time, loyalty & membership, blog SEO, multi-store dashboard. Hemat 23% per transaksi vs marketplace.",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+6285157406969",
    contactType: "customer service",
    availableLanguage: "Indonesian",
  },
  sameAs: ["https://www.instagram.com/storo.id"],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Apakah data pelanggan benar-benar milik saya?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "100% milik Anda. Semua nama, nomor WA, email, dan riwayat transaksi pelanggan tersimpan di dashboard toko Anda — bisa di-export kapan saja, bisa di-broadcast promo, bisa dipakai untuk retargeting di Meta atau Google.",
      },
    },
    {
      "@type": "Question",
      name: "Berapa biaya per transaksi di Storo.id?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Cuma 5% per transaksi (1% biaya operasional Storo + 4% payment gateway). Bandingkan dengan Shopee yang sampai 28%. Untuk seller dengan omset Rp50jt/bulan, hemat sekitar Rp11,5jt/bulan.",
      },
    },
    {
      "@type": "Question",
      name: "Apakah saya bisa kelola loyalty point dan membership?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ya, semua paket sudah include fitur loyalty point dan membership tier (Bronze/Silver/Gold). Anda bisa atur sendiri rasio poin per pembelian, syarat upgrade tier, dan benefit khusus member dari dashboard.",
      },
    },
    {
      "@type": "Question",
      name: "Bisa kelola berapa toko dengan 1 akun?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Bisa banyak toko (multi-store) dari satu akun. Cocok untuk Anda yang punya beberapa brand atau jualan di kategori berbeda. Tinggal switch antar toko di dashboard, tanpa harus login-logout.",
      },
    },
    {
      "@type": "Question",
      name: "Berapa lama proses pembuatan webstore?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Paket Starter, Pro, Advance, dan Flexible: 1-3 hari kerja setelah pembayaran. Paket Custom: 5-7 hari kerja tergantung kompleksitas desain dan integrasi yang diminta.",
      },
    },
    {
      "@type": "Question",
      name: "Apakah ada biaya bulanan setelah webstore jadi?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ya, ada biaya bulanan untuk maintenance, hosting, update sistem, dan support — mulai dari Rp250.000 per bulan tergantung paket. Detail lengkap bisa dicek di halaman pricing.",
      },
    },
    {
      "@type": "Question",
      name: "Apakah bisa pakai domain sendiri seperti tokosaya.com?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Bisa. Anda bisa pakai subdomain gratis (namatoko.storo.id) atau beli domain custom .com / .co.id / .id langsung dari platform kami. Setup DNS dan SSL kami yang urus.",
      },
    },
    {
      "@type": "Question",
      name: "Apakah bisa integrasi dengan marketplace lain selain Shopee?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Saat ini fokus migrasi dari Shopee dulu. Tokopedia, Lazada, dan TikTok Shop ada di roadmap pengembangan. Anda bisa request fitur ini saat onboarding.",
      },
    },
  ],
};

export default function HomePage() {
  return (
    <div className="font-inter">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Header />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <TemplateShowcase />
        <HowItWorks />
        <Pricing />
        <FAQ />
        <ContactForm />
        <ClosingCTA />
      </main>
      <Footer />
      <FloatingChatbot />
      <WhatsAppFloat />
      <LeadCapturePopup />
      <ExitIntentPopup />
      <ScrollAnimator />
    </div>
  );
}
