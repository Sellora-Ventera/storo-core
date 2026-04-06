"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Plus, Eye, ExternalLink, ToggleLeft, ToggleRight } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string | null;
  preview_url: string | null;
  demo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    preview_url: "",
    demo_url: "",
    is_active: true,
  });
  const [formMessage, setFormMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchTemplates = async () => {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from("templates")
      .select("id, name, description, preview_url, demo_url, is_active, created_at")
      .order("created_at", { ascending: false });
    setTemplates(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleToggle = async (template: Template) => {
    const supabase = getSupabaseBrowserClient();
    await supabase
      .from("templates")
      .update({ is_active: !template.is_active })
      .eq("id", template.id);
    fetchTemplates();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMessage(null);

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("templates").insert({
      name: form.name,
      description: form.description || null,
      preview_url: form.preview_url || null,
      demo_url: form.demo_url || null,
      is_active: form.is_active,
    });

    if (error) {
      setFormMessage({ type: "error", text: error.message });
    } else {
      setFormMessage({ type: "success", text: "Template berhasil ditambahkan." });
      setForm({ name: "", description: "", preview_url: "", demo_url: "", is_active: true });
      fetchTemplates();
      setTimeout(() => {
        setShowForm(false);
        setFormMessage(null);
      }, 1500);
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Template Gallery</h1>
          <p className="text-gray-500 mt-1 text-sm">Kelola template toko yang tersedia</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Template
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white border border-blue-100 rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Tambah Template Baru</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                  placeholder="cth. Minimalist Fashion"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Deskripsi singkat template"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preview URL
                </label>
                <input
                  type="url"
                  value={form.preview_url}
                  onChange={(e) => setForm((p) => ({ ...p, preview_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Demo URL
                </label>
                <input
                  type="url"
                  value={form.demo_url}
                  onChange={(e) => setForm((p) => ({ ...p, demo_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">
                Aktif (tampil di pilihan template)
              </label>
            </div>

            {formMessage && (
              <div
                className={`text-sm px-3 py-2 rounded-lg ${
                  formMessage.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {formMessage.text}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
              >
                {submitting ? "Menyimpan..." : "Tambah Template"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-10 text-center text-gray-400 text-sm">Memuat data...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase w-10">
                    No
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">
                    Nama
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">
                    Deskripsi
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">
                    Preview
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">
                    Demo
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {templates.length > 0 ? (
                  templates.map((t, idx) => (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{t.name}</td>
                      <td className="py-3 px-4 text-gray-600 max-w-[180px] truncate">
                        {t.description ?? "-"}
                      </td>
                      <td className="py-3 px-4">
                        {t.preview_url ? (
                          <a
                            href={t.preview_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-600 text-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Preview
                          </a>
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {t.demo_url ? (
                          <a
                            href={t.demo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-600 text-xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Demo
                          </a>
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex text-xs font-medium px-2 py-1 rounded-full border ${
                            t.is_active
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-gray-100 text-gray-500 border-gray-200"
                          }`}
                        >
                          {t.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggle(t)}
                          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                          title={t.is_active ? "Nonaktifkan" : "Aktifkan"}
                        >
                          {t.is_active ? (
                            <ToggleRight className="w-4 h-4 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-gray-400" />
                          )}
                          {t.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-400 text-sm">
                      Belum ada template
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
