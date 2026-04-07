import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const BRAND = '#4F46E5';
const BRAND_LIGHT = '#EEF2FF';
const BRAND_DARK = '#3730A3';
const ACCENT = '#06B6D4';
const DARK = '#0F172A';
const MUTED = '#64748B';
const BORDER = '#E2E8F0';
const WHITE = '#FFFFFF';
const SUCCESS = '#10B981';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: WHITE,
    paddingBottom: 60,
  },

  // ── COVER PAGE ──
  coverPage: {
    fontFamily: 'Helvetica',
    backgroundColor: WHITE,
  },
  coverTopBar: {
    backgroundColor: BRAND,
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 50,
    alignItems: 'center',
  },
  coverBrand: {
    fontSize: 11,
    color: '#C7D2FE',
    letterSpacing: 3,
    marginBottom: 20,
  },
  coverTitle: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    marginBottom: 10,
    textAlign: 'center',
  },
  coverSubtitle: {
    fontSize: 14,
    color: '#C7D2FE',
    textAlign: 'center',
  },
  coverBody: {
    paddingHorizontal: 50,
    paddingTop: 40,
  },
  coverTagline: {
    fontSize: 13,
    color: DARK,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 1.6,
  },
  coverHighlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  coverHighlightBox: {
    flex: 1,
    backgroundColor: BRAND_LIGHT,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  coverHighlightNum: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: BRAND,
    marginBottom: 4,
  },
  coverHighlightLabel: {
    fontSize: 9,
    color: MUTED,
    textAlign: 'center',
  },
  coverDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 24,
  },
  coverFooterBox: {
    backgroundColor: DARK,
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  coverFooterTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    marginBottom: 8,
  },
  coverFooterContact: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
  },
  coverFooterUrl: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: ACCENT,
    marginTop: 4,
  },
  coverYear: {
    fontSize: 9,
    color: MUTED,
    textAlign: 'center',
    marginTop: 16,
  },

  // ── PAGE HEADER ──
  pageHeader: {
    backgroundColor: BRAND,
    paddingHorizontal: 40,
    paddingTop: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  pageHeaderTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
  },
  pageHeaderSub: {
    fontSize: 10,
    color: '#C7D2FE',
    marginTop: 3,
  },
  pageHeaderBrand: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    opacity: 0.7,
  },

  // ── CONTENT AREA ──
  content: {
    paddingHorizontal: 30,
    paddingTop: 24,
  },

  // ── PACKAGE CARD ──
  cardRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  card: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 8,
    marginHorizontal: 4,
    overflow: 'hidden',
  },
  cardPopular: {
    borderColor: BRAND,
  },
  cardHeaderBar: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: BORDER,
  },
  cardHeaderBarPopular: {
    backgroundColor: BRAND,
    borderBottomColor: BRAND,
  },
  popularBadge: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    backgroundColor: ACCENT,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  cardName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
  },
  cardNamePopular: {
    color: WHITE,
  },
  cardDesc: {
    fontSize: 8,
    color: MUTED,
    marginTop: 2,
  },
  cardDescPopular: {
    color: '#C7D2FE',
  },
  cardBody: {
    padding: 14,
  },
  cardPrice: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: BRAND,
    marginBottom: 3,
  },
  cardPriceSub: {
    fontSize: 8,
    color: MUTED,
    marginBottom: 10,
  },
  featureDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginBottom: 10,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 5,
    alignItems: 'flex-start',
  },
  featureDot: {
    width: 12,
    fontSize: 8,
    color: SUCCESS,
    fontFamily: 'Helvetica-Bold',
    marginRight: 4,
    marginTop: 1,
  },
  featureText: {
    flex: 1,
    fontSize: 8,
    color: '#334155',
    lineHeight: 1.4,
  },

  // ── WHY STORO SECTION ──
  whyBox: {
    backgroundColor: BRAND_LIGHT,
    borderRadius: 8,
    padding: 18,
    marginTop: 4,
    marginBottom: 12,
  },
  whyTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_DARK,
    marginBottom: 12,
    textAlign: 'center',
  },
  whyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  whyItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 7,
    paddingRight: 10,
  },
  whyDot: {
    fontSize: 10,
    color: BRAND,
    fontFamily: 'Helvetica-Bold',
    marginRight: 6,
    marginTop: -1,
  },
  whyText: {
    flex: 1,
    fontSize: 9,
    color: '#3730A3',
    lineHeight: 1.4,
  },

  // ── CTA BOX ──
  ctaBox: {
    backgroundColor: DARK,
    borderRadius: 8,
    padding: 18,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    marginBottom: 4,
  },
  ctaSub: {
    fontSize: 9,
    color: '#94A3B8',
    marginBottom: 12,
  },
  ctaContactRow: {
    flexDirection: 'row',
  },
  ctaContactItem: {
    alignItems: 'center',
    marginHorizontal: 12,
  },
  ctaContactLabel: {
    fontSize: 8,
    color: '#64748B',
    marginBottom: 2,
  },
  ctaContactValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: ACCENT,
  },

  // ── PAGE FOOTER ──
  pageFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    fontSize: 8,
    color: MUTED,
  },
  footerRight: {
    fontSize: 8,
    color: MUTED,
  },
  footerCenter: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: BRAND,
  },
});

// ── Data ──────────────────────────────────────────────────
const packages = [
  {
    name: 'Starter',
    price: 'Rp 1.500.000',
    setupNote: 'Biaya setup sekali bayar',
    description: 'Untuk bisnis yang baru mulai',
    features: [
      'Setup webstore + 100 SKU',
      'Integrasi payment & ongkir',
      'WooCommerce order processing',
      'Free support 1 bulan',
      'Training penggunaan dasar',
      'Maintenance: Rp200rb/bulan',
    ],
    popular: false,
  },
  {
    name: 'Pro',
    price: 'Rp 2.500.000',
    setupNote: 'Biaya setup sekali bayar',
    description: 'Paling populer untuk seller aktif',
    features: [
      'Setup webstore + 200 SKU',
      'AI rewrite judul & deskripsi produk',
      'WooCommerce order processing',
      'Free domain .com 1 tahun',
      'Template custom design',
      'Priority support 3 bulan',
      'Maintenance: Rp200rb/bulan',
    ],
    popular: true,
  },
  {
    name: 'Advance',
    price: 'Rp 3.500.000',
    setupNote: 'Biaya setup sekali bayar',
    description: 'Untuk seller volume tinggi',
    features: [
      'Setup webstore + 200+ SKU',
      'AI rewrite judul & deskripsi produk',
      'WooCommerce order processing',
      'Free domain .com 1 tahun',
      'Template custom design premium',
      'Priority support 6 bulan',
      'Maintenance: Rp200rb/bulan',
    ],
    popular: false,
  },
  {
    name: 'Flexible',
    price: 'Rp 5.000.000',
    setupNote: 'Domain & hosting milik customer',
    description: 'Solusi dengan aset di tangan Anda',
    features: [
      'Setup di hosting customer sendiri',
      'Domain customer sendiri',
      'WooCommerce + custom features',
      'Template custom design premium',
      'Priority support 6 bulan',
      'Tanpa biaya maintenance bulanan',
      'Lifetime use — aset milik Anda',
    ],
    popular: false,
  },
  {
    name: 'Custom / Enterprise',
    price: 'Harga Menyesuaikan',
    setupNote: 'Konsultasi gratis terlebih dahulu',
    description: 'Solusi skala besar & kebutuhan khusus',
    features: [
      'SKU unlimited tanpa batas',
      'Tema custom + integrasi iklan',
      'WooCommerce dengan custom features',
      'SLA support cepat (maks. 2 jam)',
      'Marketing automation setup',
      'Dedicated account manager',
    ],
    popular: false,
  },
];

// ── Helpers ───────────────────────────────────────────────
const Feature = ({ text }: { text: string }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureDot}>{'>'}</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const PageFooter = ({ page, total }: { page: number; total: number }) => (
  <View style={styles.pageFooter}>
    <Text style={styles.footerLeft}>{'(c)'} 2025 Storo.id — Powered by VenteraAI</Text>
    <Text style={styles.footerCenter}>storo.id</Text>
    <Text style={styles.footerRight}>Halaman {page} / {total}</Text>
  </View>
);

const PackageCard = ({ pkg }: { pkg: (typeof packages)[0] }) => (
  <View style={[styles.card, pkg.popular ? styles.cardPopular : {}]}>
    <View style={[styles.cardHeaderBar, pkg.popular ? styles.cardHeaderBarPopular : {}]}>
      {pkg.popular && <Text style={styles.popularBadge}>PALING POPULER</Text>}
      <Text style={[styles.cardName, pkg.popular ? styles.cardNamePopular : {}]}>{pkg.name}</Text>
      <Text style={[styles.cardDesc, pkg.popular ? styles.cardDescPopular : {}]}>{pkg.description}</Text>
    </View>
    <View style={styles.cardBody}>
      <Text style={styles.cardPrice}>{pkg.price}</Text>
      <Text style={styles.cardPriceSub}>{pkg.setupNote}</Text>
      <View style={styles.featureDivider} />
      {pkg.features.map((f, i) => <Feature key={i} text={f} />)}
    </View>
  </View>
);

// ── Main Component ────────────────────────────────────────
const CatalogPDF = () => (
  <Document>

    {/* PAGE 1: COVER */}
    <Page size="A4" style={styles.coverPage}>
      <View style={styles.coverTopBar}>
        <Text style={styles.coverBrand}>STORO.ID — POWERED BY VENTEAAI</Text>
        <Text style={styles.coverTitle}>Katalog Layanan{'\n'}& Harga Paket</Text>
        <Text style={styles.coverSubtitle}>Solusi Webstore Profesional untuk Seller Marketplace</Text>
      </View>

      <View style={styles.coverBody}>
        <Text style={styles.coverTagline}>
          Dari Shopee ke Webstore Sendiri — Cepat, Mudah, dan Terjangkau.{'\n'}
          Bangun brand online Anda hari ini bersama Storo.id.
        </Text>

        <View style={styles.coverHighlightRow}>
          {[
            { num: '500+', label: 'Seller Aktif\nBergabung' },
            { num: '1–3',  label: 'Hari Kerja\nSetup Selesai' },
            { num: '10K+', label: 'Produk Bisa\nDiimport' },
            { num: '24/7', label: 'Support Tim\nBerpengalaman' },
          ].map((item, i) => (
            <View key={i} style={styles.coverHighlightBox}>
              <Text style={styles.coverHighlightNum}>{item.num}</Text>
              <Text style={styles.coverHighlightLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.coverDivider} />

        <View style={styles.coverFooterBox}>
          <Text style={styles.coverFooterTitle}>Hubungi Kami Sekarang</Text>
          <Text style={styles.coverFooterContact}>WhatsApp: +62 851-4841-6700</Text>
          <Text style={styles.coverFooterContact}>Email: info@storo.id</Text>
          <Text style={styles.coverFooterUrl}>www.storo.id</Text>
        </View>

        <Text style={styles.coverYear}>
          Dokumen berlaku per Januari 2025 · Harga dapat berubah sewaktu-waktu
        </Text>
      </View>
    </Page>

    {/* PAGE 2: STARTER, PRO, ADVANCE */}
    <Page size="A4" style={styles.page}>
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageHeaderTitle}>Paket Layanan</Text>
          <Text style={styles.pageHeaderSub}>Pilih paket yang sesuai skala bisnis Anda</Text>
        </View>
        <Text style={styles.pageHeaderBrand}>STORO.ID</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.cardRow}>
          {packages.slice(0, 3).map((pkg, i) => (
            <PackageCard key={i} pkg={pkg} />
          ))}
        </View>

        <View style={styles.whyBox}>
          <Text style={styles.whyTitle}>Semua Paket Sudah Termasuk</Text>
          <View style={styles.whyRow}>
            {[
              'Import produk dari file Excel',
              'Integrasi payment gateway (Midtrans)',
              'Kalkulasi ongkir real-time',
              'SSL Certificate (HTTPS)',
              'Dashboard WooCommerce',
              'Training & onboarding awal',
            ].map((item, i) => (
              <View key={i} style={styles.whyItem}>
                <Text style={styles.whyDot}>+</Text>
                <Text style={styles.whyText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <PageFooter page={2} total={3} />
    </Page>

    {/* PAGE 3: FLEXIBLE, CUSTOM + WHY + CTA */}
    <Page size="A4" style={styles.page}>
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageHeaderTitle}>Paket Fleksibel & Enterprise</Text>
          <Text style={styles.pageHeaderSub}>Solusi untuk kebutuhan lebih besar & khusus</Text>
        </View>
        <Text style={styles.pageHeaderBrand}>STORO.ID</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.cardRow}>
          {packages.slice(3, 5).map((pkg, i) => (
            <PackageCard key={i} pkg={pkg} />
          ))}
        </View>

        <View style={styles.whyBox}>
          <Text style={styles.whyTitle}>Mengapa Memilih Storo.id?</Text>
          <View style={styles.whyRow}>
            {[
              'Setup cepat — webstore siap 1–3 hari kerja',
              'Import ribuan produk dari Excel sekali klik',
              'Teknologi WooCommerce yang terpercaya',
              'Harga transparan, tanpa biaya tersembunyi',
              'Tim support berpengalaman & responsif',
              'Aset webstore sepenuhnya milik Anda',
            ].map((item, i) => (
              <View key={i} style={styles.whyItem}>
                <Text style={styles.whyDot}>*</Text>
                <Text style={styles.whyText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.ctaBox}>
          <Text style={styles.ctaTitle}>Siap Membangun Webstore Anda?</Text>
          <Text style={styles.ctaSub}>Konsultasi gratis, tanpa komitmen. Tim kami siap membantu.</Text>
          <View style={styles.ctaContactRow}>
            {[
              { label: 'WhatsApp', value: '+62 851-4841-6700' },
              { label: 'Email',    value: 'info@storo.id' },
              { label: 'Website',  value: 'www.storo.id' },
            ].map((c, i) => (
              <View key={i} style={styles.ctaContactItem}>
                <Text style={styles.ctaContactLabel}>{c.label}</Text>
                <Text style={styles.ctaContactValue}>{c.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <PageFooter page={3} total={3} />
    </Page>

  </Document>
);

export default CatalogPDF;
