import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Store, ArrowRight, ExternalLink } from "lucide-react";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

interface TemplateItem {
  id: string;
  name: string;
  display_name?: string | null;
  description: string;
  preview_image_url: string | null;
  demo_url: string | null;
  category?: string | null;
}

const TemplateShowcase = async () => {
  const supabase = await createSupabaseServiceClient();
  const { data: templates } = await supabase
    .from("templates")
    .select(
      "id, name, display_name, description, preview_image_url, demo_url, category"
    )
    .eq("is_active", true)
    .eq("deploy_status", "live")
    .order("sort_order", { ascending: true })
    .limit(3);

  if (!templates || templates.length === 0) return null;

  return (
    <section className="section-padding bg-gray-50">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-14 fade-in">
          <span className="inline-block text-sm font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4">
            Pilihan Template
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Desain Profesional,{" "}
            <span className="text-primary">Siap Pakai</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Pilih template yang sesuai dengan brand Anda. Responsif, cepat, dan
            sudah terintegrasi payment & shipping.
          </p>
        </div>

        {/* Template grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {templates.map((template) => (
            <div
              key={template.id}
              className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:border-transparent transition-all duration-300 flex flex-col fade-in"
            >
              {/* Preview image */}
              <div className="aspect-[16/10] bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden">
                {template.preview_image_url ? (
                  <Image
                    src={template.preview_image_url}
                    alt={template.display_name ?? template.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-white/70 backdrop-blur-sm flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <Store className="w-8 h-8 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-primary/60 bg-white/50 px-3 py-1 rounded-full">
                      Preview Template
                    </span>
                  </div>
                )}

                {/* Category badge */}
                {template.category && (
                  <span className="absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-gray-700 shadow-sm">
                    {template.category}
                  </span>
                )}
              </div>

              {/* Card body */}
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {template.display_name ?? template.name}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-5 flex-1">
                  {template.description}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  {template.demo_url ? (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-lg text-sm font-medium border-gray-200 cursor-pointer"
                    >
                      <a
                        href={template.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                        Live Demo
                      </a>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="flex-1 rounded-lg text-sm font-medium border-gray-200"
                    >
                      Segera Hadir
                    </Button>
                  )}
                  <Button
                    asChild
                    size="sm"
                    className="flex-1 rounded-lg text-sm font-medium bg-primary hover:bg-primary/90 text-white cursor-pointer"
                  >
                    <Link href="/onboarding">Pilih</Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA to full templates page */}
        <div className="text-center mt-12 fade-in">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-xl border-primary/30 text-primary hover:bg-primary/5 font-semibold gap-2 cursor-pointer"
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

export default TemplateShowcase;
