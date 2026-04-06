"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

const faqs = [
  {
    question: "Apakah saya perlu bisa coding?",
    answer:
      "Tidak sama sekali. VenteraAI handle semua setup teknis — dari import produk, koneksi payment gateway, hingga deploy ke server. Anda cukup isi formulir onboarding dan tim kami kerjakan sisanya.",
  },
  {
    question: "Berapa lama proses pembuatan webstore?",
    answer:
      "Setelah data onboarding lengkap: 1–3 hari kerja untuk paket Starter dan Business, 5–7 hari kerja untuk Enterprise dengan custom design. Anda akan dihubungi via WhatsApp ketika toko sudah live.",
  },
  {
    question: "Bagaimana produk saya bisa masuk ke webstore?",
    answer:
      "Tim Storo yang menyiapkan semua produk Anda — mulai dari nama, foto, deskripsi, varian, harga, hingga stok. Anda tidak perlu melakukan apapun. Cukup hubungi tim kami dan kami yang urus semuanya sampai toko live.",
  },
  {
    question: "Apa itu biaya 5% per transaksi, dan kenapa lebih murah dari Shopee?",
    answer:
      "Setiap penjualan dikenakan 5% total: 1% biaya operasional Storo.id + 4% biaya payment gateway (Xendit/Midtrans). Bandingkan dengan Shopee yang kini menyentuh 28% per transaksi — dan proyeksinya terus naik. Dana penjualan didisbursement ke rekening bank Anda secara berkala.",
  },
  {
    question: "Bagaimana cara meningkatkan repeat order tanpa iklan?",
    answer:
      "Di webstore sendiri, pelanggan sudah kenal brand Anda. Anda bisa buat promo gratis ongkir untuk area tertentu — misalnya khusus Jabodetabek, Pulau Jawa, atau subsidi ongkir ke seluruh Indonesia. Pelanggan lama yang sudah percaya akan lebih sering kembali beli, tanpa Anda perlu bayar iklan.",
  },
  {
    question: "Bagaimana sistem domain bekerja?",
    answer:
      "Ada 3 pilihan: (1) Subdomain gratis — namatoko.storo.id, sudah include di semua paket. (2) Beli custom domain (.com, .co.id, .id, .store) langsung dari platform, harga mulai Rp 55.000/tahun, DNS dikonfigurasi otomatis. (3) Pakai domain yang sudah Anda miliki, tim kami bantu setup DNS-nya.",
  },
];

const FAQ = () => {
  return (
    <section id="faq" className="section-padding bg-white">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 fade-in">
          <span className="inline-block text-sm font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Pertanyaan yang Sering Ditanyakan
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Jawaban untuk pertanyaan umum tentang layanan Storo.id
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-gray-200 rounded-xl px-6 data-[state=open]:border-primary/30 transition-colors duration-200"
              >
                <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-primary py-4 cursor-pointer">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center mt-12 fade-in">
          <p className="text-gray-600 mb-4">Masih ada pertanyaan lain?</p>
          <Button
            variant="outline"
            className="border-2 border-primary text-primary hover:bg-primary hover:text-white gap-2 cursor-pointer"
            onClick={() =>
              window.open(
                "https://wa.me/6285148416700?text=Halo%20Storo.id,%20saya%20ada%20pertanyaan%20tentang%20webstore",
                "_blank"
              )
            }
          >
            <MessageCircle className="w-4 h-4" />
            Tanya Langsung via WhatsApp
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
