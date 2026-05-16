"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { StoreCard, ChipButton } from "@/components/dashboard/store/ui";

export type StoreSettingsInitial = {
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  is_active: boolean;
};

export default function StoreSettingsForm({
  storeId,
  initial,
}: {
  storeId: string;
  initial: StoreSettingsInitial;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [description, setDescription] = useState(initial.description ?? "");
  const [logoUrl, setLogoUrl] = useState(initial.logo_url ?? "");
  const [bannerUrl, setBannerUrl] = useState(initial.banner_url ?? "");
  const [isActive, setIsActive] = useState(initial.is_active);
  const [saving, setSaving] = useState(false);

  const inputCls =
    "w-full rounded-xl border border-[#E5E8EF] bg-white px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition";

  async function save() {
    if (!name.trim()) {
      toast.error("Nama toko wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/store/${storeId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || null,
          description: description?.trim() || null,
          logo_url: logoUrl.trim() || null,
          banner_url: bannerUrl.trim() || null,
          is_active: isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal menyimpan");
        return;
      }
      toast.success("Pengaturan disimpan");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-5">
        <StoreCard>
          <h2 className="text-sm font-semibold text-[#0F172A] mb-4">Identitas Toko</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Nama Toko <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                onChange={(e) => setSlug(e.target.value)}
                placeholder="namatoko"
                className={`${inputCls} font-mono`}
              />
              <p className="text-xs text-[#94A3B8] mt-1">
                Akan jadi: <span className="font-mono">{slug || "—"}.storo.id</span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Deskripsi
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Cerita singkat tentang toko Anda…"
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>
        </StoreCard>

        <StoreCard>
          <h2 className="text-sm font-semibold text-[#0F172A] mb-4">Branding</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                URL Logo
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://contoh.com/logo.png"
                className={inputCls}
              />
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="mt-2 h-16 w-16 object-contain rounded-lg border border-[#E5E8EF] bg-white"
                />
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                URL Banner
              </label>
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://contoh.com/banner.jpg"
                className={inputCls}
              />
              {bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={bannerUrl}
                  alt="Banner"
                  className="mt-2 h-32 w-full object-cover rounded-lg border border-[#E5E8EF] bg-white"
                />
              ) : null}
            </div>
          </div>
        </StoreCard>
      </div>

      <div className="space-y-5">
        <StoreCard>
          <h2 className="text-sm font-semibold text-[#0F172A] mb-3">Status Toko</h2>
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span>
              <span className="block text-sm font-medium text-[#0F172A]">
                Aktifkan toko
              </span>
              <span className="block text-xs text-[#64748B]">
                Saat nonaktif, storefront tidak bisa diakses publik.
              </span>
            </span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-5 rounded border-[#E5E8EF] cursor-pointer accent-primary"
            />
          </label>
        </StoreCard>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 bg-primary text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 cursor-pointer w-full"
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Menyimpan…
            </>
          ) : (
            "Simpan Pengaturan"
          )}
        </button>

        <ChipButton href={`/dashboard/manage-store/${storeId}`} variant="default">
          Kembali ke Dashboard
        </ChipButton>
      </div>
    </div>
  );
}
