"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Store, Zap, ShoppingBag } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { WizardState } from "./OnboardingWizard";

interface Template {
  id: string;
  name: string;
  description: string;
  preview_url?: string;
  is_active: boolean;
}

const PLACEHOLDER_TEMPLATES: Template[] = [
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Desain bersih dan modern",
    is_active: true,
  },
  {
    id: "bold-commerce",
    name: "Bold Commerce",
    description: "Tampilan dinamis dan eye-catching",
    is_active: true,
  },
  {
    id: "classic-shop",
    name: "Classic Shop",
    description: "Gaya klasik yang terpercaya",
    is_active: true,
  },
];

const PLACEHOLDER_ICONS = [Store, Zap, ShoppingBag];
const PLACEHOLDER_BG_COLORS = ["bg-gray-100", "bg-orange-50", "bg-blue-50"];
const PLACEHOLDER_ICON_COLORS = ["text-gray-400", "text-secondary", "text-primary"];

interface Step4Props {
  state: WizardState;
  goNext: () => void;
  goBack: () => void;
  updateState: (partial: Partial<WizardState>) => void;
}

export default function Step4Template({ state, goNext, goBack, updateState }: Step4Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("templates")
          .select("id, name, description, preview_url, is_active")
          .eq("is_active", true)
          .order("name");

        if (error || !data || data.length === 0) {
          setTemplates(PLACEHOLDER_TEMPLATES);
        } else {
          setTemplates(data);
        }
      } catch {
        setTemplates(PLACEHOLDER_TEMPLATES);
      } finally {
        setLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  const displayTemplates = templates.length > 0 ? templates : PLACEHOLDER_TEMPLATES;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Pilih Template</h2>
      <p className="text-sm text-gray-500 mb-6">
        Pilih tampilan toko yang paling sesuai dengan brand Anda.
      </p>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border-2 border-gray-100 p-4 animate-pulse"
            >
              <div className="h-32 bg-gray-100 rounded-lg mb-3" />
              <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {displayTemplates.map((template, idx) => {
            const isSelected = state.templateId === template.id;
            const PlaceholderIcon = PLACEHOLDER_ICONS[idx % PLACEHOLDER_ICONS.length];
            const bgColor = PLACEHOLDER_BG_COLORS[idx % PLACEHOLDER_BG_COLORS.length];
            const iconColor = PLACEHOLDER_ICON_COLORS[idx % PLACEHOLDER_ICON_COLORS.length];

            return (
              <button
                key={template.id}
                type="button"
                onClick={() =>
                  updateState({ templateId: template.id, templateName: template.name })
                }
                className={`flex flex-col text-left rounded-xl border-2 overflow-hidden transition-all focus:outline-none
                  ${
                    isSelected
                      ? "ring-2 ring-primary border-primary"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
              >
                {/* Preview */}
                {template.preview_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={template.preview_url}
                    alt={template.name}
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div
                    className={`w-full h-32 ${bgColor} flex items-center justify-center`}
                  >
                    <PlaceholderIcon className={`w-10 h-10 ${iconColor}`} />
                  </div>
                )}

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm">{template.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>

                  {isSelected && (
                    <div className="mt-2 flex items-center gap-1 text-primary text-xs font-semibold">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Dipilih
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={goBack}>
          ← Kembali
        </Button>
        <Button
          onClick={goNext}
          disabled={!state.templateId}
          className="bg-primary text-white hover:bg-primary/90 px-8 disabled:opacity-50"
        >
          Lanjut →
        </Button>
      </div>
    </div>
  );
}
