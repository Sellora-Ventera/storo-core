import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description:
    "Syarat dan ketentuan layanan Storo.id. Aturan penggunaan platform, kewajiban pengguna, dan kebijakan biaya.",
};

export default function TermsPage() {
  return (
    <div className="font-inter min-h-screen flex flex-col bg-white">
      <Header />
      <main className="pt-24 pb-16 flex-1">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-gray">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Syarat & Ketentuan
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Berlaku sejak 1 Januari 2026
          </p>

          <p>
            Dengan menggunakan layanan Storo.id, Anda menyetujui syarat dan
            ketentuan berikut. Layanan dioperasikan oleh PT Ventera Inovasi
            Digital (selanjutnya disebut &ldquo;VenteraAI&rdquo;).
          </p>

          <h2>1. Layanan</h2>
          <p>
            Storo.id adalah layanan webstore terkelola — VenteraAI melakukan
            setup teknis (template, payment gateway, ongkir, domain) untuk
            seller Shopee yang ingin punya webstore profesional sendiri.
          </p>

          <h2>2. Biaya</h2>
          <ul>
            <li>
              <strong>Biaya setup</strong>: dibayar di muka sesuai paket yang
              dipilih (lihat <a href="/pricing">halaman harga</a>).
            </li>
            <li>
              <strong>Biaya bulanan</strong>: untuk maintenance, hosting, dan
              support — ditagihkan otomatis tiap bulan.
            </li>
            <li>
              <strong>Komisi transaksi</strong>: 5% per transaksi (1% biaya
              operasional VenteraAI + 4% biaya payment gateway Xendit).
            </li>
          </ul>

          <h2>3. Kewajiban Pengguna</h2>
          <ul>
            <li>
              Menyediakan data produk yang akurat dan tidak melanggar hukum.
            </li>
            <li>
              Tidak menjual barang ilegal, terlarang, atau melanggar hak
              kekayaan intelektual pihak lain.
            </li>
            <li>
              Menjaga kerahasiaan akun dan password. Aktivitas yang dilakukan
              dengan akun Anda menjadi tanggung jawab Anda.
            </li>
          </ul>

          <h2>4. Pencairan Dana</h2>
          <p>
            Dana hasil penjualan dicairkan ke rekening yang Anda daftarkan di
            dashboard. Saat ini disbursement dilakukan secara manual mingguan
            atau bulanan; akan otomatis setelah KYC Xendit untuk akun Anda
            disetujui.
          </p>

          <h2>5. Pembatalan</h2>
          <p>
            Anda dapat membatalkan langganan kapan saja dari dashboard. Toko
            akan tetap aktif sampai akhir periode billing yang sudah dibayar.
            Biaya setup tidak dikembalikan jika toko sudah live.
          </p>

          <h2>6. Garansi & Batasan Tanggung Jawab</h2>
          <p>
            Layanan disediakan &ldquo;sebagaimana adanya&rdquo;. VenteraAI
            berusaha menjaga uptime tinggi tetapi tidak menjamin operasional
            100%. Kerugian akibat downtime, kehilangan data, atau force majeure
            di luar tanggung jawab kami.
          </p>

          <h2>7. Perubahan Syarat</h2>
          <p>
            Kami dapat memperbarui syarat ini dari waktu ke waktu. Perubahan
            material akan dikomunikasikan via email minimal 14 hari sebelum
            berlaku.
          </p>

          <h2>8. Hukum yang Berlaku</h2>
          <p>
            Syarat ini tunduk pada hukum Republik Indonesia. Sengketa
            diselesaikan melalui pengadilan negeri Jakarta Selatan.
          </p>

          <h2>9. Kontak</h2>
          <p>
            Pertanyaan? Hubungi{" "}
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
