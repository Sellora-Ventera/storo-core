import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User, ArrowRight } from "lucide-react";
import Header from "@/components/Header";

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
    image: "https://images.unsplash.com/photo-1432888622747-4eb9a8e2d3a8?w=800&h=400&fit=crop"
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
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop"
  },
  {
    id: 8,
    title: "Mengelola Inventory Multi-Channel: Shopee dan Website",
    excerpt: "Strategi mengelola stok produk secara sinkron antara marketplace dan website toko online.",
    content: "Mengelola inventory di multiple channel membutuhkan sistem yang tepat...",
    author: "Tim Storo.id",
    date: "28 Februari 2024",
    category: "Technical",
    image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&h=400&fit=crop"
  },
  {
    id: 9,
    title: "Customer Service Excellence: WhatsApp vs Email vs Live Chat",
    excerpt: "Perbandingan efektivitas berbagai channel customer service untuk toko online Indonesia.",
    content: "Customer service yang responsif adalah kunci loyalitas pelanggan...",
    author: "Tim Storo.id",
    date: "25 Februari 2024",
    category: "Bisnis",
    image: "https://images.unsplash.com/photo-1533750516457-a7f992034fcd?w=800&h=400&fit=crop"
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