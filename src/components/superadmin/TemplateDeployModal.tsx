"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Upload,
  Rocket,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";

interface FormState {
  name: string;
  display_name: string;
  slug: string;
  description: string;
  category: string;
  source_repo: string;
  source_branch: string;
  preview_image_url: string;
  price_setup_override: string;
  price_monthly_override: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  display_name: "",
  slug: "",
  description: "",
  category: "",
  source_repo: "PTVENTERA-AI/storoengine",
  source_branch: "main",
  preview_image_url: "",
  price_setup_override: "",
  price_monthly_override: "",
};

const CATEGORIES = ["fashion", "f&b", "elektronik", "kosmetik", "umum"];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

interface DeploymentStatus {
  template: {
    id: string;
    deploy_status: string;
    deploy_error: string | null;
    demo_url: string | null;
  };
  logs: Array<{
    action: string;
    status: string;
    step: string | null;
    error_message: string | null;
    created_at: string;
  }>;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /**
   * If provided, skip the create form and open directly in "deploying" phase
   * for polling an existing template's status. Used for Redeploy/retry flows.
   */
  trackTemplateId?: string | null;
}

export default function TemplateDeployModal({
  open,
  onClose,
  onSuccess,
  trackTemplateId,
}: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [phase, setPhase] = useState<"form" | "deploying" | "done" | "error">("form");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [status, setStatus] = useState<DeploymentStatus | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const slugAutoRef = useRef(true);

  // On open: choose phase based on whether tracking an existing template.
  // Do NOT reset the form — let user retry with same values after error.
  useEffect(() => {
    if (open) {
      setSubmitError(null);
      setStatus(null);

      if (trackTemplateId) {
        setTemplateId(trackTemplateId);
        setPhase("deploying");
      } else if (phase === "done") {
        // Previous deploy succeeded — start fresh form for new template
        setForm(EMPTY_FORM);
        setThumbnailFile(null);
        slugAutoRef.current = true;
        setTemplateId(null);
        setPhase("form");
      } else if (phase !== "form" && phase !== "deploying" && phase !== "error") {
        // First open
        setForm(EMPTY_FORM);
        setThumbnailFile(null);
        slugAutoRef.current = true;
        setTemplateId(null);
        setPhase("form");
      }
      // else: keep current form values (error/form/deploying state)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, trackTemplateId]);

  // Polling deploy status
  useEffect(() => {
    if (phase !== "deploying" || !templateId) return;

    let timeout: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/superadmin/templates/${templateId}/status`);
        if (!res.ok) throw new Error("Failed to fetch status");
        const data = (await res.json()) as DeploymentStatus;
        if (cancelled) return;
        setStatus(data);

        if (data.template.deploy_status === "live") {
          setPhase("done");
          onSuccess();
          return;
        }
        if (data.template.deploy_status === "failed") {
          setPhase("error");
          return;
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Status poll error:", err);
        }
      }

      if (!cancelled) timeout = setTimeout(poll, 3000);
    };

    poll();
    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [phase, templateId, onSuccess]);

  if (!open) return null;

  const handleNameChange = (value: string) => {
    setForm((p) => ({
      ...p,
      name: value,
      display_name: p.display_name || value,
      slug: slugAutoRef.current ? slugify(value) : p.slug,
    }));
  };

  const handleSlugChange = (value: string) => {
    slugAutoRef.current = false;
    setForm((p) => ({ ...p, slug: slugify(value) }));
  };

  const handleThumbnailChange = async (file: File) => {
    if (!form.slug) {
      setSubmitError("Isi nama dulu sebelum upload thumbnail (slug otomatis dari nama).");
      return;
    }
    setThumbnailFile(file);
    setUploadingThumbnail(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("slug", form.slug);

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
      setSubmitError(msg);
      setThumbnailFile(null);
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!form.name || !form.slug) {
      setSubmitError("Nama dan slug wajib diisi.");
      return;
    }

    try {
      let activeTemplateId = templateId;

      // If we already created the template (previous attempt failed at deploy),
      // skip create — just retry deploy on the existing row.
      if (!activeTemplateId) {
        const createRes = await fetch("/api/superadmin/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            display_name: form.display_name || form.name,
            slug: form.slug,
            description: form.description || null,
            category: form.category || null,
            source_repo: form.source_repo,
            source_branch: form.source_branch,
            preview_image_url: form.preview_image_url || null,
            price_setup_override: form.price_setup_override
              ? Number(form.price_setup_override)
              : null,
            price_monthly_override: form.price_monthly_override
              ? Number(form.price_monthly_override)
              : null,
          }),
        });

        if (!createRes.ok) {
          const err = await createRes.json().catch(() => ({ error: "Gagal membuat template" }));
          throw new Error(err.error);
        }

        const { template } = (await createRes.json()) as { template: { id: string } };
        activeTemplateId = template.id;
        setTemplateId(activeTemplateId);
      }

      // Trigger deploy (idempotent — safe to retry)
      const deployRes = await fetch(
        `/api/superadmin/templates/${activeTemplateId}/deploy`,
        { method: "POST" },
      );
      if (!deployRes.ok) {
        const err = await deployRes.json().catch(() => ({ error: "Gagal trigger deploy" }));
        throw new Error(err.error);
      }

      setPhase("deploying");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal submit";
      setSubmitError(msg);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && phase !== "deploying" && onClose()}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {phase === "form" && "Tambah Template Baru"}
              {phase === "deploying" && "Sedang Deploy..."}
              {phase === "done" && "Berhasil!"}
              {phase === "error" && "Deploy Gagal"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {phase === "form" && "Isi detail template, sistem akan deploy ke Vercel + DNS Cloudflare otomatis."}
              {phase === "deploying" && "Tunggu sebentar, biasanya 1-3 menit."}
              {phase === "done" && "Template sudah live dan bisa dilihat customer."}
              {phase === "error" && "Cek detail error di bawah."}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={phase === "deploying"}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {phase === "form" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nama <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    placeholder="cth. Minimalist Fashion"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4169df]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={form.display_name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, display_name: e.target.value }))
                    }
                    placeholder="cth. Minimalist Fashion Pro"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4169df]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Slug (subdomain) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    required
                    placeholder="minimalist-fashion"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4169df]"
                  />
                  <p className="text-[11px] text-gray-500 mt-1 break-all">
                    URL preview:{" "}
                    <span className="font-mono text-[#4169df]">
                      {form.slug || "{slug}"}.preview.storo.id
                    </span>
                  </p>
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

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Source Repo
                  </label>
                  <input
                    type="text"
                    value={form.source_repo}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, source_repo: e.target.value }))
                    }
                    placeholder="owner/repo"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#4169df]"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    {form.source_repo ? (
                      <a
                        href={`https://github.com/${form.source_repo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[#4169df] hover:underline inline-flex items-center gap-1"
                      >
                        github.com/{form.source_repo}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <>
                        Format: <span className="font-mono">owner/repo</span>
                      </>
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Branch / Tag
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
                    {form.source_repo ? (
                      <>
                        <a
                          href={`https://github.com/${form.source_repo}/branches`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#4169df] hover:underline inline-flex items-center gap-1"
                        >
                          Lihat daftar branch <ExternalLink className="w-3 h-3" />
                        </a>{" "}
                        ·{" "}
                        <a
                          href={`https://github.com/${form.source_repo}/tags`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#4169df] hover:underline inline-flex items-center gap-1"
                        >
                          tag <ExternalLink className="w-3 h-3" />
                        </a>
                      </>
                    ) : (
                      "Nama branch atau git tag."
                    )}
                  </p>
                </div>
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
                    {uploadingThumbnail ? "Uploading..." : "Pilih file"}
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
                </div>
              </div>

              {submitError && (
                <div className="text-sm bg-red-50 border border-red-100 rounded-lg p-3 text-red-700">
                  {submitError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-[#4169df] hover:bg-[#3458c8] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <Rocket className="w-4 h-4" />
                  Deploy Preview
                </button>
              </div>
            </form>
          )}

          {(phase === "deploying" || phase === "done" || phase === "error") && (
            <div className="space-y-4">
              {/* Status indicator */}
              <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-100 bg-gray-50">
                {phase === "deploying" && (
                  <>
                    <Loader2 className="w-5 h-5 text-[#4169df] animate-spin flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Deploying ke Vercel...
                      </p>
                      <p className="text-xs text-gray-500">
                        Polling status setiap 3 detik. Biasanya selesai dalam 1-3 menit.
                      </p>
                    </div>
                  </>
                )}
                {phase === "done" && (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Template berhasil di-deploy!
                      </p>
                      {status?.template.demo_url && (
                        <a
                          href={status.template.demo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#4169df] hover:underline"
                        >
                          {status.template.demo_url}
                        </a>
                      )}
                    </div>
                  </>
                )}
                {phase === "error" && (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-700">Deploy gagal</p>
                      <p className="text-xs text-red-600">
                        {status?.template.deploy_error || "Lihat log untuk detail"}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Logs */}
              {status?.logs && status.logs.length > 0 && (
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-600">
                    Log Deployment
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                    {status.logs.map((log, idx) => (
                      <div key={idx} className="px-3 py-2 text-xs flex items-start gap-2">
                        <span
                          className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                            log.status === "success"
                              ? "bg-green-500"
                              : log.status === "failed"
                                ? "bg-red-500"
                                : log.status === "started"
                                  ? "bg-blue-500"
                                  : "bg-gray-300"
                          }`}
                        />
                        <div className="flex-1">
                          <div className="text-gray-700">
                            <span className="font-medium">{log.action}</span>
                            {log.step && (
                              <span className="text-gray-400"> · {log.step}</span>
                            )}
                            <span className="text-gray-400"> · {log.status}</span>
                          </div>
                          {log.error_message && (
                            <div className="text-red-600 mt-0.5">{log.error_message}</div>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          {new Date(log.created_at).toLocaleTimeString("id-ID")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                {phase === "error" && !trackTemplateId && (
                  <button
                    onClick={() => {
                      setPhase("form");
                      setStatus(null);
                      setSubmitError(null);
                    }}
                    className="border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Kembali Edit Form
                  </button>
                )}
                <button
                  onClick={onClose}
                  disabled={phase === "deploying"}
                  className="bg-[#4169df] hover:bg-[#3458c8] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {phase === "deploying" ? "Tunggu..." : "Tutup"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
