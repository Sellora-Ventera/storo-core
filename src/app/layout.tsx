import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://storo.id"),
  title: {
    default: "Buat Webstore dari Shopee — Tanpa Ribet | Storo.id",
    template: "%s | Storo.id",
  },
  description:
    "Punya toko online sendiri dari Shopee tanpa coding. Setup lengkap oleh tim kami — domain custom, pembayaran (GoPay, OVO, transfer bank), 11+ kurir real-time. Jasa pembuatan webstore terkelola, siap transaksi dalam 1-3 hari kerja.",
  keywords: [
    // Primary — high intent
    "buat webstore dari shopee",
    "jasa pembuatan toko online",
    "webstore builder indonesia",
    "migrasi shopee ke website sendiri",
    "buat website toko online tanpa ribet",
    // Secondary — supporting
    "cara punya toko online sendiri",
    "toko online di luar marketplace",
    "website jualan sendiri tanpa coding",
    "biaya buat toko online",
    "webstore murah indonesia",
    // Long-tail — content/blog targets
    "cara pindah dari shopee ke website sendiri",
    "keuntungan punya webstore sendiri vs marketplace",
    "berapa biaya buat toko online profesional",
    "cara import produk shopee ke website",
    "webstore dengan ongkir gratis otomatis",
    "toko online dengan pembayaran xendit",
    "webstore custom domain indonesia",
    // Brand & niche
    "storo webstore",
    "webstore terkelola",
    "managed webstore indonesia",
    "webstore seller shopee",
    "toko online tanpa ribet",
    "storo.id",
  ],
  alternates: {
    canonical: "https://storo.id",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://storo.id",
    siteName: "Storo.id",
    title: "Buat Webstore dari Shopee — Tanpa Ribet | Storo.id",
    description:
      "Punya toko online sendiri dari Shopee tanpa coding. Setup lengkap — domain custom, payment gateway, 11+ kurir otomatis. Siap transaksi dalam 1-3 hari kerja.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Storo.id — Jasa Buat Webstore untuk Seller Shopee",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Buat Webstore dari Shopee — Tanpa Ribet | Storo.id",
    description:
      "Punya toko online sendiri dari Shopee tanpa coding. Domain custom, payment gateway, 11+ kurir otomatis. Setup 1-3 hari kerja.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} font-inter antialiased`}>
        <Providers>{children}</Providers>

        {/* Google Analytics + Google Ads */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-45J7TGRZJP"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-45J7TGRZJP');
            gtag('config', 'AW-17522921333');
          `}
        </Script>
      </body>
    </html>
  );
}
