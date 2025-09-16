import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";

const blogPosts = [
  {
    id: 1,
    title: "Cara Export Produk dari Seller Center Shopee dengan Mudah",
    excerpt: "Panduan lengkap untuk mengekspor data produk dari Seller Center Shopee ke format Excel untuk setup webstore.",
    content: `
      <h2>Mengapa Perlu Export Produk dari Shopee?</h2>
      <p>Sebagai seller yang ingin memiliki website toko online sendiri, langkah pertama yang harus dilakukan adalah memindahkan data produk dari Shopee ke website baru. Proses export ini sangat penting karena akan menghemat waktu dan tenaga dibandingkan input manual satu per satu.</p>
      
      <h2>Langkah-langkah Export Produk</h2>
      <h3>1. Login ke Seller Center Shopee</h3>
      <p>Masuk ke akun Seller Center Shopee Anda menggunakan kredensial yang biasa digunakan. Pastikan Anda memiliki akses penuh ke dashboard.</p>
      
      <h3>2. Navigasi ke Menu Produk</h3>
      <p>Di dashboard utama, klik menu "Produk" yang biasanya terletak di sidebar kiri. Di sini Anda akan melihat semua produk yang telah Anda upload.</p>
      
      <h3>3. Pilih Produk yang Akan Diexport</h3>
      <p>Anda bisa memilih semua produk atau hanya produk tertentu. Gunakan fitur filter jika diperlukan untuk memilih kategori atau produk spesifik.</p>
      
      <h3>4. Klik Tombol Export</h3>
      <p>Cari tombol "Export" atau "Unduh" yang biasanya berupa ikon download. Pilih format Excel (.xlsx) sebagai format output.</p>
      
      <h2>Tips Penting</h2>
      <ul>
        <li>Pastikan semua foto produk sudah diupload dengan benar</li>
        <li>Periksa kelengkapan deskripsi produk sebelum export</li>
        <li>Backup data sebelum melakukan export</li>
        <li>Siapkan file dalam folder yang mudah diakses</li>
      </ul>
      
      <h2>Setelah Export Selesai</h2>
      <p>Setelah file Excel berhasil didownload, Anda bisa langsung mengirimkannya ke tim Storo.id melalui WhatsApp. Tim kami akan memproses data tersebut dan setup webstore WooCommerce Anda dalam waktu 1-3 hari kerja.</p>
    `,
    author: "Tim Storo.id",
    date: "15 Maret 2024",
    category: "Tutorial",
    image: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=800&h=400&fit=crop"
  },
  {
    id: 2,
    title: "Mengapa Seller Shopee Butuh Website Toko Online Sendiri?",
    excerpt: "Alasan penting kenapa pemilik toko di marketplace perlu memiliki website toko online independent.",
    content: `
      <h2>Tantangan Seller di Marketplace</h2>
      <p>Sebagai seller di Shopee, Anda mungkin sudah merasakan berbagai tantangan yang semakin hari semakin berat. Kompetisi yang ketat, biaya iklan yang makin mahal, dan ketergantungan total pada platform marketplace.</p>
      
      <h2>Kelemahan Bergantung pada Marketplace</h2>
      <h3>1. Potongan Fee yang Tinggi</h3>
      <p>Shopee memotong komisi dari setiap transaksi, biaya iklan, dan berbagai biaya operasional lainnya. Margin keuntungan Anda semakin tipis setiap tahunnya.</p>
      
      <h3>2. Data Pelanggan Bukan Milik Anda</h3>
      <p>Semua data pelanggan, riwayat pembelian, dan informasi penting lainnya adalah milik Shopee. Anda tidak memiliki akses langsung untuk berkomunikasi dengan pelanggan di luar platform.</p>
      
      <h3>3. Kebijakan yang Berubah-ubah</h3>
      <p>Platform marketplace bisa mengubah kebijakan kapan saja. Akun bisa disuspend tanpa peringatan, produk bisa diturunkan ranking, atau algoritma berubah drastis.</p>
      
      <h2>Keuntungan Memiliki Website Sendiri</h2>
      <h3>1. Kontrol Penuh</h3>
      <p>Dengan website sendiri, Anda memiliki kontrol penuh atas desain, kebijakan, dan pengalaman berbelanja pelanggan.</p>
      
      <h3>2. Biaya Operasional Lebih Rendah</h3>
      <p>Tidak ada potongan komisi dari marketplace. Biaya hanya untuk hosting, domain, dan payment gateway yang jauh lebih murah.</p>
      
      <h3>3. Branding yang Kuat</h3>
      <p>Membangun brand awareness lebih mudah dengan website sendiri. Pelanggan akan mengingat nama toko Anda, bukan nama marketplace.</p>
      
      <h2>Strategi Dual Channel</h2>
      <p>Bukan berarti Anda harus meninggalkan Shopee sepenuhnya. Strategi terbaik adalah menggunakan dual channel - tetap berjualan di Shopee untuk akuisisi pelanggan baru, sambil mengarahkan pelanggan loyal ke website pribadi.</p>
      
      <h2>Langkah Pertama</h2>
      <p>Mulai dengan mengexport data produk dari Seller Center Shopee, lalu hubungi Storo.id untuk setup website WooCommerce profesional. Dalam hitungan hari, Anda sudah bisa memiliki toko online sendiri yang siap beroperasi.</p>
    `,
    author: "Tim Storo.id",
    date: "12 Maret 2024",
    category: "Bisnis",
    image: "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=800&h=400&fit=crop"
  },
  {
    id: 3,
    title: "Integrasi Payment Gateway untuk Toko Online WooCommerce",
    excerpt: "Panduan memilih dan mengintegrasikan payment gateway terbaik untuk webstore berbasis WooCommerce.",
    content: `
      <h2>Pentingnya Payment Gateway yang Tepat</h2>
      <p>Payment gateway adalah jantung dari setiap toko online. Pilihan yang tepat akan mempengaruhi konversi penjualan, kepuasan pelanggan, dan kemudahan operasional toko online Anda.</p>
      
      <h2>Payment Gateway Populer di Indonesia</h2>
      <h3>1. Midtrans</h3>
      <p>Midtrans adalah salah satu payment gateway lokal terpopuler dengan dukungan berbagai metode pembayaran seperti kartu kredit, virtual account, e-wallet, dan convenience store.</p>
      
      <h3>2. Xendit</h3>
      <p>Xendit menawarkan solusi pembayaran yang lengkap dengan API yang mudah diintegrasikan ke WooCommerce. Mendukung pembayaran bank lokal dan internasional.</p>
      
      <h3>3. DOKU</h3>
      <p>DOKU adalah pionir payment gateway di Indonesia dengan reputasi yang solid dan tingkat keamanan tinggi.</p>
      
      <h2>Metode Pembayaran yang Harus Didukung</h2>
      <ul>
        <li><strong>Transfer Bank:</strong> BCA, Mandiri, BNI, BRI Virtual Account</li>
        <li><strong>E-Wallet:</strong> GoPay, OVO, Dana, ShopeePay</li>
        <li><strong>Kartu Kredit:</strong> Visa, Mastercard, JCB</li>
        <li><strong>Convenience Store:</strong> Indomaret, Alfamart</li>
        <li><strong>Paylater:</strong> Kredivo, Akulaku</li>
      </ul>
      
      <h2>Proses Integrasi di WooCommerce</h2>
      <h3>1. Install Plugin Payment Gateway</h3>
      <p>Download dan install plugin resmi dari payment gateway pilihan Anda di WordPress admin panel.</p>
      
      <h3>2. Konfigurasi API Key</h3>
      <p>Dapatkan API key dari dashboard payment gateway dan masukkan ke pengaturan plugin WooCommerce.</p>
      
      <h3>3. Testing Pembayaran</h3>
      <p>Lakukan testing pembayaran di mode sandbox sebelum go-live untuk memastikan semua berjalan dengan baik.</p>
      
      <h2>Keuntungan Menggunakan Storo.id</h2>
      <p>Tim Storo.id sudah berpengalaman mengintegrasikan berbagai payment gateway dengan WooCommerce. Kami akan setup semuanya untuk Anda, termasuk testing dan optimasi untuk konversi terbaik.</p>
      
      <h2>Tips Optimasi Konversi</h2>
      <ul>
        <li>Tampilkan semua opsi pembayaran di halaman produk</li>
        <li>Gunakan logo payment gateway untuk membangun trust</li>
        <li>Buat proses checkout yang simple dan cepat</li>
        <li>Sediakan panduan pembayaran yang jelas</li>
      </ul>
    `,
    author: "Tim Storo.id",
    date: "10 Maret 2024",
    category: "Technical",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=400&fit=crop"
  }
  // Add more detailed content for other posts...
];

const BlogPost = () => {
  const { id } = useParams();
  const post = blogPosts.find(p => p.id === parseInt(id || '1'));

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 pb-16 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Artikel Tidak Ditemukan</h1>
          <Link to="/blog">
            <Button className="btn-hero">Kembali ke Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleWhatsApp = () => {
    const message = "Halo Storo.id, saya ingin konsultasi tentang jasa setup webstore dari Shopee";
    window.open(`https://wa.me/6285647486700?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/blog" className="inline-flex items-center text-primary hover:text-primary/80 transition-colors mb-6">
            <ArrowLeft size={20} className="mr-2" />
            Kembali ke Blog
          </Link>
          
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                {post.category}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              {post.title}
            </h1>
            
            <div className="flex items-center space-x-6 text-muted-foreground mb-8">
              <div className="flex items-center space-x-2">
                <User size={18} />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar size={18} />
                <span>{post.date}</span>
              </div>
            </div>
            
            <div className="aspect-video overflow-hidden rounded-xl mb-8">
              <img 
                src={post.image} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div 
              className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-ul:text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            
            {/* CTA Section */}
            <div className="mt-12 p-8 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl text-center">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Butuh Bantuan Setup Webstore?
              </h3>
              <p className="text-muted-foreground mb-6">
                Tim Storo.id siap membantu Anda setup webstore dari data Shopee. Konsultasi gratis!
              </p>
              <Button onClick={handleWhatsApp} className="btn-hero">
                Konsultasi via WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogPost;