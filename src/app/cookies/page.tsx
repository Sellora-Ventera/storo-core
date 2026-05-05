import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Kebijakan Cookie",
  description:
    "Kebijakan penggunaan cookie di Storo.id. Pelajari jenis cookie yang kami gunakan dan cara mengelolanya.",
};

export default function CookiesPage() {
  return (
    <div className="font-inter min-h-screen flex flex-col bg-white">
      <Header />
      <main className="pt-24 pb-16 flex-1">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-gray">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Kebijakan Cookie
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Berlaku sejak 1 Januari 2026
          </p>

          <p>
            Storo.id menggunakan cookie untuk menjalankan fitur penting dan
            meningkatkan pengalaman Anda. Halaman ini menjelaskan jenis cookie
            yang kami pakai dan cara mengelolanya.
          </p>

          <h2>1. Jenis Cookie</h2>
          <ul>
            <li>
              <strong>Cookie esensial</strong>: dibutuhkan untuk login, session,
              dan keamanan. Tidak bisa dimatikan tanpa membuat layanan tidak
              berfungsi.
            </li>
            <li>
              <strong>Cookie analitik</strong>: Google Analytics — membantu
              memahami pola pemakaian agar kami dapat meningkatkan produk.
            </li>
            <li>
              <strong>Cookie preferensi</strong>: menyimpan pilihan kecil
              seperti referral code dari sharelink.id selama sesi.
            </li>
          </ul>

          <h2>2. Pengelolaan Cookie</h2>
          <p>
            Sebagian besar browser membolehkan Anda menolak cookie atau
            menghapusnya. Untuk panduan, lihat dokumentasi browser Anda
            (Chrome, Firefox, Safari, Edge). Perlu dicatat: menonaktifkan
            cookie esensial akan membuat sebagian fungsi (login, dashboard)
            tidak bekerja.
          </p>

          <h2>3. Cookie Pihak Ketiga</h2>
          <p>
            Kami menggunakan cookie pihak ketiga dari Google Analytics dan
            Supabase Auth. Kebijakan privasi mereka berlaku terpisah:
          </p>
          <ul>
            <li>
              <a
                href="https://policies.google.com/technologies/cookies"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google
              </a>
            </li>
            <li>
              <a
                href="https://supabase.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Supabase
              </a>
            </li>
          </ul>

          <h2>4. Kontak</h2>
          <p>
            Pertanyaan? Hubungi{" "}
            <a href="mailto:support@storo.id">support@storo.id</a>.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
