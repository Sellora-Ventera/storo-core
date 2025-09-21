import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="bg-gradient-to-br from-primary/5 to-secondary/5 section-padding">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo */}
          <div className="mb-8 fade-in">
            <h1 className="text-4xl md:text-6xl font-bold text-primary mb-2">
              Storo.id
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto"></div>
          </div>

          {/* Main Headline */}
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight fade-in">
            Jasa Buat Website Toko Online dari Shopee – 
            <span className="text-primary"> Punya Toko Sendiri Tanpa Ribet</span>
          </h2>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed fade-in">
            Cukup kirim file Excel dari Seller Center, Storo.id akan siapkan webstore lengkap 
            dengan pembayaran & ekspedisi. <span className="font-semibold text-secondary">Praktis, langsung jalan.</span>
          </p>

          {/* CTA Button */}
          <div className="fade-in">
            <Button 
              size="lg"
              className="btn-hero text-lg"
              onClick={() => window.open('https://wa.me/6285647486700?text=Halo%20Storo.id,%20saya%20mau%20konsultasi%20gratis%20untuk%20webstore', '_blank')}
            >
              Konsultasi Gratis via WhatsApp
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 fade-in">
            <p className="text-sm text-gray-500 mb-4">Dipercaya oleh 500+ seller Shopee</p>
            <div className="flex justify-center items-center space-x-8 opacity-60">
              <div className="text-2xl font-bold text-primary">⭐ 4.9/5</div>
              <div className="text-sm text-gray-600">Rating dari klien</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;