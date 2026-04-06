"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Star, Quote, ArrowRight } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Rizky Firmansyah",
      role: "Owner",
      store: "RizkyFashion Store",
      storeUrl: "rizkyfashion.storo.id",
      rating: 5,
      text: "Awalnya skeptis, tapi ternyata prosesnya cepat banget. Kirim file Excel Shopee hari Senin, Kamis toko sudah live! Sekarang order dari website sendiri tanpa bayar fee Shopee.",
      products: "450 produk",
      category: "Fashion",
    },
    {
      name: "Siti Nurhaliza",
      role: "Pemilik Usaha",
      store: "BeautySiti Official",
      storeUrl: "beautysiti.storo.id",
      rating: 5,
      text: "Tim Storo sangat responsif dan profesional. Setup webstore lengkap dengan payment gateway dan kurir otomatis. Pelanggan saya sekarang bisa bayar pakai berbagai metode.",
      products: "280 produk",
      category: "Kecantikan",
    },
    {
      name: "Budi Santoso",
      role: "Seller Aktif",
      store: "ElektronikBudi",
      storeUrl: "elektronikbudi.storo.id",
      rating: 5,
      text: "Sudah 3 bulan pakai Storo, revenue dari website sendiri sekarang 30% dari total penjualan. Fee Shopee makin besar jadi senang punya channel penjualan sendiri.",
      products: "120 produk",
      category: "Elektronik",
    },
    {
      name: "Dewi Rahayu",
      role: "Owner",
      store: "DapurDewi",
      storeUrl: "dapurdewi.storo.id",
      rating: 5,
      text: "Dashboard toko sangat mudah digunakan. Saya yang tidak terlalu paham teknis pun bisa kelola produk, lihat order, dan update foto sendiri. Sangat direkomendasikan!",
      products: "85 produk",
      category: "Makanan & Minuman",
    },
    {
      name: "Ahmad Fauzi",
      role: "Pebisnis Online",
      store: "TokoSportFauzi",
      storeUrl: "tokosportfauzi.storo.id",
      rating: 5,
      text: "Migrasi 800+ produk dari Shopee selesai dalam 2 hari kerja. Tim Storo handle semua import, domain, dan koneksi payment. Tinggal promosi saja!",
      products: "820 produk",
      category: "Olahraga",
    },
    {
      name: "Linda Kusuma",
      role: "Reseller Aktif",
      store: "LindaHomeDeco",
      storeUrl: "lindahomedeco.storo.id",
      rating: 5,
      text: "Punya webstore sendiri ternyata tidak semahal yang saya bayangkan. Dengan paket Pro sudah dapat domain gratis dan template yang terlihat profesional banget.",
      products: "195 produk",
      category: "Dekorasi Rumah",
    },
  ];

  return (
    <section className="section-padding bg-gray-50">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 fade-in">
          <span className="inline-block text-sm font-semibold text-secondary bg-secondary/10 px-4 py-1.5 rounded-full mb-4">
            Testimoni Klien
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Dipercaya <span className="text-primary">500+ Seller</span> Indonesia
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Seller Shopee yang sudah punya webstore sendiri bersama Storo.id
          </p>
        </div>

        {/* Testimonial grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((t, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:border-primary/10 transition-all duration-300 cursor-default flex flex-col fade-in"
            >
              {/* Quote icon */}
              <Quote className="w-8 h-8 text-primary/20 mb-3 flex-shrink-0" />

              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 text-yellow-400 fill-yellow-400"
                  />
                ))}
              </div>

              {/* Text */}
              <p className="text-gray-700 text-sm leading-relaxed mb-5 flex-1 italic">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Divider */}
              <div className="h-px bg-gray-100 mb-4" />

              {/* Profile */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role} · {t.store}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block text-xs bg-primary/8 text-primary px-2.5 py-1 rounded-full font-medium">
                    {t.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom stats strip */}
        <div className="mt-14 bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 max-w-4xl mx-auto fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white mb-8">
            {[
              { value: "500+", label: "Seller Sudah Pindah" },
              { value: "4.9/5", label: "Rating Rata-rata" },
              { value: "50rb+", label: "Produk Sudah Di-setup" },
              { value: "1–3 hari", label: "Toko Siap Live" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-2xl md:text-3xl font-black mb-1">{value}</div>
                <div className="text-sm opacity-80">{label}</div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-white/80 text-sm mb-4">Giliran kamu sekarang.</p>
            <Button
              asChild
              className="bg-white text-primary hover:bg-gray-50 font-bold px-8 h-11 rounded-xl cursor-pointer gap-2"
            >
              <Link href="/sign-up">
                Buka Toko Online Sendiri
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
