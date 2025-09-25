import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import brandingStrategyImg from "@/assets/blog-branding-strategy.jpg";
import returnRefundImg from "@/assets/blog-return-refund.jpg";
import digitalMarketingImg from "@/assets/blog-digital-marketing.jpg";
import dataSecurityImg from "@/assets/blog-data-security.jpg";
import mobileOptimizationImg from "@/assets/blog-mobile-optimization.jpg";
import affiliateMarketingImg from "@/assets/blog-affiliate-marketing.jpg";
import crossSellingImg from "@/assets/blog-cross-selling.jpg";
import dropshippingResellerImg from "@/assets/blog-dropshipping-reseller.jpg";
import packagingDesignImg from "@/assets/blog-packaging-design.jpg";
import competitorAnalysisImg from "@/assets/blog-competitor-analysis.jpg";

const blogPosts = [
  {
    id: 1,
    title: "Cara Export Produk dari Seller Center Shopee dengan Mudah",
    excerpt: "Panduan lengkap untuk mengekspor data produk dari Seller Center Shopee ke format Excel untuk setup webstore.",
    content: "Tutorial step-by-step cara mengunduh data produk dari dashboard Seller Center Shopee...",
    author: "Tim Storo.id",
    date: "15 Maret 2024",
    category: "Tutorial",
    image: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=800&h=400&fit=crop"
  },
  {
    id: 2,
    title: "Mengapa Seller Shopee Butuh Website Toko Online Sendiri?",
    excerpt: "Alasan penting kenapa pemilik toko di marketplace perlu memiliki website toko online independent.",
    content: "Dengan semakin ketatnya persaingan di marketplace, seller perlu strategi diversifikasi...",
    author: "Tim Storo.id",
    date: "12 Maret 2024",
    category: "Bisnis",
    image: "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=800&h=400&fit=crop"
  },
  {
    id: 3,
    title: "Integrasi Payment Gateway untuk Toko Online WooCommerce",
    excerpt: "Panduan memilih dan mengintegrasikan payment gateway terbaik untuk webstore berbasis WooCommerce.",
    content: "Payment gateway adalah jantung dari setiap toko online. Memilih yang tepat sangat penting...",
    author: "Tim Storo.id",
    date: "10 Maret 2024",
    category: "Technical",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=400&fit=crop"
  },
  {
    id: 4,
    title: "Optimasi SEO untuk Webstore: Tips Meningkatkan Visibility Online",
    excerpt: "Strategi SEO khusus untuk toko online agar produk mudah ditemukan di mesin pencari.",
    content: "SEO untuk e-commerce memiliki tantangan tersendiri. Berikut adalah strategi yang terbukti efektif...",
    author: "Tim Storo.id",
    date: "8 Maret 2024",
    category: "Marketing",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop"
  },
  {
    id: 5,
    title: "Perbandingan Biaya: Marketplace vs Website Toko Online Sendiri",
    excerpt: "Analisis mendalam tentang biaya operasional marketplace dibandingkan dengan website toko online pribadi.",
    content: "Mari kita hitung secara detail berapa sebenarnya biaya yang harus dikeluarkan...",
    author: "Tim Storo.id",
    date: "5 Maret 2024",
    category: "Bisnis",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop"
  },
  {
    id: 6,
    title: "Konfigurasi Ongkir Otomatis dengan Kurir Lokal Indonesia",
    excerpt: "Tutorial mengatur sistem ongkir real-time dengan JNE, J&T, SiCepat, dan kurir lokal lainnya.",
    content: "Sistem ongkir yang akurat adalah kunci kepuasan pelanggan. Berikut cara setupnya...",
    author: "Tim Storo.id",
    date: "3 Maret 2024",
    category: "Technical",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=400&fit=crop"
  },
  {
    id: 7,
    title: "Migrasi dari Marketplace ke Website: Timeline dan Strategi",
    excerpt: "Roadmap lengkap untuk transisi dari marketplace ke website toko online tanpa kehilangan pelanggan.",
    content: "Migrasi yang sukses membutuhkan perencanaan matang dan eksekusi bertahap...",
    author: "Tim Storo.id",
    date: "1 Maret 2024",
    category: "Bisnis",
    image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=400&fit=crop"
  },
  {
    id: 8,
    title: "Mengelola Inventory Multi-Channel: Shopee dan Website",
    excerpt: "Strategi mengelola stok produk secara sinkron antara marketplace dan website toko online.",
    content: "Mengelola inventory di multiple channel membutuhkan sistem yang tepat...",
    author: "Tim Storo.id",
    date: "28 Februari 2024",
    category: "Technical",
    image: "https://images.unsplash.com/photo-1560472355-536de3962603?w=800&h=400&fit=crop"
  },
  {
    id: 9,
    title: "Customer Service Excellence: WhatsApp vs Email vs Live Chat",
    excerpt: "Perbandingan efektivitas berbagai channel customer service untuk toko online Indonesia.",
    content: "Customer service yang responsif adalah kunci loyalitas pelanggan...",
    author: "Tim Storo.id",
    date: "25 Februari 2024",
    category: "Bisnis",
    image: "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=800&h=400&fit=crop"
  },
  {
    id: 10,
    title: "Tren E-commerce Indonesia 2024: Peluang untuk UMKM",
    excerpt: "Analisis tren e-commerce terkini dan peluang yang bisa dimanfaatkan oleh pelaku UMKM Indonesia.",
    content: "Industri e-commerce Indonesia terus berkembang pesat. Ini adalah peluang emas...",
    author: "Tim Storo.id",
    date: "22 Februari 2024",
    category: "Insight",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop"
  },
  {
    id: 11,
    title: "Strategi Branding untuk Toko Online: Membangun Identitas Brand yang Kuat",
    excerpt: "Panduan lengkap membangun identitas brand yang memorable dan meningkatkan loyalitas pelanggan untuk toko online Anda.",
    content: "Brand yang kuat adalah kunci kesuksesan jangka panjang dalam e-commerce. Pelajari strategi membangun identitas brand yang memorable...",
    author: "Tim Storo.id",
    date: "20 September 2024",
    category: "Branding",
    image: brandingStrategyImg
  },
  {
    id: 12,
    title: "Cara Menangani Return dan Refund di Toko Online dengan Profesional",
    excerpt: "Sistem pengelolaan return dan refund yang baik dapat meningkatkan kepercayaan pelanggan dan mengurangi komplain.",
    content: "Mengelola return dan refund adalah bagian penting dari customer service yang excellent. Berikut panduan lengkapnya...",
    author: "Tim Storo.id",
    date: "18 September 2024",
    category: "Customer Service",
    image: returnRefundImg
  },
  {
    id: 13,
    title: "Digital Marketing untuk UMKM: Instagram, TikTok, dan Facebook Ads",
    excerpt: "Strategi pemasaran digital yang efektif dan terjangkau untuk UMKM di platform media sosial populer Indonesia.",
    content: "Media sosial adalah channel marketing paling cost-effective untuk UMKM. Pelajari cara memaksimalkan ROI Anda...",
    author: "Tim Storo.id",
    date: "15 September 2024",
    category: "Marketing",
    image: digitalMarketingImg
  },
  {
    id: 14,
    title: "Keamanan Data Pelanggan: SSL, GDPR, dan Perlindungan Privacy",
    excerpt: "Pentingnya mengamankan data pelanggan dan implementasi standar keamanan internasional untuk toko online.",
    content: "Keamanan data bukan hanya kewajiban hukum, tapi juga kunci membangun kepercayaan pelanggan. Pelajari best practices-nya...",
    author: "Tim Storo.id",
    date: "12 September 2024",
    category: "Security",
    image: dataSecurityImg
  },
  {
    id: 15,
    title: "Optimasi Mobile-First untuk Toko Online di Era Smartphone",
    excerpt: "Lebih dari 80% konsumen Indonesia berbelanja via mobile. Pelajari cara mengoptimalkan toko online untuk mobile users.",
    content: "Mobile commerce adalah masa depan e-commerce Indonesia. Pastikan toko online Anda mobile-friendly dengan panduan ini...",
    author: "Tim Storo.id",
    date: "10 September 2024",
    category: "Technical",
    image: mobileOptimizationImg
  },
  {
    id: 16,
    title: "Affiliate Marketing: Tingkatkan Penjualan dengan Program Reseller",
    excerpt: "Membangun jaringan affiliate yang kuat untuk meningkatkan reach dan penjualan tanpa menambah biaya marketing yang besar.",
    content: "Program affiliate adalah cara efektif scaling bisnis dengan performance-based marketing. Berikut cara memulainya...",
    author: "Tim Storo.id",
    date: "8 September 2024",
    category: "Marketing",
    image: affiliateMarketingImg
  },
  {
    id: 17,
    title: "Cross-selling dan Upselling: Teknik Meningkatkan Nilai Transaksi",
    excerpt: "Strategi terbukti untuk meningkatkan average order value melalui teknik cross-selling dan upselling yang efektif.",
    content: "Meningkatkan nilai transaksi existing customer lebih mudah dan murah daripada mencari customer baru. Pelajari caranya...",
    author: "Tim Storo.id",
    date: "5 September 2024",
    category: "Sales",
    image: crossSellingImg
  },
  {
    id: 18,
    title: "Dropshipping vs Reseller: Mana yang Lebih Menguntungkan?",
    excerpt: "Analisis mendalam kelebihan dan kekurangan model bisnis dropshipping vs reseller untuk pemula e-commerce.",
    content: "Memilih model bisnis yang tepat adalah langkah crucial untuk kesuksesan e-commerce. Mari bandingkan kedua model ini...",
    author: "Tim Storo.id",
    date: "3 September 2024",
    category: "Bisnis",
    image: dropshippingResellerImg
  },
  {
    id: 19,
    title: "Packaging yang Menarik: First Impression untuk Toko Online",
    excerpt: "Kemasan yang menarik dapat meningkatkan customer satisfaction dan mendorong repeat purchase serta word-of-mouth marketing.",
    content: "Unboxing experience yang memorable adalah marketing tool yang powerful. Pelajari cara menciptakan packaging yang WOW...",
    author: "Tim Storo.id",
    date: "1 September 2024",
    category: "Branding",
    image: packagingDesignImg
  },
  {
    id: 20,
    title: "Analisis Kompetitor: Strategi Mengalahkan Pesaing di Niche Market",
    excerpt: "Metodologi systematic untuk menganalisis kompetitor dan menemukan competitive advantage dalam niche market Anda.",
    content: "Mengetahui kekuatan dan kelemahan kompetitor adalah kunci untuk mengembangkan strategi bisnis yang winning. Berikut caranya...",
    author: "Tim Storo.id",
    date: "28 Agustus 2024",
    category: "Strategy",
    image: competitorAnalysisImg
  }
];

const Blog = () => {
  useEffect(() => {
    // Animate elements on scroll
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.fade-in').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleWhatsApp = () => {
    const message = "Halo Storo.id, saya ingin konsultasi tentang jasa setup webstore dari Shopee";
    window.open(`https://wa.me/6285647486700?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center fade-in">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Blog <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Storo.id</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Tips, tutorial, dan insight seputar e-commerce, webstore, dan strategi bisnis online untuk seller Indonesia
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="section-padding">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <Card key={post.id} className={`fade-in hover:shadow-lg transition-all duration-300 group cursor-pointer`} style={{ animationDelay: `${index * 100}ms` }}>
                <div className="aspect-video overflow-hidden rounded-t-lg">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                      {post.category}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Calendar size={14} />
                      <span>{post.date}</span>
                    </div>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors duration-200">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-muted-foreground mb-4">
                    {post.excerpt}
                  </CardDescription>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <User size={14} />
                      <span>{post.author}</span>
                    </div>
                    <Link to={`/blog/${post.id}`}>
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary group-hover:translate-x-1 transition-all duration-200">
                        Baca Selengkapnya
                        <ArrowRight size={14} className="ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Siap Memulai Webstore Anda?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Konsultasikan kebutuhan webstore Anda dengan tim Storo.id. Gratis dan tanpa komitmen!
            </p>
            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <Button onClick={handleWhatsApp} className="btn-hero">
                Konsultasi Gratis via WhatsApp
              </Button>
              <Link to="/">
                <Button variant="outline" className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  Kembali ke Beranda
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;