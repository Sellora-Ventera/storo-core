import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Kebijakan privasi Storo.id. Pelajari bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda.",
};

export default function PrivacyPage() {
  return (
    <div className="font-inter min-h-screen flex flex-col bg-white">
      <Header />
      <main className="pt-24 pb-16 flex-1">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-gray">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Kebijakan Privasi
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Berlaku sejak 1 Januari 2026
          </p>

          <p>
            Storo.id (dioperasikan oleh PT Ventera Inovasi Digital) menghormati
            privasi Anda. Kebijakan ini menjelaskan informasi yang kami
            kumpulkan, bagaimana kami menggunakannya, dan pilihan yang Anda
            miliki atas data tersebut.
          </p>

          <h2>1. Data yang Kami Kumpulkan</h2>
          <ul>
            <li>
              <strong>Data akun</strong>: nama lengkap, email, nomor WhatsApp,
              alamat, nama bank dan nomor rekening (untuk pencairan dana).
            </li>
            <li>
              <strong>Data toko</strong>: nama toko, slug subdomain, paket
              berlangganan, dokumen produk dari Shopee Seller Center.
            </li>
            <li>
              <strong>Data transaksi</strong>: invoice, status pembayaran,
              riwayat order — diteruskan ke Xendit/Midtrans sebagai prosesor
              pembayaran resmi.
            </li>
            <li>
              <strong>Data otomatis</strong>: alamat IP, jenis perangkat,
              halaman yang dikunjungi (via Google Analytics).
            </li>
          </ul>

          <h2>2. Cara Kami Menggunakan Data</h2>
          <ul>
            <li>Setup dan operasionalisasi webstore Anda.</li>
            <li>Pemrosesan pembayaran dan pencairan dana.</li>
            <li>Komunikasi terkait layanan (email, WhatsApp).</li>
            <li>Peningkatan produk dan analitik internal.</li>
          </ul>

          <h2>3. Berbagi Data dengan Pihak Ketiga</h2>
          <p>
            Kami hanya membagikan data ke vendor terpercaya yang dibutuhkan
            untuk menjalankan layanan: Supabase (database & auth), Xendit dan
            Midtrans (payment gateway), Biteship (kurir), Namecheap (domain),
            Google (analitik), Hostinger (email). Kami tidak menjual data Anda.
          </p>

          <h2>4. Penyimpanan & Keamanan</h2>
          <p>
            Data disimpan terenkripsi di server Supabase dengan Row-Level
            Security. Password tidak pernah disimpan dalam bentuk plaintext —
            kami menggunakan bcrypt hashing.
          </p>

          <h2>5. Hak Anda</h2>
          <ul>
            <li>Mengakses dan memperbarui data akun lewat dashboard.</li>
            <li>Meminta penghapusan akun via support.</li>
            <li>Menolak komunikasi marketing kapan saja.</li>
          </ul>

          <h2>6. Cookies</h2>
          <p>
            Kami menggunakan cookies untuk session login dan analitik. Detail
            lengkap di <a href="/cookies">Kebijakan Cookie</a>.
          </p>

          <h2>7. Kontak</h2>
          <p>
            Pertanyaan tentang kebijakan ini? Hubungi{" "}
            <a href="mailto:support@storo.id">support@storo.id</a> atau WhatsApp{" "}
            <a
              href="https://wa.me/6285157406969"
              target="_blank"
              rel="noopener noreferrer"
            >
              +62 851-5740-6969
            </a>
            .
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
