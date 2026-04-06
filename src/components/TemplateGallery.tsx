import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

const templates = [
  {
    name: "Modern Minimalist",
    description: "Bersih, cepat, dan elegan. Cocok untuk fashion, lifestyle, dan produk premium.",
    badge: "Populer",
    badgeColor: "bg-primary/10 text-primary",
    accentColor: "from-primary to-primary/70",
    features: ["Dark mode ready", "Product zoom", "Mega menu"],
  },
  {
    name: "Bold Commerce",
    description: "Tegas dan eye-catching. Ideal untuk elektronik, gadget, dan produk teknis.",
    badge: null,
    badgeColor: "",
    accentColor: "from-secondary to-secondary/70",
    features: ["Hero banner besar", "Countdown promo", "Comparison table"],
  },
  {
    name: "Clean & Fresh",
    description: "Ringan dan modern. Sempurna untuk makanan, kecantikan, dan kesehatan.",
    badge: null,
    badgeColor: "",
    accentColor: "from-emerald-500 to-teal-500",
    features: ["Grid produk rapi", "Review bintang", "Color swatches"],
  },
  {
    name: "Custom Design",
    description: "Desain sepenuhnya sesuai identitas brand Anda — dikerjakan oleh tim desainer kami.",
    badge: "Enterprise",
    badgeColor: "bg-gray-100 text-gray-600",
    accentColor: "from-gray-700 to-gray-500",
    features: ["Fully custom", "Brand identity kit", "Dedicated designer"],
  },
];

const TemplateGallery = () => {
  return (
    <section id="templates" className="section-padding bg-white">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 fade-in">
          <span className="inline-block text-sm font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4">
            Template Toko
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Template Webstore{" "}
            <span className="text-primary">Profesional</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Pilih tampilan yang sesuai brand Anda. Template bisa diganti kapanpun setelah toko live.
          </p>
        </div>

        {/* Template grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {templates.map((template, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:border-primary/20 transition-all duration-300 overflow-hidden fade-in flex flex-col"
            >
              {/* Visual preview area */}
              <div className={`h-36 bg-gradient-to-br ${template.accentColor} relative flex items-center justify-center`}>
                {/* Mock browser chrome */}
                <div className="absolute top-3 left-3 flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-white/30" />
                  <span className="w-2 h-2 rounded-full bg-white/30" />
                  <span className="w-2 h-2 rounded-full bg-white/30" />
                </div>
                {/* Mock content lines */}
                <div className="w-3/4 space-y-2">
                  <div className="h-2 bg-white/40 rounded-full w-full" />
                  <div className="h-2 bg-white/25 rounded-full w-4/5" />
                  <div className="h-8 bg-white/20 rounded-lg w-full mt-3" />
                </div>
              </div>

              <div className="p-5 flex flex-col flex-1">
                {/* Badge */}
                {template.badge && (
                  <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-2 w-fit ${template.badgeColor}`}>
                    {template.badge}
                  </span>
                )}

                <h3 className="font-bold text-gray-900 mb-2 text-sm leading-snug">
                  {template.name}
                </h3>
                <p className="text-gray-500 text-xs leading-relaxed mb-4 flex-1">
                  {template.description}
                </p>

                {/* Features */}
                <ul className="space-y-1.5 mb-4">
                  {template.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs text-gray-600">
                      <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" strokeWidth={3} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-primary/30 text-primary hover:bg-primary hover:text-white transition-all duration-200 cursor-pointer text-xs"
                  disabled
                >
                  Demo Segera Hadir
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12 fade-in">
          <Button
            variant="outline"
            asChild
            className="border-2 border-primary text-primary hover:bg-primary hover:text-white gap-2 cursor-pointer"
          >
            <Link href="/templates">
              Lihat Semua Template
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TemplateGallery;
