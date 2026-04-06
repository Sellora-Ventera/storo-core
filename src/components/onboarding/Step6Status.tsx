"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Settings, MessageCircle } from "lucide-react";
import type { WizardState } from "./OnboardingWizard";

interface Step6Props {
  state: WizardState;
  goNext: () => void;
  goBack: () => void;
}

export default function Step6Status({ goNext, goBack }: Step6Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Hampir Selesai! 🎉</h2>
        <p className="text-sm text-gray-500 max-w-md">
          Tim Storo akan mengurus setup toko Anda setelah submission diterima.
        </p>
        <div className="mt-3 px-4 py-2 bg-primary/5 border border-primary/20 rounded-full text-sm font-medium text-primary">
          Estimasi 1–3 hari kerja
        </div>
      </div>

      {/* Timeline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="font-semibold text-gray-900 text-sm">Review Data</h3>
          <p className="text-xs text-gray-500 mt-1">1 hari kerja</p>
        </div>

        <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mb-3">
            <Settings className="w-5 h-5 text-secondary" />
          </div>
          <h3 className="font-semibold text-gray-900 text-sm">Setup Toko</h3>
          <p className="text-xs text-gray-500 mt-1">1-2 hari kerja</p>
        </div>

        <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="font-semibold text-gray-900 text-sm">Toko Live</h3>
          <p className="text-xs text-gray-500 mt-1">Notifikasi otomatis</p>
        </div>
      </div>

      {/* WhatsApp Contact */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <a
          href="https://wa.me/6285157406969"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-full text-sm font-medium hover:bg-green-100 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Butuh bantuan? Chat kami
        </a>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={goBack}>
          ← Kembali
        </Button>
        <Button
          onClick={goNext}
          className="bg-primary text-white hover:bg-primary/90 px-8"
        >
          Lanjut ke Review →
        </Button>
      </div>
    </div>
  );
}
