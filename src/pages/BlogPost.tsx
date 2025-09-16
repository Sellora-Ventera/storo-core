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
  },
  {
    id: 4,
    title: "Optimasi SEO untuk Webstore: Tips Meningkatkan Visibility Online",
    excerpt: "Strategi SEO khusus untuk toko online agar produk mudah ditemukan di mesin pencari.",
    content: `
      <h2>Mengapa SEO Penting untuk Webstore?</h2>
      <p>SEO (Search Engine Optimization) adalah kunci untuk mendapatkan traffic organik ke webstore Anda. Tanpa SEO yang baik, website Anda akan tenggelam di halaman belakang Google dan sulit ditemukan oleh calon pembeli.</p>
      
      <h2>SEO On-Page untuk Produk</h2>
      <h3>1. Optimasi Judul Produk</h3>
      <p>Gunakan kata kunci yang relevan di judul produk. Misalnya: "Sepatu Sneakers Pria Nike Air Max - Original 100%" lebih baik dari "Sepatu Bagus".</p>
      
      <h3>2. Deskripsi Produk yang Kaya Kata Kunci</h3>
      <p>Tulis deskripsi produk minimal 200 kata dengan menyertakan kata kunci long-tail yang sering dicari konsumen.</p>
      
      <h3>3. Alt Text untuk Gambar</h3>
      <p>Setiap gambar produk harus memiliki alt text yang deskriptif untuk membantu mesin pencari memahami konten visual.</p>
      
      <h2>SEO Technical</h2>
      <h3>1. Kecepatan Loading Website</h3>
      <p>Google mengutamakan website yang cepat. Optimasi gambar, gunakan CDN, dan pilih hosting yang berkualitas.</p>
      
      <h3>2. Mobile-Friendly Design</h3>
      <p>Mayoritas pencarian dilakukan di mobile. Pastikan webstore Anda responsive dan mudah digunakan di smartphone.</p>
      
      <h3>3. SSL Certificate</h3>
      <p>Website dengan HTTPS mendapat ranking lebih baik di Google dan meningkatkan trust pelanggan.</p>
      
      <h2>Content Marketing untuk SEO</h2>
      <h3>1. Blog tentang Produk</h3>
      <p>Buat artikel blog yang membahas cara menggunakan produk, tips perawatan, atau comparison review.</p>
      
      <h3>2. Tutorial dan How-to Guide</h3>
      <p>Content edukatif mendapat ranking tinggi di Google dan membantu membangun otoritas brand.</p>
      
      <h2>Local SEO untuk Toko Online</h2>
      <p>Jika Anda melayani area tertentu, optimasi local SEO dengan mendaftarkan bisnis di Google My Business dan menggunakan kata kunci lokasi.</p>
      
      <h2>Tools SEO yang Berguna</h2>
      <ul>
        <li><strong>Google Analytics:</strong> Monitor traffic dan behavior pengunjung</li>
        <li><strong>Google Search Console:</strong> Track performa keyword dan indexing</li>
        <li><strong>Yoast SEO:</strong> Plugin WordPress untuk optimasi on-page</li>
        <li><strong>Ubersuggest:</strong> Research kata kunci gratis</li>
      </ul>
      
      <h2>Storo.id dan SEO</h2>
      <p>Webstore yang dibuat oleh Storo.id sudah dioptimasi untuk SEO dari awal. Kami menggunakan theme yang SEO-friendly, struktur URL yang clean, dan menginstall plugin SEO terbaik untuk WooCommerce.</p>
    `,
    author: "Tim Storo.id",
    date: "8 Maret 2024",
    category: "Marketing",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop"
  },
  {
    id: 5,
    title: "Perbandingan Biaya: Marketplace vs Website Toko Online Sendiri",
    excerpt: "Analisis mendalam tentang biaya operasional marketplace dibandingkan dengan website toko online pribadi.",
    content: `
      <h2>Biaya Tersembunyi di Marketplace</h2>
      <p>Banyak seller yang tidak menyadari berapa sebenarnya total biaya yang harus dibayar saat berjualan di marketplace. Mari kita hitung secara detail.</p>
      
      <h2>Breakdown Biaya Shopee</h2>
      <h3>1. Komisi Transaksi</h3>
      <p>Shopee memotong 2-5% dari setiap transaksi tergantung kategori produk. Untuk omzet 10 juta per bulan, itu berarti 200-500 ribu rupiah.</p>
      
      <h3>2. Biaya Payment Gateway</h3>
      <p>Tambahan 1-2% untuk biaya payment processing, sekitar 100-200 ribu per bulan untuk omzet 10 juta.</p>
      
      <h3>3. Biaya Iklan</h3>
      <p>Untuk tetap kompetitif, seller butuh iklan minimal 5-10% dari omzet. Itu berarti 500 ribu - 1 juta rupiah per bulan.</p>
      
      <h3>4. Biaya Promo dan Diskon</h3>
      <p>Flash sale, voucher, dan promo lainnya bisa menghabiskan 3-5% dari omzet atau 300-500 ribu rupiah.</p>
      
      <h2>Total Biaya Marketplace per Bulan</h2>
      <p>Untuk omzet 10 juta rupiah:</p>
      <ul>
        <li>Komisi: 200-500 ribu</li>
        <li>Payment: 100-200 ribu</li>
        <li>Iklan: 500 ribu - 1 juta</li>
        <li>Promo: 300-500 ribu</li>
        <li><strong>Total: 1,1 - 2,2 juta rupiah (11-22%)</strong></li>
      </ul>
      
      <h2>Biaya Website Toko Online Sendiri</h2>
      <h3>1. Setup Awal (Storo.id)</h3>
      <ul>
        <li>Starter: 1,5 juta (sekali bayar)</li>
        <li>Pro: 2,5 juta (sekali bayar)</li>
        <li>Advance: 3,5 juta (sekali bayar)</li>
      </ul>
      
      <h3>2. Biaya Bulanan</h3>
      <ul>
        <li>Hosting & Maintenance: 200 ribu/bulan</li>
        <li>Payment Gateway: 1-2% dari transaksi</li>
        <li>Domain: 150 ribu/tahun</li>
      </ul>
      
      <h2>Perbandingan ROI</h2>
      <p>Untuk omzet 10 juta/bulan:</p>
      <ul>
        <li><strong>Marketplace:</strong> Biaya 1,1-2,2 juta/bulan (13,2-26,4 juta/tahun)</li>
        <li><strong>Website Sendiri:</strong> Setup 2,5 juta + 200 ribu x 12 bulan = 4,9 juta/tahun</li>
      </ul>
      
      <h2>Break Even Point</h2>
      <p>Website sendiri akan break even dalam 3-6 bulan tergantung omzet. Setelah itu, penghematan bisa mencapai 60-80% dari biaya marketplace.</p>
      
      <h2>Keuntungan Non-Finansial</h2>
      <ul>
        <li>Kontrol penuh atas customer data</li>
        <li>Branding yang lebih kuat</li>
        <li>Tidak ada persaingan di halaman yang sama</li>
        <li>Fleksibilitas dalam pricing dan promo</li>
      </ul>
      
      <h2>Kesimpulan</h2>
      <p>Untuk seller dengan omzet konsisten di atas 5 juta per bulan, memiliki website sendiri adalah investasi yang sangat menguntungkan dalam jangka panjang.</p>
    `,
    author: "Tim Storo.id",
    date: "5 Maret 2024",
    category: "Bisnis",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop"
  },
  {
    id: 6,
    title: "Konfigurasi Ongkir Otomatis dengan Kurir Lokal Indonesia",
    excerpt: "Tutorial mengatur sistem ongkir real-time dengan JNE, J&T, SiCepat, dan kurir lokal lainnya.",
    content: `
      <h2>Pentingnya Sistem Ongkir yang Akurat</h2>
      <p>Sistem ongkir yang akurat adalah salah satu faktor terpenting dalam e-commerce. Customer abandonment sering terjadi karena ongkir yang tidak jelas atau terlalu mahal.</p>
      
      <h2>Kurir yang Didukung WooCommerce Indonesia</h2>
      <h3>1. JNE (Jalur Nugraha Ekakurir)</h3>
      <p>Kurir terbesar dengan jangkauan ke seluruh Indonesia. Menyediakan API untuk integrasi real-time tarif dan tracking.</p>
      
      <h3>2. J&T Express</h3>
      <p>Kurir dengan pertumbuhan tercepat di Indonesia, khususnya untuk e-commerce dengan tarif kompetitif.</p>
      
      <h3>3. SiCepat</h3>
      <p>Fokus pada pengiriman same-day dan next-day untuk area Jabodetabek dan kota besar lainnya.</p>
      
      <h3>4. AnterAja</h3>
      <p>Kurir digital-first dengan teknologi tracking yang advanced dan layanan pelanggan 24/7.</p>
      
      <h2>Setup Plugin Ongkir WooCommerce</h2>
      <h3>1. Install Plugin Raja Ongkir</h3>
      <p>Plugin populer yang mengintegrasikan multiple kurir dalam satu dashboard. Mendukung real-time pricing untuk semua kurir major Indonesia.</p>
      
      <h3>2. Konfigurasi API Key</h3>
      <p>Daftarkan akun di RajaOngkir.com untuk mendapatkan API key. Input API key di pengaturan plugin WooCommerce.</p>
      
      <h3>3. Setting Asal Pengiriman</h3>
      <p>Tentukan kota dan kecamatan asal pengiriman sesuai lokasi warehouse atau toko fisik Anda.</p>
      
      <h2>Optimasi Pengaturan Ongkir</h2>
      <h3>1. Minimum Purchase untuk Free Shipping</h3>
      <p>Set minimum pembelian untuk gratis ongkir, misalnya 100 ribu rupiah. Ini mendorong customer untuk berbelanja lebih banyak.</p>
      
      <h3>2. Flat Rate untuk Area Tertentu</h3>
      <p>Untuk area dengan volume tinggi, gunakan flat rate ongkir yang sudah dinegosiasikan dengan kurir.</p>
      
      <h3>3. Estimasi Waktu Pengiriman</h3>
      <p>Tampilkan estimasi waktu pengiriman di halaman checkout untuk memberikan ekspektasi yang jelas kepada customer.</p>
      
      <h2>Multiple Warehouse Support</h2>
      <p>Jika Anda memiliki warehouse di beberapa kota, plugin advanced bisa mengkalkulasi ongkir dari warehouse terdekat secara otomatis.</p>
      
      <h2>Integration dengan Inventory Management</h2>
      <p>Sistem ongkir yang baik terintegrasi dengan stock management untuk memastikan produk dikirim dari lokasi yang tersedia stock-nya.</p>
      
      <h2>Tips Mengurangi Komplain Ongkir</h2>
      <ul>
        <li>Tampilkan calculator ongkir di halaman produk</li>
        <li>Berikan pilihan kurir dengan berbagai harga</li>
        <li>Komunikasikan jelas tentang packing fee (jika ada)</li>
        <li>Sediakan customer service untuk pertanyaan ongkir</li>
      </ul>
      
      <h2>Monitoring dan Optimasi</h2>
      <p>Track conversion rate di halaman checkout dan analisa di mana customer paling sering abandon cart. Seringkali masalahnya ada di surprise ongkir yang terlalu tinggi.</p>
    `,
    author: "Tim Storo.id",
    date: "3 Maret 2024",
    category: "Technical",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=400&fit=crop"
  },
  {
    id: 7,
    title: "Migrasi dari Marketplace ke Website: Timeline dan Strategi",
    excerpt: "Roadmap lengkap untuk transisi dari marketplace ke website toko online tanpa kehilangan pelanggan.",
    content: `
      <h2>Strategi Migrasi Bertahap</h2>
      <p>Migrasi dari marketplace ke website sendiri harus dilakukan secara bertahap untuk meminimalkan risiko kehilangan penjualan dan pelanggan.</p>
      
      <h2>Fase 1: Persiapan (Minggu 1-2)</h2>
      <h3>1. Audit Data Produk</h3>
      <p>Export semua data produk dari Seller Center. Pastikan foto, deskripsi, dan harga sudah lengkap dan up-to-date.</p>
      
      <h3>2. Analisa Traffic dan Sales Pattern</h3>
      <p>Pelajari jam dan hari dengan traffic tertinggi. Gunakan data ini untuk timing launch website.</p>
      
      <h3>3. Setup Website</h3>
      <p>Hubungi Storo.id untuk setup website WooCommerce dengan semua data produk dari Shopee.</p>
      
      <h2>Fase 2: Soft Launch (Minggu 3-4)</h2>
      <h3>1. Testing Internal</h3>
      <p>Test semua fungsi website: checkout, payment, ongkir calculation, email notification, dll.</p>
      
      <h3>2. Beta Testing dengan Close Friends</h3>
      <p>Minta teman atau family untuk melakukan test purchase dan berikan feedback.</p>
      
      <h3>3. SEO Foundation</h3>
      <p>Setup Google Analytics, Search Console, dan optimasi basic SEO untuk semua halaman produk.</p>
      
      <h2>Fase 3: Dual Channel Operation (Bulan 2-3)</h2>
      <h3>1. Maintain Marketplace Presence</h3>
      <p>Tetap aktif di Shopee sambil mulai promote website ke existing customer.</p>
      
      <h3>2. Customer Education</h3>
      <p>Edukasi pelanggan existing tentang keuntungan berbelanja di website (harga lebih murah, promo eksklusif, dll).</p>
      
      <h3>3. Inventory Synchronization</h3>
      <p>Pastikan stock tersinkronisasi antara marketplace dan website untuk avoid overselling.</p>
      
      <h2>Fase 4: Website-First Strategy (Bulan 4-6)</h2>
      <h3>1. Exclusive Deals di Website</h3>
      <p>Berikan promo dan produk eksklusif hanya di website untuk encourage migration.</p>
      
      <h3>2. Customer Loyalty Program</h3>
      <p>Implementasi point system atau membership yang hanya berlaku di website.</p>
      
      <h3>3. Content Marketing</h3>
      <p>Mulai aktif blogging dan content marketing untuk drive organic traffic.</p>
      
      <h2>Fase 5: Marketplace sebagai Secondary Channel (Bulan 6+)</h2>
      <h3>1. Focus pada Website Growth</h3>
      <p>Majority effort dialokasikan untuk website growth: SEO, ads, social media marketing.</p>
      
      <h3>2. Selective Marketplace Usage</h3>
      <p>Gunakan marketplace hanya untuk produk tertentu atau sebagai customer acquisition channel.</p>
      
      <h2>Key Metrics yang Harus Dimonitor</h2>
      <ul>
        <li><strong>Traffic Website:</strong> Target 50% dari total traffic dalam 6 bulan</li>
        <li><strong>Conversion Rate:</strong> Website harus achieve minimal 2-3%</li>
        <li><strong>Customer Retention:</strong> Repeat purchase rate di website</li>
        <li><strong>Average Order Value:</strong> Biasanya lebih tinggi di website sendiri</li>
      </ul>
      
      <h2>Common Pitfalls yang Harus Dihindari</h2>
      <ul>
        <li>Langsung stop marketplace sebelum website stable</li>
        <li>Tidak communicate migration plan ke existing customer</li>
        <li>Mengabaikan customer service quality di website</li>
        <li>Pricing yang tidak kompetitif dibanding marketplace</li>
      </ul>
      
      <h2>Support dari Storo.id</h2>
      <p>Tim Storo.id akan membantu seluruh proses migrasi, dari setup website hingga training penggunaan dashboard WooCommerce. Kami juga menyediakan consultation untuk strategi marketing digital.</p>
    `,
    author: "Tim Storo.id",
    date: "1 Maret 2024",
    category: "Bisnis",
    image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=400&fit=crop"
  },
  {
    id: 8,
    title: "Mengelola Inventory Multi-Channel: Shopee dan Website",
    excerpt: "Strategi mengelola stok produk secara sinkron antara marketplace dan website toko online.",
    content: `
      <h2>Tantangan Multi-Channel Inventory</h2>
      <p>Mengelola inventory di multiple channel adalah salah satu challenge terbesar seller modern. Kesalahan bisa berakibat overselling, customer complaint, dan damage reputation.</p>
      
      <h2>Sistem Sinkronisasi Inventory</h2>
      <h3>1. Real-Time Stock Update</h3>
      <p>Idealnya, sistem inventory harus update secara real-time di semua channel. Ketika ada penjualan di website, stock di Shopee langsung berkurang otomatis.</p>
      
      <h3>2. Central Inventory Management</h3>
      <p>Gunakan satu sistem sebagai master inventory. Biasanya website menjadi master karena lebih fleksibel untuk customization.</p>
      
      <h3>3. Safety Stock Buffer</h3>
      <p>Selalu siapkan buffer stock untuk mengantisipasi delay synchronization atau sudden spike di salah satu channel.</p>
      
      <h2>Tools untuk Inventory Management</h2>
      <h3>1. WooCommerce Inventory Plugins</h3>
      <p>Plugin seperti ATUM atau WP Inventory Manager bisa membantu tracking stock movement dan forecast demand.</p>
      
      <h3>2. Third-Party Integration Tools</h3>
      <p>Tools seperti Sellbrite atau ChannelAdvisor bisa sinkronisasi inventory antara WooCommerce dan marketplace.</p>
      
      <h3>3. Custom API Integration</h3>
      <p>Untuk business dengan volume tinggi, custom API integration mungkin diperlukan untuk perfect synchronization.</p>
      
      <h2>Best Practices Inventory Management</h2>
      <h3>1. Set Reorder Points</h3>
      <p>Tentukan minimum stock level untuk setiap produk. Ketika mencapai level ini, automatic reorder atau notification harus triggered.</p>
      
      <h3>2. ABC Analysis</h3>
      <p>Kategorikan produk berdasarkan sales volume dan profit margin. Focus inventory management pada kategori A (high volume, high profit).</p>
      
      <h3>3. Seasonal Adjustment</h3>
      <p>Adjust inventory level berdasarkan seasonal pattern. Siapkan extra stock untuk peak season seperti Ramadan, Lebaran, atau 12.12.</p>
      
      <h2>Handling Stock Discrepancies</h2>
      <h3>1. Daily Stock Reconciliation</h3>
      <p>Lakukan pengecekan stock daily untuk identify discrepancies early. Ini bisa prevent overselling.</p>
      
      <h3>2. Investigation Process</h3>
      <p>Ketika ada discrepancy, investigate root cause: return yang belum diprocess, damaged goods, atau technical error.</p>
      
      <h3>3. Manual Adjustment Protocol</h3>
      <p>Have clear protocol untuk manual stock adjustment dan ensure proper documentation untuk audit trail.</p>
      
      <h2>Warehouse Management</h2>
      <h3>1. Location-Based Inventory</h3>
      <p>Jika punya multiple warehouse, track inventory per location dan optimize fulfillment berdasarkan customer location.</p>
      
      <h3>2. FIFO Implementation</h3>
      <p>First In, First Out principle penting untuk produk dengan expiry date atau fashion items yang seasonal.</p>
      
      <h3>3. Cycle Counting</h3>
      <p>Regular physical count untuk validate system inventory dengan actual stock di warehouse.</p>
      
      <h2>Reporting dan Analytics</h2>
      <ul>
        <li><strong>Stock Turn Rate:</strong> Berapa kali inventory sold dalam periode tertentu</li>
        <li><strong>Dead Stock Analysis:</strong> Identify slow-moving items yang perlu dipromo</li>
        <li><strong>Channel Performance:</strong> Mana channel yang perform better untuk each product</li>
        <li><strong>Forecast Accuracy:</strong> Seberapa akurat demand forecasting Anda</li>
      </ul>
      
      <h2>Technology Stack Recommendation</h2>
      <p>Untuk seller dengan 100-1000 SKU, kombinasi WooCommerce + marketplace sync plugin sudah cukup. Untuk 1000+ SKU, consider dedicated inventory management system seperti TradeGecko atau Zoho Inventory.</p>
      
      <h2>Storo.id Integration Support</h2>
      <p>Tim Storo.id bisa setup basic inventory sync antara WooCommerce dan Shopee. Untuk advanced integration, kami bermitra dengan inventory management solution providers.</p>
    `,
    author: "Tim Storo.id",
    date: "28 Februari 2024",
    category: "Technical",
    image: "https://images.unsplash.com/photo-1560472355-536de3962603?w=800&h=400&fit=crop"
  },
  {
    id: 9,
    title: "Customer Service Excellence: WhatsApp vs Email vs Live Chat",
    excerpt: "Perbandingan efektivitas berbagai channel customer service untuk toko online Indonesia.",
    content: `
      <h2>Landscape Customer Service di Indonesia</h2>
      <p>Customer service yang responsif adalah kunci loyalitas pelanggan di Indonesia. Budaya komunikasi yang personal dan immediate response expectation membuat pilihan channel CS sangat penting.</p>
      
      <h2>WhatsApp Business: The King of Indonesian CS</h2>
      <h3>Keunggulan WhatsApp</h3>
      <ul>
        <li><strong>Adoption Rate Tinggi:</strong> 90%+ orang Indonesia aktif di WhatsApp</li>
        <li><strong>Personal Touch:</strong> Feel like talking to friend, bukan bot</li>
        <li><strong>Rich Media Support:</strong> Bisa kirim foto, video, dokumen</li>
        <li><strong>Voice Message:</strong> Untuk customer yang prefer voice over text</li>
      </ul>
      
      <h3>WhatsApp Business Features</h3>
      <ul>
        <li><strong>Quick Replies:</strong> Template response untuk FAQ</li>
        <li><strong>Labels:</strong> Categorize conversation untuk better organization</li>
        <li><strong>Catalog:</strong> Showcase produk langsung di chat</li>
        <li><strong>WhatsApp Web:</strong> Manage dari desktop untuk efficiency</li>
      </ul>
      
      <h2>Email Customer Service</h2>
      <h3>Kapan Email Cocok</h3>
      <ul>
        <li>Complex issues yang butuh detailed explanation</li>
        <li>Formal complaints atau disputes</li>
        <li>Documentation purposes (invoice, warranty, etc)</li>
        <li>International customers</li>
      </ul>
      
      <h3>Email Best Practices</h3>
      <ul>
        <li><strong>Response Time:</strong> Max 24 jam, idealnya 2-4 jam</li>
        <li><strong>Template yang Personal:</strong> Avoid generic copy-paste responses</li>
        <li><strong>Clear Subject Lines:</strong> Untuk easy tracking dan search</li>
        <li><strong>Follow-up System:</strong> Ensure customer satisfaction</li>
      </ul>
      
      <h2>Live Chat Implementation</h2>
      <h3>Keunggulan Live Chat</h3>
      <ul>
        <li><strong>Immediate Response:</strong> Real-time conversation</li>
        <li><strong>Higher Conversion:</strong> Bisa assist buying decision on the spot</li>
        <li><strong>Cost Effective:</strong> One agent bisa handle multiple chats</li>
        <li><strong>Analytics:</strong> Detailed metrics tentang customer behavior</li>
      </ul>
      
      <h3>Live Chat Tools Recommendation</h3>
      <ul>
        <li><strong>Tawk.to:</strong> Free dengan unlimited agents</li>
        <li><strong>Zendesk Chat:</strong> Advanced features dan integration</li>
        <li><strong>Intercom:</strong> Best for growth-focused businesses</li>
        <li><strong>Crisp:</strong> Beautiful UI dengan affordable pricing</li>
      </ul>
      
      <h2>Omnichannel Strategy</h2>
      <h3>Integration Approach</h3>
      <p>Best practice adalah menyediakan multiple channels tapi ensure consistent experience. Customer bisa start conversation di WhatsApp dan continue via email jika needed.</p>
      
      <h3>Channel Routing</h3>
      <ul>
        <li><strong>WhatsApp:</strong> Quick questions, order status, general inquiry</li>
        <li><strong>Email:</strong> Complaints, refunds, detailed product information</li>
        <li><strong>Live Chat:</strong> Pre-sales support, buying guidance</li>
        <li><strong>Phone:</strong> Urgent issues, high-value customers</li>
      </ul>
      
      <h2>Response Time Expectations</h2>
      <table>
        <tr>
          <th>Channel</th>
          <th>Expected Response Time</th>
          <th>Business Hours</th>
        </tr>
        <tr>
          <td>WhatsApp</td>
          <td>15-30 minutes</td>
          <td>8AM - 10PM</td>
        </tr>
        <tr>
          <td>Live Chat</td>
          <td>Under 2 minutes</td>
          <td>9AM - 6PM</td>
        </tr>
        <tr>
          <td>Email</td>
          <td>2-4 hours</td>
          <td>24/7</td>
        </tr>
      </table>
      
      <h2>Automation dan Chatbot</h2>
      <h3>WhatsApp Chatbot</h3>
      <p>Tools seperti Botika atau Kata.ai bisa automate basic responses di WhatsApp Business API.</p>
      
      <h3>Email Autoresponder</h3>
      <p>Setup automatic acknowledgment email dengan estimated response time dan relevant information.</p>
      
      <h2>Metrics yang Harus Ditrack</h2>
      <ul>
        <li><strong>First Response Time:</strong> Berapa lama customer menunggu first reply</li>
        <li><strong>Resolution Time:</strong> Total time untuk resolve issue</li>
        <li><strong>Customer Satisfaction Score (CSAT):</strong> Post-conversation survey</li>
        <li><strong>Resolution Rate:</strong> Percentage issue yang berhasil resolved</li>
      </ul>
      
      <h2>Integration dengan WooCommerce</h2>
      <p>Webstore yang dibuat Storo.id bisa diintegrasikan dengan semua CS channels ini. Kami setup WhatsApp Business, email templates, dan live chat sesuai kebutuhan business Anda.</p>
    `,
    author: "Tim Storo.id",
    date: "25 Februari 2024",
    category: "Bisnis",
    image: "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=800&h=400&fit=crop"
  },
  {
    id: 10,
    title: "Tren E-commerce Indonesia 2024: Peluang untuk UMKM",
    excerpt: "Analisis tren e-commerce terkini dan peluang yang bisa dimanfaatkan oleh pelaku UMKM Indonesia.",
    content: `
      <h2>Overview E-commerce Indonesia 2024</h2>
      <p>Indonesia adalah market e-commerce terbesar di Southeast Asia dengan growth rate yang masih tinggi. Total GMV diproyeksikan mencapai $77 billion di 2024, naik 15% dari tahun sebelumnya.</p>
      
      <h2>Tren Utama E-commerce 2024</h2>
      <h3>1. Social Commerce Explosion</h3>
      <p>TikTok Shop, Instagram Shopping, dan Facebook Shop semakin dominan. 60% Gen Z melakukan discovery produk melalui social media.</p>
      
      <h3>2. Live Commerce Growth</h3>
      <p>Live streaming untuk jualan tumbuh 200% year-over-year. Platform seperti Shopee Live dan TikTok Live jadi channel penting.</p>
      
      <h3>3. D2C (Direct-to-Consumer) Rise</h3>
      <p>Brand mulai bypass marketplace dan fokus build direct relationship dengan customer melalui website sendiri.</p>
      
      <h3>4. Sustainability Focus</h3>
      <p>Consumer semakin peduli environmental impact. Eco-friendly packaging dan sustainable products mendapat premium pricing.</p>
      
      <h2>Shift Perilaku Konsumen</h2>
      <h3>1. Mobile-First Shopping</h3>
      <p>85% transaksi e-commerce dilakukan via mobile. Website yang tidak mobile-optimized akan kehilangan majority traffic.</p>
      
      <h3>2. Same-Day Delivery Expectation</h3>
      <p>Especially di urban area, customer expect same-day atau next-day delivery. Ini mendorong seller untuk have local warehouse.</p>
      
      <h3>3. Personalized Experience</h3>
      <p>AI-driven product recommendation dan personalized marketing jadi standard expectation, bukan nice-to-have.</p>
      
      <h2>Peluang untuk UMKM</h2>
      <h3>1. Niche Market Domination</h3>
      <p>UMKM bisa dominasi niche market yang terlalu kecil untuk big players. Focus on specific demographics atau product categories.</p>
      
      <h3>2. Local Brand Preference</h3>
      <p>Tren "bangga produk lokal" membuka peluang besar untuk UMKM yang bisa storytelling dengan baik.</p>
      
      <h3>3. Agility Advantage</h3>
      <p>UMKM bisa adapt faster ke tren baru dibanding large corporations. Quick decision making jadi competitive advantage.</p>
      
      <h2>Technology Adoption untuk UMKM</h2>
      <h3>1. Cloud-Based Solutions</h3>
      <p>UMKM tidak perlu invest besar di IT infrastructure. Cloud solutions seperti WooCommerce hosting, payment gateway, dan CRM sudah affordable.</p>
      
      <h3>2. AI Tools untuk Marketing</h3>
      <p>AI tools untuk content creation, customer service chatbot, dan inventory forecasting semakin accessible untuk small business.</p>
      
      <h3>3. Social Media Automation</h3>
      <p>Tools seperti Hootsuite, Buffer, atau local solutions seperti Warung Pintar bisa automate social media marketing.</p>
      
      <h2>Funding dan Support Ecosystem</h2>
      <h3>1. Government Initiatives</h3>
      <p>Program seperti PaDi UMKM dan Kartu Prakerja provide training dan funding untuk digital transformation.</p>
      
      <h3>2. Fintech Partnership</h3>
      <p>Partnership dengan fintech untuk capital access, payment solutions, dan financial management tools.</p>
      
      <h3>3. E-commerce Platform Support</h3>
      <p>Marketplace dan platform seperti Storo.id offer comprehensive support untuk seller growth.</p>
      
      <h2>Challenges yang Harus Diantisipasi</h2>
      <h3>1. Increased Competition</h3>
      <p>Barrier to entry semakin rendah, artinya competition akan semakin intense. Differentiation jadi kunci survival.</p>
      
      <h3>2. Rising Customer Acquisition Cost</h3>
      <p>Digital advertising cost semakin mahal. UMKM harus focus pada organic growth dan customer retention.</p>
      
      <h3>3. Regulatory Compliance</h3>
      <p>Government regulation untuk e-commerce semakin strict. Tax compliance, business licensing, dan consumer protection law harus diperhatikan.</p>
      
      <h2>Action Plan untuk UMKM</h2>
      <h3>Phase 1: Foundation (Month 1-3)</h3>
      <ul>
        <li>Setup professional website dengan WooCommerce</li>
        <li>Optimize mobile experience</li>
        <li>Implement basic SEO</li>
        <li>Setup social media presence</li>
      </ul>
      
      <h3>Phase 2: Growth (Month 4-6)</h3>
      <ul>
        <li>Expand ke social commerce (TikTok Shop, Instagram)</li>
        <li>Implement email marketing automation</li>
        <li>Focus pada customer retention strategies</li>
        <li>Develop content marketing plan</li>
      </ul>
      
      <h3>Phase 3: Scale (Month 7-12)</h3>
      <ul>
        <li>Explore paid advertising di Google dan social media</li>
        <li>Consider influencer partnerships</li>
        <li>Implement advanced analytics</li>
        <li>Expand product line based on data insights</li>
      </ul>
      
      <h2>Peran Storo.id dalam Growth UMKM</h2>
      <p>Storo.id tidak hanya setup website, tapi juga provide guidance untuk digital transformation journey. Dari technical setup hingga marketing strategy, kami support UMKM untuk compete di digital economy.</p>
      
      <h2>Future Outlook</h2>
      <p>E-commerce Indonesia akan terus grow, tapi nature of competition akan berubah. UMKM yang embrace technology dan focus pada customer experience akan thrive di era digital ini.</p>
    `,
    author: "Tim Storo.id",
    date: "22 Februari 2024",
    category: "Insight",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop"
  }
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