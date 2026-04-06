import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-6">
        <h1 className="text-8xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Halaman yang kamu cari tidak tersedia. Mungkin sudah dipindah atau
          dihapus.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
