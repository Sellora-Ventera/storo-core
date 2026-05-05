"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { StoreCard, ChipButton } from "@/components/dashboard/store/ui";

export type BlogPostInitial = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featured_image: string | null;
  status: string;
  meta_title: string | null;
  meta_description: string | null;
};

const inputCls =
  "w-full rounded-xl border border-[#E5E8EF] bg-white px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function BlogPostForm({
  storeId,
  mode,
  initial,
}: {
  storeId: string;
  mode: "create" | "edit";
  initial?: BlogPostInitial;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugManual, setSlugManual] = useState(Boolean(initial?.slug));
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [featuredImage, setFeaturedImage] = useState(initial?.featured_image ?? "");
  const [status, setStatus] = useState(initial?.status ?? "draft");
  const [metaTitle, setMetaTitle] = useState(initial?.meta_title ?? "");
  const [metaDescription, setMetaDescription] = useState(initial?.meta_description ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!slugManual) setSlug(slugify(title));
  }, [title, slugManual]);

  async function save() {
    if (!title.trim()) {
      toast.error("Judul wajib diisi");
      return;
    }
    setBusy(true);
    const isEdit = mode === "edit" && initial?.id;
    const url = isEdit
      ? `/api/store/${storeId}/blog/${initial!.id}`
      : `/api/store/${storeId}/blog`;
    try {
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug || slugify(title),
          excerpt: excerpt?.trim() || null,
          content: content?.trim() || null,
          featured_image: featuredImage.trim() || null,
          status,
          meta_title: metaTitle.trim() || null,
          meta_description: metaDescription.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal menyimpan");
        return;
      }
      toast.success(isEdit ? "Artikel diperbarui" : "Artikel dibuat");
      router.push(`/dashboard/${storeId}/blog`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!initial?.id) return;
    if (!confirm("Hapus artikel ini?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/store/${storeId}/blog/${initial.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Gagal menghapus");
        return;
      }
      toast.success("Artikel dihapus");
      router.push(`/dashboard/${storeId}/blog`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-5">
        <StoreCard>
          <h2 className="text-sm font-semibold text-[#0F172A] mb-4">Konten</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Judul <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Slug URL
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlugManual(true);
                  setSlug(e.target.value);
                }}
                className={`${inputCls} font-mono`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Ringkasan
              </label>
              <textarea
                rows={2}
                value={excerpt ?? ""}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Paragraf singkat untuk preview…"
                className={`${inputCls} resize-none`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Isi Artikel (Markdown didukung)
              </label>
              <textarea
                rows={14}
                value={content ?? ""}
                onChange={(e) => setContent(e.target.value)}
                placeholder="# Judul Heading&#10;Paragraf isi…"
                className={`${inputCls} resize-y font-mono text-xs`}
              />
            </div>
          </div>
        </StoreCard>

        <StoreCard>
          <h2 className="text-sm font-semibold text-[#0F172A] mb-4">SEO</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Meta Title
              </label>
              <input
                type="text"
                value={metaTitle ?? ""}
                onChange={(e) => setMetaTitle(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Meta Description
              </label>
              <textarea
                rows={3}
                value={metaDescription ?? ""}
                onChange={(e) => setMetaDescription(e.target.value)}
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>
        </StoreCard>
      </div>

      <div className="space-y-5">
        <StoreCard>
          <h2 className="text-sm font-semibold text-[#0F172A] mb-3">Status</h2>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={`${inputCls} cursor-pointer`}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </StoreCard>

        <StoreCard>
          <h2 className="text-sm font-semibold text-[#0F172A] mb-3">Featured Image</h2>
          <input
            type="url"
            value={featuredImage}
            onChange={(e) => setFeaturedImage(e.target.value)}
            placeholder="https://contoh.com/cover.jpg"
            className={inputCls}
          />
          {featuredImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={featuredImage}
              alt=""
              className="mt-2 h-32 w-full object-cover rounded-lg border border-[#E5E8EF]"
            />
          ) : null}
        </StoreCard>

        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 bg-primary text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 cursor-pointer w-full"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Menyimpan…
            </>
          ) : mode === "edit" ? (
            "Simpan Perubahan"
          ) : (
            "Publikasikan / Simpan Draft"
          )}
        </button>

        {mode === "edit" ? (
          <ChipButton onClick={remove} variant="ghost">
            Hapus Artikel
          </ChipButton>
        ) : null}
      </div>
    </div>
  );
}
