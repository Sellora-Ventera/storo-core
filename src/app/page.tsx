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
import FloatingChatbot from "@/components/FloatingChatbot";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import LeadCapturePopup from "@/components/LeadCapturePopup";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import TemplateShowcase from "@/components/TemplateShowcase";
import ScrollAnimator from "@/components/ScrollAnimator";

export const metadata: Metadata = {
  title: "Buat Webstore dari Shopee — Tanpa Ribet | Storo.id",
  description:
    "Punya toko online sendiri dari Shopee tanpa coding. Setup lengkap oleh tim kami — domain custom, pembayaran (GoPay, OVO, transfer bank), 11+ kurir real-time. Jasa pembuatan webstore terkelola, siap transaksi dalam 1-3 hari kerja.",
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
    "Jasa pembuatan webstore terkelola untuk seller Shopee Indonesia. Domain custom, payment gateway, ongkir real-time.",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+6285148416700",
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
      name: "Apakah produk saya aman jika dikirim ke Storo.id?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ya, file Excel Anda hanya digunakan untuk setup webstore milik Anda sendiri. Kami tidak menyimpan atau menggunakan data produk untuk keperluan lain.",
      },
    },
    {
      "@type": "Question",
      name: "Apakah bisa custom desain webstore?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Bisa! Sesuai paket yang dipilih. Paket Pro sudah include template custom, sedangkan Enterprise bisa full custom sesuai brand Anda.",
      },
    },
    {
      "@type": "Question",
      name: "Berapa lama proses pembuatan webstore dari Shopee?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Untuk paket Starter dan Pro: 1-3 hari kerja. Untuk Enterprise: 5-7 hari kerja tergantung kompleksitas custom yang diminta.",
      },
    },
    {
      "@type": "Question",
      name: "Berapa biaya membuat webstore sendiri dari Shopee?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Storo.id menawarkan beberapa paket mulai dari Starter hingga Enterprise. Hosting dan domain sudah include untuk tahun pertama. Setelah itu ada biaya maintenance minimal Rp200.000/bulan.",
      },
    },
    {
      "@type": "Question",
      name: "Apakah ada biaya bulanan setelah webstore jadi?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hosting dan domain sudah include untuk tahun pertama. Setelah itu ada biaya maintenance minimal Rp200rb/bulan untuk hosting dan update.",
      },
    },
    {
      "@type": "Question",
      name: "Apakah bisa integrasi dengan marketplace lain selain Shopee?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Saat ini fokus ke Shopee dulu. Ke depan akan support Tokopedia dan Lazada juga. Bisa request fitur ini untuk development selanjutnya.",
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
      <FloatingChatbot />
      <WhatsAppFloat />
      <LeadCapturePopup />
      <ExitIntentPopup />
      <ScrollAnimator />
    </div>
  );
}
