import type { Metadata } from "next";
import BlogPostPage from "@/page-components/BlogPost";

// Static blog post titles for SEO metadata
const blogTitles: Record<string, string> = {
  "1": "Cara Export Produk dari Seller Center Shopee dengan Mudah",
  "2": "Mengapa Seller Shopee Butuh Website Toko Online Sendiri?",
  "3": "Integrasi Payment Gateway untuk Toko Online WooCommerce",
  "4": "Mengenal Ongkir Real-Time: JNE, J&T, dan SiCepat untuk Webstore",
  "5": "Strategi Digital Marketing untuk Toko Online Baru",
  "6": "Cara Meningkatkan Penjualan Webstore dengan SEO Dasar",
  "7": "Manajemen Stok Produk di WooCommerce: Panduan Lengkap",
  "8": "Excellence Customer Service E-commerce: WhatsApp, Email, Live Chat",
  "9": "Desain Toko Online yang Konversi Tinggi",
  "10": "Tren E-commerce Indonesia 2024: Peluang untuk UMKM",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const title = blogTitles[id] ?? "Artikel Blog";

  return {
    title,
    description: `Baca artikel lengkap: ${title}. Tips dan strategi e-commerce dari Storo.id untuk seller Shopee Indonesia.`,
    openGraph: {
      title: `${title} | Blog Storo.id`,
      description: `Baca artikel lengkap: ${title}.`,
      url: `https://storo.id/blog/${id}`,
    },
  };
}

export default BlogPostPage;
