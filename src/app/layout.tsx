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
    default: "Storo.id — Dari Shopee ke Webstore Sendiri, Tanpa Ribet",
    template: "%s | Storo.id",
  },
  description:
    "Storo.id adalah jasa pembuatan website toko online khusus seller Shopee. Import produk otomatis dari Excel, payment gateway, ongkir real-time. Setup dalam 1-3 hari kerja.",
  keywords: [
    "webstore shopee",
    "jasa buat toko online",
    "website toko online",
    "import produk shopee",
    "storo.id",
    "woocommerce shopee",
  ],
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://storo.id",
    siteName: "Storo.id",
    title: "Storo.id — Dari Shopee ke Webstore Sendiri, Tanpa Ribet",
    description:
      "Import produk dari Shopee, langsung jadi webstore profesional. Payment gateway, ongkir otomatis, dashboard WooCommerce.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Storo.id — Webstore untuk Seller Shopee",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Storo.id — Dari Shopee ke Webstore Sendiri",
    description:
      "Import produk dari Shopee, langsung jadi webstore profesional.",
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

        {/* Google Analytics */}
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
          `}
        </Script>
      </body>
    </html>
  );
}
