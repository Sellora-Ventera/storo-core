import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "@/index.css";

import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Storo.id - Jasa Buat Website Toko Online dari Shopee",
  description:
    "Jasa setup webstore dari Shopee - Punya toko sendiri tanpa ribet. Import produk otomatis, integrasi pembayaran & ongkir. Konsultasi gratis!",
  authors: [{ name: "Storo.id" }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/logo.png",
  },
  openGraph: {
    title: "Storo.id - Jasa Buat Website Toko Online dari Shopee",
    description:
      "Jasa setup webstore dari Shopee - Punya toko sendiri tanpa ribet. Import produk otomatis, integrasi pembayaran & ongkir.",
    type: "website",
    images: ["https://lovable.dev/opengraph-image-p98pqg.png"],
  },
  twitter: {
    card: "summary_large_image",
    site: "@lovable_dev",
    images: ["https://lovable.dev/opengraph-image-p98pqg.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-45J7TGRZJP"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-45J7TGRZJP');
          `}
        </Script>
      </head>
      <body className={`${inter.variable} font-inter`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
