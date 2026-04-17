import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Store, ChevronRight, MessageCircle } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Template Toko - Storo.id",
  description:
    "Pilih template toko online Anda. Semua template sudah responsif, SEO-friendly, dan siap pakai.",
};

const WA_LINK = "https://wa.me/6285157406969";

interface TemplateItem {
  id: string;
  name: string;
  display_name?: string | null;
  description: string;
  preview_image_url: string | null;
  demo_url: string | null;
  category?: string | null;
  tags?: string[];
}

const fallbackTemplates: TemplateItem[] = [
  {
    id: "1",
    name: "Minimalist",
    description: "Desain bersih dan modern untuk toko fashion & lifestyle",
    preview_image_url: null,
    demo_url: null,
    tags: ["Fashion", "Lifestyle", "Minimalis"],
  },
  {
    id: "2",
    name: "Bold Commerce",
    description: "Tampilan dinamis dan eye-catching untuk produk consumer",
    preview_image_url: null,
    demo_url: null,
    tags: ["FMCG", "Makanan", "Bold"],
  },
  {
    id: "3",
    name: "Classic Shop",
    description: "Gaya klasik yang membangun kepercayaan pelanggan",
    preview_image_url: null,
    demo_url: null,
    tags: ["Terpercaya", "Klasik", "Semua kategori"],
  },
  {
    id: "4",
    name: "Modern Store",
    description: "Template modern dengan fitur lengkap untuk toko besar",
    preview_image_url: null,
    demo_url: null,
    tags: ["Modern", "Lengkap", "Enterprise"],
  },
];

const filterTags = ["Semua", "Fashion", "Makanan", "FMCG", "Lifestyle"];

export default async function TemplatesPage() {
  let templates: TemplateItem[] | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("templates")
      .select(
        "id, name, display_name, description, preview_image_url, demo_url, category, is_active, deploy_status",
      )
      .eq("is_active", true)
      .eq("deploy_status", "live");
    templates = data as TemplateItem[] | null;
  } catch {
    // Supabase not available or table doesn't exist — use fallback
  }

  const displayTemplates =
    templates && templates.length > 0 ? templates : fallbackTemplates;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-white to-secondary/5 pt-28 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">Template</span>
          </nav>

          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-block text-sm font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4">
              Template Toko
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              Pilih Template{" "}
              <span className="text-primary">Toko Anda</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Semua template sudah responsif, SEO-friendly, dan siap pakai.
            </p>
          </div>
        </div>
      </section>

      {/* Filter bar (visual only) */}
      <section className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-4 overflow-x-auto scrollbar-hide">
            {filterTags.map((tag, idx) => (
              <span
                key={tag}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors ${
                  idx === 0
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-primary/10 hover:text-primary"
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Template Grid */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {displayTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col"
              >
                {/* Preview area */}
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden rounded-t-xl">
                  {template.preview_image_url ? (
                    <Image
                      src={template.preview_image_url}
                      alt={template.display_name ?? template.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-white/70 backdrop-blur-sm flex items-center justify-center shadow-sm">
                        <Store className="w-7 h-7 text-primary" />
                      </div>
                      <span className="text-xs font-medium text-primary/60 bg-white/50 px-3 py-1 rounded-full">
                        Preview Template
                      </span>
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="p-5 flex flex-col flex-1">
                  <h2 className="font-semibold text-foreground text-base mb-1.5">
                    {template.display_name ?? template.name}
                  </h2>
                  <p className="text-sm text-gray-500 mb-3 leading-relaxed flex-1">
                    {template.description}
                  </p>

                  {/* Category / tags */}
                  {(template.category || (template.tags && template.tags.length > 0)) && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {template.category && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/8 text-primary font-medium border border-primary/15">
                          {template.category}
                        </span>
                      )}
                      {template.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full bg-primary/8 text-primary font-medium border border-primary/15"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-2 mt-auto">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-lg text-xs font-medium border-gray-200"
                    >
                      <a
                        href={template.demo_url ?? "#"}
                        target={template.demo_url ? "_blank" : "_self"}
                        rel="noopener noreferrer"
                      >
                        Live Demo
                      </a>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className="flex-1 rounded-lg text-xs font-medium bg-primary hover:bg-primary/90 text-white"
                    >
                      <Link
                        href={`/sign-up?template=${encodeURIComponent(template.name)}`}
                      >
                        Pilih Template
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">
            Belum menemukan yang cocok?
          </h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Hubungi tim kami untuk template custom sesuai kebutuhan bisnis Anda.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-green-500 hover:bg-green-600 text-white font-semibold gap-2 rounded-xl px-8"
          >
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-5 h-5" />
              Hubungi Tim Kami
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
