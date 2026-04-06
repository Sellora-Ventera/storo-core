"use client";

import { useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import Solution from "@/components/Solution";
import TemplateGallery from "@/components/TemplateGallery";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import ContactForm from "@/components/ContactForm";
import FOMOSection from "@/components/FOMOSection";
import ClosingCTA from "@/components/ClosingCTA";
import FloatingContact from "@/components/FloatingContact";
import LeadCapturePopup from "@/components/LeadCapturePopup";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import Footer from "@/components/Footer";

export default function HomePage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="font-inter">
      <Header />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <TemplateGallery />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <FOMOSection />
        <FAQ />
        <ContactForm />
        <ClosingCTA />
      </main>
      <Footer />
      <FloatingContact />
      <LeadCapturePopup />
      <ExitIntentPopup />
    </div>
  );
}
