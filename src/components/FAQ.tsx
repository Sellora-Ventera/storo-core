"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "Apakah produk saya aman?",
      answer: "Ya, file Excel Anda hanya digunakan untuk setup webstore milik Anda sendiri. Kami tidak menyimpan atau menggunakan data produk untuk keperluan lain."
    },
    {
      question: "Apakah bisa custom desain?",
      answer: "Bisa! Sesuai paket yang dipilih. Paket Pro sudah include template custom, sedangkan Enterprise bisa full custom sesuai brand Anda."
    },
    {
      question: "Apakah perlu login dashboard rumit?",
      answer: "Tidak perlu! Order dari webstore dikelola melalui WooCommerce dashboard yang user-friendly untuk update stok, harga, dan monitoring order."
    },
    {
      question: "Berapa lama proses pembuatan webstore?",
      answer: "Untuk paket Starter dan Pro: 1-3 hari kerja. Untuk Enterprise: 5-7 hari kerja tergantung kompleksitas custom yang diminta."
    },
    {
      question: "Apakah ada biaya bulanan setelah webstore jadi?",
      answer: "Hosting dan domain sudah include untuk tahun pertama. Setelah itu ada biaya maintenance minimal Rp200rb/bulan untuk hosting dan update."
    },
    {
      question: "Bisa integrasi dengan marketplace lain selain Shopee?",
      answer: "Saat ini fokus ke Shopee dulu. Tapi ke depan kami akan support Tokopedia dan Lazada juga. Bisa request fitur ini untuk development selanjutnya."
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
            Jawaban untuk pertanyaan umum tentang layanan Storo.id
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
            onClick={() => window.open('https://wa.me/6285148416700?text=Halo%20Storo.id,%20saya%20ada%20pertanyaan%20tentang%20webstore', '_blank')}
          >
            Tanya Langsung via WhatsApp
          </button>
        </div>
      </div>
    </section>
  );
};

export default FAQ;