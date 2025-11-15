import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 15,
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
    fontSize: 12,
    color: '#64748b',
    marginBottom: 30,
  },
  packageContainer: {
    marginBottom: 20,
    border: '2px solid #e2e8f0',
    borderRadius: 8,
    padding: 15,
  },
  packageContainerPopular: {
    border: '2px solid #6366f1',
    backgroundColor: '#f8f9ff',
  },
  popularBadge: {
    backgroundColor: '#6366f1',
    color: '#ffffff',
    fontSize: 10,
    padding: '4 10',
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  packageName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  packagePrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 5,
  },
  packageDesc: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 12,
  },
  featureList: {
    marginTop: 8,
  },
  feature: {
    fontSize: 10,
    color: '#334155',
    marginBottom: 6,
    paddingLeft: 15,
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: '1px solid #e2e8f0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 15,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
});

const CatalogPDF = () => {
  const packages = [
    {
      name: "Starter",
      price: "Rp1,5 juta",
      description: "Untuk bisnis yang baru mulai",
      features: [
        "✓ Setup webstore + 100 SKU",
        "✓ Integrasi payment & ongkir",
        "✓ WooCommerce untuk order processing",
        "✓ Free support 1 bulan",
        "✓ Training penggunaan dasar",
        "✓ Maintenance & hosting: Rp200rb/bulan"
      ],
      popular: false
    },
    {
      name: "Pro",
      price: "Rp2,5 juta",
      description: "Paling populer untuk seller aktif",
      features: [
        "✓ Setup webstore + 200 SKU",
        "✓ AI rewrite judul & deskripsi produk",
        "✓ WooCommerce untuk order processing",
        "✓ Free domain 1 tahun",
        "✓ Template custom design",
        "✓ Priority support",
        "✓ Maintenance & hosting: Rp200rb/bulan"
      ],
      popular: true
    },
    {
      name: "Advance",
      price: "Rp3,5 juta",
      description: "Untuk seller dengan volume tinggi",
      features: [
        "✓ Setup webstore + 200+ SKU",
        "✓ AI rewrite judul & deskripsi produk",
        "✓ WooCommerce untuk order processing",
        "✓ Free domain 1 tahun",
        "✓ Template custom design",
        "✓ Priority support",
        "✓ Maintenance & hosting: Rp200rb/bulan"
      ],
      popular: false
    },
    {
      name: "Flexible",
      price: "Rp5 juta",
      description: "Domain & hosting customer sendiri",
      features: [
        "✓ Setup di hosting customer",
        "✓ Domain customer sendiri",
        "✓ WooCommerce untuk order processing",
        "✓ Template custom design",
        "✓ Priority support",
        "✓ Tanpa biaya maintenance",
        "✓ Lifetime use"
      ],
      popular: false
    },
    {
      name: "Custom",
      price: "Custom Price",
      description: "Solusi khusus sesuai kebutuhan",
      features: [
        "✓ SKU unlimited",
        "✓ Tema custom + integrasi iklan",
        "✓ WooCommerce dengan custom features",
        "✓ SLA support cepat (2 jam)",
        "✓ Marketing automation",
        "✓ Dedicated account manager"
      ],
      popular: false
    }
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Paket Harga <Text style={styles.titleHighlight}>Transparan</Text></Text>
          <Text style={styles.subtitle}>Pilih paket yang sesuai dengan kebutuhan bisnis Anda</Text>
        </View>

        {packages.slice(0, 3).map((pkg, index) => (
          <View key={index} style={[styles.packageContainer, pkg.popular && styles.packageContainerPopular]}>
            {pkg.popular && <Text style={styles.popularBadge}>Paling Populer</Text>}
            <Text style={styles.packageName}>{pkg.name}</Text>
            <Text style={styles.packagePrice}>{pkg.price}</Text>
            <Text style={styles.packageDesc}>{pkg.description}</Text>
            <View style={styles.featureList}>
              {pkg.features.map((feature, fIndex) => (
                <Text key={fIndex} style={styles.feature}>{feature}</Text>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Hubungi kami untuk informasi lebih lanjut</Text>
          <Text style={styles.contactText}>WhatsApp: +62 851-4841-6700</Text>
          <Text style={styles.contactText}>www.storo.id</Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Paket Harga <Text style={styles.titleHighlight}>Transparan</Text></Text>
          <Text style={styles.subtitle}>Pilih paket yang sesuai dengan kebutuhan bisnis Anda</Text>
        </View>

        {packages.slice(3, 5).map((pkg, index) => (
          <View key={index} style={styles.packageContainer}>
            <Text style={styles.packageName}>{pkg.name}</Text>
            <Text style={styles.packagePrice}>{pkg.price}</Text>
            <Text style={styles.packageDesc}>{pkg.description}</Text>
            <View style={styles.featureList}>
              {pkg.features.map((feature, fIndex) => (
                <Text key={fIndex} style={styles.feature}>{feature}</Text>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={{ padding: 15, backgroundColor: '#f8f9ff', borderRadius: 8, marginTop: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 10 }}>
            Mengapa Memilih Storo.id?
          </Text>
          <Text style={styles.feature}>✓ Setup cepat dan mudah - webstore siap dalam hitungan hari</Text>
          <Text style={styles.feature}>✓ Teknologi terkini dengan WooCommerce dan AI</Text>
          <Text style={styles.feature}>✓ Support tim berpengalaman</Text>
          <Text style={styles.feature}>✓ Harga transparan tanpa biaya tersembunyi</Text>
          <Text style={styles.feature}>✓ Maintenance dan update rutin</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Siap memulai bisnis online Anda?</Text>
          <Text style={styles.contactText}>WhatsApp: +62 851-4841-6700</Text>
          <Text style={styles.contactText}>Email: info@storo.id</Text>
          <Text style={styles.contactText}>www.storo.id</Text>
          <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 15 }}>
            © 2025 Storo.id - Solusi Webstore untuk Seller Marketplace
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default CatalogPDF;
