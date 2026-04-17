"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, Loader2, Upload, Save, ExternalLink } from "lucide-react";
import type { TemplateCardData } from "./TemplateCard";

interface FormState {
  display_name: string;
  description: string;
  category: string;
  preview_image_url: string;
  source_branch: string;
  price_setup_override: string;
  price_monthly_override: string;
}

const CATEGORIES = ["fashion", "f&b", "elektronik", "kosmetik", "umum"];

interface Props {
  open: boolean;
  template: TemplateCardData | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function TemplateEditModal({ open, template, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>({
    display_name: "",
    description: "",
    category: "",
    preview_image_url: "",
    source_branch: "main",
    price_setup_override: "",
    price_monthly_override: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hydrate form from template when opening
  useEffect(() => {
    if (open && template) {
      setForm({
        display_name: template.display_name ?? "",
        description: template.description ?? "",
        category: template.category ?? "",
        preview_image_url: template.preview_image_url ?? "",
        source_branch: "main", // backend default; we don't have source_branch on card data
        price_setup_override: template.price_setup_override?.toString() ?? "",
        price_monthly_override: template.price_monthly_override?.toString() ?? "",
      });
      setError(null);
      setFeedback(null);
      setThumbnailFile(null);
    }
  }, [open, template]);

  if (!open || !template) return null;

  const handleThumbnailChange = async (file: File) => {
    setThumbnailFile(file);
    setUploadingThumbnail(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("slug", template.slug);

      const res = await fetch("/api/superadmin/templates/upload-thumbnail", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error);
      }
      const { url } = (await res.json()) as { url: string };
      setForm((p) => ({ ...p, preview_image_url: url }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
      setThumbnailFile(null);
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/superadmin/templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: form.display_name || template.name,
          description: form.description || null,
          category: form.category || null,
          preview_image_url: form.preview_image_url || null,
          source_branch: form.source_branch,
          price_setup_override: form.price_setup_override
            ? Number(form.price_setup_override)
            : null,
          price_monthly_override: form.price_monthly_override
            ? Number(form.price_monthly_override)
            : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Gagal menyimpan" }));
        throw new Error(err.error);
      }
      setFeedback("Berhasil disimpan.");
      onSaved();
      setTimeout(() => onClose(), 800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Edit Template</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Update detail template. Slug & nama tidak bisa diubah karena terkait DNS.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Read-only info */}
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Nama (slug):</span>
                <span className="font-mono text-gray-900">{template.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Subdomain:</span>
                <a
                  href={`https://${template.slug}.preview.storo.id`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[#4169df] hover:underline inline-flex items-center gap-1"
                >
                  {template.slug}.preview.storo.id <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status deploy:</span>
                <span className="font-medium text-gray-900">{template.deploy_status}</span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Display Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.display_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, display_name: e.target.value }))
                  }
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4169df]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Kategori
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4169df]"
                >
                  <option value="">— pilih —</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Deskripsi
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                rows={2}
                placeholder="Deskripsi singkat template"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4169df]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Branch / Tag default (untuk redeploy)
              </label>
              <input
                type="text"
                value={form.source_branch}
                onChange={(e) =>
                  setForm((p) => ({ ...p, source_branch: e.target.value }))
                }
                placeholder="main"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#4169df]"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Diperbarui jika redeploy dipanggil tanpa pilihan branch eksplisit.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Harga Setup (Rp) — opsional override
                </label>
                <input
                  type="number"
                  value={form.price_setup_override}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, price_setup_override: e.target.value }))
                  }
                  placeholder="kosong = pakai default plan"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4169df]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Harga Bulanan (Rp) — opsional override
                </label>
                <input
                  type="number"
                  value={form.price_monthly_override}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, price_monthly_override: e.target.value }))
                  }
                  placeholder="kosong = pakai default plan"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4169df]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Thumbnail
              </label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleThumbnailChange(f);
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingThumbnail}
                  className="inline-flex items-center gap-2 text-xs font-medium border border-gray-200 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {uploadingThumbnail ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  {uploadingThumbnail
                    ? "Uploading..."
                    : form.preview_image_url
                      ? "Ganti thumbnail"
                      : "Pilih file"}
                </button>
                {form.preview_image_url && (
                  <Image
                    src={form.preview_image_url}
                    alt="Thumbnail"
                    width={80}
                    height={48}
                    className="rounded border border-gray-100 object-cover"
                  />
                )}
                {thumbnailFile && !form.preview_image_url && (
                  <span className="text-xs text-gray-500">{thumbnailFile.name}</span>
                )}
                {form.preview_image_url && (
                  <button
                    type="button"
                    onClick={() => {
                      setForm((p) => ({ ...p, preview_image_url: "" }));
                      setThumbnailFile(null);
                    }}
                    className="text-xs text-red-600 hover:underline cursor-pointer"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="text-sm bg-red-50 border border-red-100 rounded-lg p-3 text-red-700">
                {error}
              </div>
            )}
            {feedback && (
              <div className="text-sm bg-green-50 border border-green-100 rounded-lg p-3 text-green-700">
                {feedback}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[#4169df] hover:bg-[#3458c8] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
