import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MessageCircle, BookOpen, ChevronRight } from "lucide-react";

const FAQ_ITEMS = [
  {
    id: "faq-1",
    question: "Berapa lama proses setup toko?",
    answer:
      "Proses setup biasanya memakan waktu 1-3 hari kerja setelah semua data diterima.",
  },
  {
    id: "faq-2",
    question: "Bagaimana cara mengekspor produk dari Shopee?",
    answer:
      "Login ke Seller Center Shopee → Produk → Ekspor → Pilih semua produk → Download Excel. Kirimkan file tersebut ke tim kami melalui WhatsApp.",
  },
  {
    id: "faq-3",
    question: "Apakah saya bisa mengubah template setelah toko live?",
    answer:
      "Perubahan template memerlukan proses migrasi oleh tim kami. Hubungi kami untuk konsultasi.",
  },
  {
    id: "faq-4",
    question: "Metode pembayaran apa yang didukung?",
    answer:
      "Toko Anda akan mendukung transfer bank, QRIS, dan kartu kredit melalui Xendit payment gateway.",
  },
  {
    id: "faq-5",
    question: "Bagaimana sistem pengiriman bekerja?",
    answer:
      "Ongkos kirim dihitung otomatis menggunakan Biteship dengan 11+ pilihan kurir termasuk JNE, J&T, SiCepat, dan Pos Indonesia.",
  },
  {
    id: "faq-6",
    question: "Apakah bisa menggunakan domain sendiri?",
    answer:
      "Ya! Anda bisa menggunakan subdomain gratis (namatoko.storo.id), membeli domain baru, atau mengarahkan domain yang sudah dimiliki ke toko Anda.",
  },
];

const SETUP_STEPS = [
  {
    step: "1",
    title: "Daftarkan Toko",
    description: "Isi form onboarding dengan data toko dan produk dari Shopee Anda.",
  },
  {
    step: "2",
    title: "Tim Kami Memproses",
    description: "Kami akan setup toko Anda dalam 1-3 hari kerja setelah data lengkap.",
  },
  {
    step: "3",
    title: "Toko Anda Live!",
    description: "Terima notifikasi ketika toko Anda sudah aktif dan siap menerima pesanan.",
  },
];

export default function HelpPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bantuan</h1>
        <p className="text-gray-500 mt-1">Temukan jawaban atas pertanyaan Anda.</p>
      </div>

      {/* Quick guide */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4.5 h-4.5 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Cara Setup Toko
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {SETUP_STEPS.map((step, idx) => (
            <div key={step.step} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {step.step}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">{step.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
              </div>
              {idx < SETUP_STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-300 mt-1.5 flex-shrink-0 hidden sm:block" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">
          Pertanyaan yang Sering Ditanyakan
        </h2>
        <Accordion type="single" collapsible className="space-y-2">
          {FAQ_ITEMS.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="border border-gray-100 rounded-xl px-4 data-[state=open]:border-primary/20 data-[state=open]:bg-primary/[0.02] transition-colors"
            >
              <AccordionTrigger className="text-sm font-semibold text-gray-900 hover:no-underline py-4 cursor-pointer">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-600 pb-4">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* WhatsApp contact card */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-green-900 text-base mb-1">
              Ada pertanyaan lain? Chat langsung dengan tim kami
            </h3>
            <p className="text-green-700 text-sm mb-4">
              Tim support kami siap membantu Anda setiap hari kerja pukul 08.00 – 17.00 WIB.
              Hubungi kami di{" "}
              <span className="font-semibold">+6285148416700</span>
            </p>
            <a
              href="https://wa.me/6285148416700"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Chat via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
