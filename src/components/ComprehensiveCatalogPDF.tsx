import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  coverPage: {
    padding: 0,
    backgroundColor: '#6366f1',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  coverSubtitle: {
    fontSize: 24,
    marginBottom: 40,
    textAlign: 'center',
  },
  coverTagline: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 60,
    opacity: 0.9,
  },
  header: {
    marginBottom: 30,
    paddingBottom: 15,
    borderBottom: '2px solid #6366f1',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  titleHighlight: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 25,
    marginBottom: 15,
    paddingBottom: 8,
    borderBottom: '1px solid #e2e8f0',
  },
  packageContainer: {
    marginBottom: 20,
    border: '2px solid #e2e8f0',
    borderRadius: 8,
    padding: 18,
  },
  packageContainerPopular: {
    border: '2px solid #6366f1',
    backgroundColor: '#f8f9ff',
  },
  popularBadge: {
    backgroundColor: '#6366f1',
    color: '#ffffff',
    fontSize: 11,
    padding: '5 12',
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  packageName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 6,
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 6,
  },
  packageDesc: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 12,
  },
  featureList: {
    marginTop: 10,
  },
  feature: {
    fontSize: 10,
    color: '#334155',
    marginBottom: 7,
    paddingLeft: 15,
    lineHeight: 1.4,
  },
  infoBox: {
    backgroundColor: '#f8f9ff',
    padding: 15,
    borderRadius: 8,
    marginVertical: 15,
    border: '1px solid #e0e7ff',
  },
  infoBoxTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
  },
  infoBoxText: {
    fontSize: 10,
    color: '#334155',
    lineHeight: 1.5,
    marginBottom: 6,
  },
  comparisonTable: {
    marginVertical: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    padding: 10,
    borderRadius: 4,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e2e8f0',
    padding: 10,
  },
  tableCell: {
    fontSize: 9,
    color: '#334155',
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    paddingTop: 15,
    borderTop: '1px solid #e2e8f0',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 6,
  },
  contactText: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pageNumber: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 10,
  },
  bulletPoint: {
    fontSize: 10,
    color: '#10b981',
    marginRight: 5,
  },
});

const ComprehensiveCatalogPDF = () => {
  const packages = [
    {
      name: "Starter",
      price: "Rp 1.500.000",
      description: "Untuk bisnis yang baru mulai",
      features: [
        "✓ Setup webstore profesional + 100 SKU",
        "✓ Integrasi payment gateway & sistem ongkir",
        "✓ WooCommerce untuk order processing",
        "✓ Free support teknis 1 bulan",
        "✓ Training penggunaan dasar",
        "✓ Template design standar",
        "✓ Maintenance & hosting: Rp200rb/bulan"
      ],
      popular: false,
      bestFor: "Seller baru yang ingin mulai jualan online dengan modal terjangkau"
    },
    {
      name: "Pro",
      price: "Rp 2.500.000",
      description: "Paling populer untuk seller aktif",
      features: [
        "✓ Setup webstore profesional + 200 SKU",
        "✓ AI rewrite judul & deskripsi produk",
        "✓ WooCommerce untuk order processing",
        "✓ Free domain .com/.id selama 1 tahun",
        "✓ Template custom design",
        "✓ Priority support dengan response cepat",
        "✓ SEO optimization dasar",
        "✓ Maintenance & hosting: Rp200rb/bulan"
      ],
      popular: true,
      bestFor: "Seller aktif yang ingin scale up bisnis dengan tools profesional"
    },
    {
      name: "Advance",
      price: "Rp 3.500.000",
      description: "Untuk seller dengan volume tinggi",
      features: [
        "✓ Setup webstore profesional + 1000 SKU",
        "✓ AI rewrite judul & deskripsi produk",
        "✓ WooCommerce untuk order processing",
        "✓ Free domain .com/.id selama 1 tahun",
        "✓ Template custom design premium",
        "✓ Priority support dengan SLA response",
        "✓ Advanced SEO optimization",
        "✓ Integrasi marketplace (Tokopedia/Shopee)",
        "✓ Maintenance & hosting: Rp200rb/bulan"
      ],
      popular: false,
      bestFor: "Seller dengan volume tinggi yang butuh kapasitas lebih besar"
    },
    {
      name: "Flexible",
      price: "Rp 5.000.000",
      description: "Domain & hosting customer sendiri",
      features: [
        "✓ Setup di hosting customer sendiri",
        "✓ Domain customer sendiri",
        "✓ WooCommerce untuk order processing",
        "✓ Template custom design premium",
        "✓ Priority support",
        "✓ Full source code access",
        "✓ Tanpa biaya maintenance bulanan",
        "✓ Lifetime use dengan kontrol penuh"
      ],
      popular: false,
      bestFor: "Bisnis yang ingin full control atas hosting dan domain sendiri"
    },
    {
      name: "Custom",
      price: "Harga Custom",
      description: "Solusi khusus sesuai kebutuhan bisnis Anda",
      features: [
        "✓ SKU unlimited - tanpa batasan produk",
        "✓ Tema custom + integrasi iklan & analytics",
        "✓ WooCommerce dengan custom features",
        "✓ SLA support cepat (response 2 jam)",
        "✓ Marketing automation & email marketing",
        "✓ Dedicated account manager",
        "✓ Custom integrations sesuai kebutuhan",
        "✓ Konsultasi bisnis & strategi digital"
      ],
      popular: false,
      bestFor: "Enterprise atau bisnis besar dengan kebutuhan spesifik"
    }
  ];

  const additionalServices = [
    "Migrasi dari platform lain (Shopify, WordPress, dll)",
    "Custom plugin development",
    "Integrasi sistem ERP/Inventory",
    "Digital marketing & SEO services",
    "Content creation & product photography",
    "Training lanjutan untuk tim"
  ];

  const faqs = [
    {
      q: "Berapa lama proses setup?",
      a: "Setup webstore biasanya selesai dalam 3-7 hari kerja, tergantung kompleksitas dan jumlah SKU."
    },
    {
      q: "Apakah ada biaya tersembunyi?",
      a: "Tidak ada. Harga sudah all-in untuk setup. Biaya maintenance bulanan (jika ada) sudah dijelaskan di setiap paket."
    },
    {
      q: "Payment gateway apa yang didukung?",
      a: "Kami support Midtrans, Xendit, dan payment gateway lokal lainnya untuk pembayaran online yang aman."
    },
    {
      q: "Apakah bisa integrasi dengan marketplace?",
      a: "Ya, webstore bisa terintegrasi dengan Tokopedia, Shopee, dan marketplace lainnya untuk sinkronisasi stok."
    },
    {
      q: "Bagaimana dengan SEO?",
      a: "Semua template kami sudah SEO-friendly. Paket Pro ke atas include AI rewrite untuk optimasi konten."
    }
  ];

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View style={{ padding: 60, textAlign: 'center' }}>
          <Text style={{ fontSize: 64, fontWeight: 'bold', marginBottom: 30 }}>STORO.ID</Text>
          <Text style={styles.coverTitle}>Katalog Harga</Text>
          <Text style={styles.coverTitle}>& Paket Layanan</Text>
          <Text style={styles.coverSubtitle}>Solusi Webstore Profesional</Text>
          <Text style={styles.coverSubtitle}>untuk Seller Marketplace</Text>

          <View style={{ marginTop: 80, padding: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 }}>
            <Text style={{ fontSize: 16, marginBottom: 10 }}>Transformasi Digital Bisnis Anda</Text>
            <Text style={{ fontSize: 14, opacity: 0.9 }}>Dari Marketplace ke Webstore Profesional</Text>
          </View>

          <View style={{ position: 'absolute', bottom: 60, left: 60, right: 60 }}>
            <Text style={{ fontSize: 14, marginBottom: 8 }}>📱 WhatsApp: +62 856-4748-6700</Text>
            <Text style={{ fontSize: 14, marginBottom: 8 }}>🌐 www.storo.id</Text>
            <Text style={{ fontSize: 14 }}>✉️ info@storo.id</Text>
            <Text style={{ fontSize: 10, marginTop: 20, opacity: 0.8 }}>© 2025 Storo.id - All Rights Reserved</Text>
          </View>
        </View>
      </Page>

      {/* About Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Tentang <Text style={styles.titleHighlight}>Storo.id</Text></Text>
          <Text style={styles.subtitle}>Solusi webstore profesional untuk meningkatkan bisnis online Anda</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>🎯 Siapa Kami?</Text>
          <Text style={styles.infoBoxText}>
            Storo.id adalah penyedia layanan pembuatan webstore profesional yang fokus membantu seller
            marketplace untuk memiliki toko online mandiri dengan teknologi terkini.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>✨ Mengapa Memilih Storo.id?</Text>

        <View style={{ marginBottom: 15 }}>
          <Text style={styles.feature}>✓ Setup Cepat & Mudah - Webstore siap dalam hitungan hari</Text>
          <Text style={styles.feature}>✓ Teknologi Terkini - WooCommerce, AI, & tools modern</Text>
          <Text style={styles.feature}>✓ Support Berpengalaman - Tim ahli siap membantu Anda</Text>
          <Text style={styles.feature}>✓ Harga Transparan - Tidak ada biaya tersembunyi</Text>
          <Text style={styles.feature}>✓ Maintenance Rutin - Update & security patch berkala</Text>
          <Text style={styles.feature}>✓ Training Lengkap - Dokumentasi & video tutorial</Text>
          <Text style={styles.feature}>✓ Integrasi Marketplace - Sinkron stok dengan Tokopedia, Shopee, dll</Text>
          <Text style={styles.feature}>✓ SEO Friendly - Template optimized untuk search engine</Text>
        </View>

        <Text style={styles.sectionTitle}>🚀 Fitur Utama Platform</Text>

        <View style={{ marginBottom: 15 }}>
          <Text style={styles.feature}>• Responsive Design - Mobile, tablet, desktop friendly</Text>
          <Text style={styles.feature}>• Payment Gateway Integration - Midtrans, Xendit, dll</Text>
          <Text style={styles.feature}>• Shipping Integration - JNE, J&T, SiCepat, dll</Text>
          <Text style={styles.feature}>• Order Management System - Track & manage orders easily</Text>
          <Text style={styles.feature}>• Inventory Management - Stock control & alerts</Text>
          <Text style={styles.feature}>• Customer Management - Database & communication tools</Text>
          <Text style={styles.feature}>• Analytics Dashboard - Sales reports & insights</Text>
          <Text style={styles.feature}>• Marketing Tools - Discount, voucher, email marketing</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>💡 Cocok Untuk:</Text>
          <Text style={styles.infoBoxText}>✓ Seller marketplace yang ingin punya toko online sendiri</Text>
          <Text style={styles.infoBoxText}>✓ Bisnis offline yang ingin ekspansi ke online</Text>
          <Text style={styles.infoBoxText}>✓ Brand owner yang ingin kontrol penuh atas toko online</Text>
          <Text style={styles.infoBoxText}>✓ Reseller & dropshipper yang ingin scale up</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Untuk informasi lebih lanjut, hubungi kami</Text>
          <Text style={styles.contactText}>WhatsApp: +62 856-4748-6700</Text>
          <Text style={styles.contactText}>www.storo.id</Text>
          <Text style={styles.pageNumber}>Halaman 2</Text>
        </View>
      </Page>

      {/* Pricing Pages */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Paket Harga <Text style={styles.titleHighlight}>Transparan</Text></Text>
          <Text style={styles.subtitle}>Pilih paket yang sesuai dengan kebutuhan bisnis Anda</Text>
        </View>

        {packages.slice(0, 2).map((pkg, index) => (
          <View key={index} style={[styles.packageContainer, pkg.popular && styles.packageContainerPopular]}>
            {pkg.popular && <Text style={styles.popularBadge}>⭐ PALING POPULER</Text>}
            <Text style={styles.packageName}>{pkg.name}</Text>
            <Text style={styles.packagePrice}>{pkg.price}</Text>
            <Text style={styles.packageDesc}>{pkg.description}</Text>

            <View style={styles.featureList}>
              {pkg.features.map((feature, fIndex) => (
                <Text key={fIndex} style={styles.feature}>{feature}</Text>
              ))}
            </View>

            <View style={{ marginTop: 10, padding: 8, backgroundColor: '#f1f5f9', borderRadius: 4 }}>
              <Text style={{ fontSize: 9, color: '#475569', fontStyle: 'italic' }}>
                💡 {pkg.bestFor}
              </Text>
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Hubungi kami untuk konsultasi gratis</Text>
          <Text style={styles.contactText}>WhatsApp: +62 856-4748-6700</Text>
          <Text style={styles.contactText}>www.storo.id</Text>
          <Text style={styles.pageNumber}>Halaman 3</Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Paket Harga <Text style={styles.titleHighlight}>Transparan</Text></Text>
          <Text style={styles.subtitle}>Paket lanjutan untuk kebutuhan spesifik</Text>
        </View>

        {packages.slice(2, 5).map((pkg, index) => (
          <View key={index} style={styles.packageContainer}>
            <Text style={styles.packageName}>{pkg.name}</Text>
            <Text style={styles.packagePrice}>{pkg.price}</Text>
            <Text style={styles.packageDesc}>{pkg.description}</Text>

            <View style={styles.featureList}>
              {pkg.features.map((feature, fIndex) => (
                <Text key={fIndex} style={styles.feature}>{feature}</Text>
              ))}
            </View>

            <View style={{ marginTop: 10, padding: 8, backgroundColor: '#f1f5f9', borderRadius: 4 }}>
              <Text style={{ fontSize: 9, color: '#475569', fontStyle: 'italic' }}>
                💡 {pkg.bestFor}
              </Text>
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Hubungi kami untuk konsultasi gratis</Text>
          <Text style={styles.contactText}>WhatsApp: +62 856-4748-6700</Text>
          <Text style={styles.contactText}>www.storo.id</Text>
          <Text style={styles.pageNumber}>Halaman 4</Text>
        </View>
      </Page>

      {/* Comparison Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Perbandingan <Text style={styles.titleHighlight}>Paket</Text></Text>
          <Text style={styles.subtitle}>Temukan paket yang paling sesuai untuk Anda</Text>
        </View>

        <View style={styles.comparisonTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Fitur</Text>
            <Text style={styles.tableHeaderText}>Starter</Text>
            <Text style={styles.tableHeaderText}>Pro</Text>
            <Text style={styles.tableHeaderText}>Advance</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1.5 }]}>Jumlah SKU</Text>
            <Text style={styles.tableCell}>100</Text>
            <Text style={styles.tableCell}>200</Text>
            <Text style={styles.tableCell}>1000</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1.5 }]}>AI Rewrite Produk</Text>
            <Text style={styles.tableCell}>-</Text>
            <Text style={styles.tableCell}>✓</Text>
            <Text style={styles.tableCell}>✓</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1.5 }]}>Free Domain</Text>
            <Text style={styles.tableCell}>-</Text>
            <Text style={styles.tableCell}>1 Tahun</Text>
            <Text style={styles.tableCell}>1 Tahun</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1.5 }]}>Custom Design</Text>
            <Text style={styles.tableCell}>Standard</Text>
            <Text style={styles.tableCell}>✓</Text>
            <Text style={styles.tableCell}>Premium</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1.5 }]}>Support</Text>
            <Text style={styles.tableCell}>1 Bulan</Text>
            <Text style={styles.tableCell}>Priority</Text>
            <Text style={styles.tableCell}>Priority SLA</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1.5 }]}>SEO Optimization</Text>
            <Text style={styles.tableCell}>Basic</Text>
            <Text style={styles.tableCell}>Basic</Text>
            <Text style={styles.tableCell}>Advanced</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1.5 }]}>Marketplace Integration</Text>
            <Text style={styles.tableCell}>-</Text>
            <Text style={styles.tableCell}>-</Text>
            <Text style={styles.tableCell}>✓</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1.5, fontWeight: 'bold' }]}>Harga</Text>
            <Text style={[styles.tableCell, { fontWeight: 'bold', color: '#6366f1' }]}>1.5 Jt</Text>
            <Text style={[styles.tableCell, { fontWeight: 'bold', color: '#6366f1' }]}>2.5 Jt</Text>
            <Text style={[styles.tableCell, { fontWeight: 'bold', color: '#6366f1' }]}>3.5 Jt</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>📝 Catatan Penting:</Text>
          <Text style={styles.infoBoxText}>• Semua harga sudah termasuk PPN</Text>
          <Text style={styles.infoBoxText}>• Maintenance & hosting Rp200rb/bulan (Starter, Pro, Advance)</Text>
          <Text style={styles.infoBoxText}>• Paket Flexible & Custom memiliki ketentuan berbeda</Text>
          <Text style={styles.infoBoxText}>• Gratis konsultasi sebelum memilih paket</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Butuh bantuan memilih paket?</Text>
          <Text style={styles.contactText}>WhatsApp: +62 856-4748-6700</Text>
          <Text style={styles.contactText}>www.storo.id</Text>
          <Text style={styles.pageNumber}>Halaman 5</Text>
        </View>
      </Page>

      {/* Additional Services */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Layanan <Text style={styles.titleHighlight}>Tambahan</Text></Text>
          <Text style={styles.subtitle}>Maksimalkan potensi webstore Anda</Text>
        </View>

        <Text style={styles.sectionTitle}>🔧 Add-on Services</Text>

        <View style={{ marginBottom: 20 }}>
          {additionalServices.map((service, index) => (
            <Text key={index} style={[styles.feature, { fontSize: 11, marginBottom: 10 }]}>
              ✓ {service}
            </Text>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>💼 Layanan Konsultasi</Text>
          <Text style={styles.infoBoxText}>
            Tim expert kami siap membantu Anda dengan konsultasi bisnis, strategi digital marketing,
            optimasi konversi, dan analisis performa webstore.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>📞 Proses Pemesanan</Text>

        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.feature, { fontSize: 11, marginBottom: 12 }]}>
            1️⃣ Konsultasi awal via WhatsApp untuk memahami kebutuhan bisnis Anda
          </Text>
          <Text style={[styles.feature, { fontSize: 11, marginBottom: 12 }]}>
            2️⃣ Rekomendasi paket & diskusi fitur yang dibutuhkan
          </Text>
          <Text style={[styles.feature, { fontSize: 11, marginBottom: 12 }]}>
            3️⃣ Agreement & pembayaran (DP 50%)
          </Text>
          <Text style={[styles.feature, { fontSize: 11, marginBottom: 12 }]}>
            4️⃣ Setup & development webstore (3-7 hari kerja)
          </Text>
          <Text style={[styles.feature, { fontSize: 11, marginBottom: 12 }]}>
            5️⃣ Review & revisi sesuai feedback
          </Text>
          <Text style={[styles.feature, { fontSize: 11, marginBottom: 12 }]}>
            6️⃣ Training penggunaan platform
          </Text>
          <Text style={[styles.feature, { fontSize: 11, marginBottom: 12 }]}>
            7️⃣ Pelunasan & handover
          </Text>
          <Text style={[styles.feature, { fontSize: 11, marginBottom: 12 }]}>
            8️⃣ Ongoing support sesuai paket
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>🎁 Special Promo</Text>
          <Text style={styles.infoBoxText}>
            Dapatkan diskon spesial untuk pemesanan paket Pro atau lebih tinggi!
            Hubungi kami untuk informasi promo terbaru.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Siap memulai? Hubungi kami sekarang!</Text>
          <Text style={styles.contactText}>WhatsApp: +62 856-4748-6700</Text>
          <Text style={styles.contactText}>www.storo.id</Text>
          <Text style={styles.pageNumber}>Halaman 6</Text>
        </View>
      </Page>

      {/* FAQ Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Pertanyaan <Text style={styles.titleHighlight}>Umum</Text></Text>
          <Text style={styles.subtitle}>FAQ - Frequently Asked Questions</Text>
        </View>

        {faqs.map((faq, index) => (
          <View key={index} style={{ marginBottom: 18 }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1e293b', marginBottom: 6 }}>
              Q: {faq.q}
            </Text>
            <Text style={{ fontSize: 10, color: '#475569', lineHeight: 1.5, paddingLeft: 12 }}>
              A: {faq.a}
            </Text>
          </View>
        ))}

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>📋 Garansi & Support</Text>
          <Text style={styles.infoBoxText}>
            ✓ Garansi bug-free 30 hari setelah handover
          </Text>
          <Text style={styles.infoBoxText}>
            ✓ Free minor update selama periode maintenance
          </Text>
          <Text style={styles.infoBoxText}>
            ✓ Dokumentasi lengkap & video tutorial
          </Text>
          <Text style={styles.infoBoxText}>
            ✓ Support via WhatsApp, email, atau video call
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>💳 Metode Pembayaran</Text>
          <Text style={styles.infoBoxText}>
            Transfer Bank (BCA, Mandiri, BNI), E-wallet (OVO, GoPay, Dana), atau Virtual Account
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Masih ada pertanyaan? Jangan ragu untuk bertanya!</Text>
          <Text style={styles.contactText}>WhatsApp: +62 856-4748-6700</Text>
          <Text style={styles.contactText}>Email: info@storo.id</Text>
          <Text style={styles.contactText}>www.storo.id</Text>
          <Text style={styles.pageNumber}>Halaman 7</Text>
        </View>
      </Page>

      {/* Back Cover */}
      <Page size="A4" style={styles.coverPage}>
        <View style={{ padding: 60, textAlign: 'center' }}>
          <Text style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 40 }}>
            Siap Memulai?
          </Text>

          <Text style={{ fontSize: 20, marginBottom: 60, lineHeight: 1.6 }}>
            Transformasi bisnis online Anda dimulai dari sini.{'\n'}
            Hubungi kami untuk konsultasi gratis!
          </Text>

          <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: 30, borderRadius: 16, marginBottom: 50 }}>
            <Text style={{ fontSize: 18, marginBottom: 20, fontWeight: 'bold' }}>📱 Kontak Kami</Text>
            <Text style={{ fontSize: 24, marginBottom: 15, fontWeight: 'bold' }}>+62 856-4748-6700</Text>
            <Text style={{ fontSize: 18, marginBottom: 10 }}>www.storo.id</Text>
            <Text style={{ fontSize: 18 }}>info@storo.id</Text>
          </View>

          <View style={{ marginTop: 60 }}>
            <Text style={{ fontSize: 14, marginBottom: 15 }}>Follow Us:</Text>
            <Text style={{ fontSize: 14, marginBottom: 8 }}>Instagram: @storo.id</Text>
            <Text style={{ fontSize: 14, marginBottom: 8 }}>Facebook: Storo.id</Text>
            <Text style={{ fontSize: 14 }}>LinkedIn: Storo Indonesia</Text>
          </View>

          <View style={{ position: 'absolute', bottom: 40, left: 60, right: 60 }}>
            <Text style={{ fontSize: 10, opacity: 0.8 }}>
              © 2025 Storo.id - Solusi Webstore untuk Seller Marketplace{'\n'}
              All Rights Reserved
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ComprehensiveCatalogPDF;
