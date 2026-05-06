"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "Apakah data pelanggan benar-benar milik saya?",
      answer: "100% milik Anda. Semua nama, nomor WA, email, dan riwayat transaksi pelanggan tersimpan di dashboard toko Anda — bisa di-export kapan saja, bisa di-broadcast promo, bisa dipakai untuk retargeting di Meta/Google. Beda dengan Shopee yang menyembunyikan kontak pelanggan."
    },
    {
      question: "Berapa biaya sebenarnya per transaksi?",
      answer: "Cuma 5% per transaksi (1% biaya operasional Storo + 4% payment gateway). Bandingkan dengan Shopee yang sampai 28% per transaksi. Untuk seller dengan omset Rp50jt/bulan, Anda bisa hemat sekitar Rp11,5jt/bulan."
    },
    {
      question: "Apakah produk saya aman saat setup?",
      answer: "Aman. File Excel atau data produk Anda hanya kami gunakan untuk setup webstore milik Anda sendiri. Tidak disimpan untuk keperluan lain, tidak dibagikan ke pihak ketiga."
    },
    {
      question: "Apakah saya bisa kelola loyalty point dan membership?",
      answer: "Ya, semua paket sudah include fitur loyalty point dan membership tier (Bronze/Silver/Gold). Anda bisa atur sendiri rasio poin per pembelian, syarat upgrade tier, dan benefit khusus member dari dashboard."
    },
    {
      question: "Bisa kelola berapa toko dengan 1 akun?",
      answer: "Bisa banyak toko (multi-store) dari satu akun. Cocok untuk Anda yang punya beberapa brand atau jualan di kategori berbeda. Tinggal switch antar toko di dashboard, tanpa harus login-logout."
    },
    {
      question: "Apakah bisa pakai domain sendiri seperti tokosaya.com?",
      answer: "Bisa. Anda bisa pakai subdomain gratis (namatoko.storo.id) atau beli domain custom .com / .co.id / .id langsung dari platform kami. Setup DNS dan SSL kami yang urus."
    },
    {
      question: "Berapa lama proses pembuatan webstore?",
      answer: "Paket Starter, Pro, Advance & Flexible: 1–3 hari kerja setelah pembayaran. Paket Custom: 5–7 hari kerja tergantung kompleksitas desain dan integrasi yang diminta."
    },
    {
      question: "Apakah ada biaya bulanan setelah webstore jadi?",
      answer: "Ya, ada biaya bulanan untuk maintenance, hosting, update sistem, dan support — mulai dari Rp250rb/bulan tergantung paket. Detail lengkap bisa dicek di halaman pricing."
    },
    {
      question: "Bisa integrasi dengan marketplace lain selain Shopee?",
      answer: "Saat ini fokus migrasi dari Shopee dulu. Tokopedia, Lazada, dan TikTok Shop ada di roadmap pengembangan. Anda bisa request fitur ini saat onboarding."
    }
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Pertanyaan yang Sering Ditanyakan
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Jawaban untuk hal-hal yang biasanya jadi pertimbangan sebelum pindah dari marketplace ke webstore sendiri.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-gray-200 rounded-lg px-6"
              >
                <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed pt-2">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Masih ada pertanyaan lain?</p>
          <button 
            className="btn-secondary"
            onClick={() => window.open('https://wa.me/6285157406969?text=Halo%20Storo.id,%20saya%20ada%20pertanyaan%20tentang%20webstore', '_blank')}
          >
            Tanya Langsung via WhatsApp
          </button>
        </div>
      </div>
    </section>
  );
};

export default FAQ;