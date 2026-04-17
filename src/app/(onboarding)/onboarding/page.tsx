import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

export const metadata: Metadata = {
  title: "Pesan Toko — Storo.id",
  description:
    "Pesan webstore Anda sekarang. Isi data, pilih paket, dan bayar — toko Anda siap dalam 3-5 hari kerja.",
};

export default function OnboardingPage() {
  return (
    <div className="font-inter min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-white to-secondary/5">
      <Header />
      <main className="pt-24 pb-16 flex-1">
        <OnboardingWizard />
      </main>
      <Footer />
    </div>
  );
}
