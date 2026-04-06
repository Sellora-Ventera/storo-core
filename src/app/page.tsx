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
import ScrollAnimator from "@/components/ScrollAnimator";

export const metadata: Metadata = {
  title: "Storo.id — Dari Shopee ke Webstore Sendiri, Tanpa Ribet",
  description:
    "Storo.id adalah jasa pembuatan website toko online khusus seller Shopee. Import produk otomatis dari Excel, payment gateway, ongkir real-time. Setup dalam 1-3 hari kerja.",
};

export default function HomePage() {
  return (
    <div className="font-inter">
      <Header />
      <main>
        <Hero />
        <Problem />
        <Solution />
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
