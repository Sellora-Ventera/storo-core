import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import DownloadCatalog from "./DownloadCatalog";

const Pricing = () => {
  const packages = [
    {
      name: "Starter",
      price: "Rp1,5 juta",
      description: "Untuk bisnis yang baru mulai",
      features: [
        "Setup webstore + 100 SKU",
        "Integrasi payment & ongkir",
        "WooCommerce untuk order processing",
        "Free support 1 bulan",
        "Training penggunaan dasar",
        "Maintenance & hosting: Rp200rb/bulan",
      ],
      popular: false,
    },
    {
      name: "Pro",
      price: "Rp2,5 juta",
      description: "Paling populer untuk seller aktif",
      features: [
        "Setup webstore + 200 SKU",
        "AI rewrite judul & deskripsi produk",
        "WooCommerce untuk order processing",
        "Free domain 1 tahun",
        "Template custom design",
        "Priority support",
        "Maintenance & hosting: Rp200rb/bulan",
      ],
      popular: true,
    },
    {
      name: "Advance",
      price: "Rp3,5 juta",
      description: "Untuk seller dengan volume tinggi",
      features: [
        "Setup webstore + 1000 SKU",
        "AI rewrite judul & deskripsi produk",
        "WooCommerce untuk order processing",
        "Free domain 1 tahun",
        "Template custom design",
        "Priority support",
        "Maintenance & hosting: Rp200rb/bulan",
      ],
      popular: false,
    },
    {
      name: "Flexible",
      price: "Rp5 juta",
      description: "Domain & hosting customer sendiri",
      features: [
        "Setup di hosting customer",
        "Domain customer sendiri",
        "WooCommerce untuk order processing",
        "Template custom design",
        "Priority support",
        "Tanpa biaya maintenance",
        "Lifetime use",
      ],
      popular: false,
    },
    {
      name: "Custom",
      price: "Custom Price",
      description: "Solusi khusus sesuai kebutuhan",
      features: [
        "SKU unlimited",
        "Tema custom + integrasi iklan",
        "WooCommerce dengan custom features",
        "SLA support cepat (2 jam)",
        "Marketing automation",
        "Dedicated account manager",
      ],
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="section-padding bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Paket Harga <span className="text-primary">Transparan</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Pilih paket yang sesuai dengan kebutuhan bisnis Anda
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 max-w-7xl mx-auto pt-6">
          {packages.map((pkg, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-xl shadow-lg p-8 ${pkg.popular ? "ring-2 ring-primary" : ""}`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-primary text-white px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap">
                    Paling Populer
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                <div className="text-3xl font-bold text-primary mb-2">{pkg.price}</div>
                <p className="text-gray-600">{pkg.description}</p>
              </div>

              <div className="space-y-4 mb-8">
                {pkg.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                className={`w-full ${pkg.popular ? "btn-hero" : "btn-outline"}`}
                  onClick={() =>
                  window.open(
                    `https://wa.me/6285148416700?text=Halo%20Storo.id,%20saya%20tertarik%20dengan%20paket%20${pkg.name}`,
                    "_blank",
                  )
                }
              >
                Pilih Paket {pkg.name}
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button
            size="lg"
            className="btn-hero"
            onClick={() =>
              window.open("https://wa.me/6285148416700?text=Halo%20Storo.id,%20saya%20mau%20pesan%20webstore", "_blank")
            }
          >
            Pesan Sekarang via WhatsApp
          </Button>
          <DownloadCatalog />
        </div>
      </div>
    </section>
  );
};

export default Pricing;
