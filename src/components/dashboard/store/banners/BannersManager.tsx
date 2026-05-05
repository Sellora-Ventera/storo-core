"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  StoreCard,
  ChipButton,
  StatusBadge,
  formatDate,
} from "@/components/dashboard/store/ui";

export type BannerRow = {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  position: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

const inputCls =
  "w-full rounded-xl border border-[#E5E8EF] bg-white px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition";

type FormState = {
  id?: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  position: number;
  is_active: boolean;
};

const emptyForm: FormState = {
  title: "",
  subtitle: "",
  image_url: "",
  link_url: "",
  position: 0,
  is_active: true,
};

export default function BannersManager({
  storeId,
  initial,
}: {
  storeId: string;
  initial: BannerRow[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<BannerRow[]>(initial);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  function openNew() {
    setForm({ ...emptyForm, position: items.length });
    setOpen(true);
  }
  function openEdit(b: BannerRow) {
    setForm({
      id: b.id,
      title: b.title ?? "",
      subtitle: b.subtitle ?? "",
      image_url: b.image_url,
      link_url: b.link_url ?? "",
      position: b.position,
      is_active: b.is_active,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.image_url.trim()) {
      toast.error("URL gambar wajib diisi");
      return;
    }
    setBusy(true);
    const isEdit = Boolean(form.id);
    const url = isEdit
      ? `/api/store/${storeId}/banners/${form.id}`
      : `/api/store/${storeId}/banners`;
    try {
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim() || null,
          subtitle: form.subtitle.trim() || null,
          image_url: form.image_url.trim(),
          link_url: form.link_url.trim() || null,
          position: form.position,
          is_active: form.is_active,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal menyimpan banner");
        return;
      }
      const banner = data.banner as BannerRow;
      if (isEdit) {
        setItems((prev) => prev.map((b) => (b.id === banner.id ? banner : b)));
      } else {
        setItems((prev) => [...prev, banner]);
      }
      setOpen(false);
      toast.success(isEdit ? "Banner diperbarui" : "Banner ditambahkan");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Hapus banner ini?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/store/${storeId}/banners/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Gagal menghapus");
        return;
      }
      setItems((prev) => prev.filter((b) => b.id !== id));
      toast.success("Banner dihapus");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mb-4">
        <ChipButton onClick={openNew} variant="primary" icon={<Plus className="size-3.5" />}>
          Tambah Banner
        </ChipButton>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((b) => (
            <StoreCard key={b.id} padded={false} className="overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.image_url}
                alt={b.title ?? "Banner"}
                className="h-32 w-full object-cover bg-[#F1F4FA]"
              />
              <div className="p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#0F172A] line-clamp-1">
                    {b.title ?? "(Tanpa judul)"}
                  </p>
                  <StatusBadge tone={b.is_active ? "success" : "neutral"}>
                    {b.is_active ? "Aktif" : "Nonaktif"}
                  </StatusBadge>
                </div>
                {b.subtitle ? (
                  <p className="text-xs text-[#64748B] line-clamp-2">{b.subtitle}</p>
                ) : null}
                <p className="text-[11px] text-[#94A3B8]">
                  Posisi {b.position} • {formatDate(b.created_at)}
                </p>
                <div className="flex items-center gap-1.5 pt-2">
                  <ChipButton onClick={() => openEdit(b)} variant="default" icon={<Pencil className="size-3" />}>
                    Edit
                  </ChipButton>
                  <ChipButton
                    onClick={() => remove(b.id)}
                    variant="ghost"
                    icon={<Trash2 className="size-3" />}
                  >
                    Hapus
                  </ChipButton>
                </div>
              </div>
            </StoreCard>
          ))}
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Banner" : "Tambah Banner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                URL Gambar <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={form.image_url}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                placeholder="https://contoh.com/banner.jpg"
                className={inputCls}
              />
              {form.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.image_url}
                  alt="Preview"
                  className="mt-2 h-32 w-full object-cover rounded-lg border border-[#E5E8EF] bg-white"
                />
              ) : (
                <div className="mt-2 h-32 w-full grid place-items-center rounded-lg border border-dashed border-[#E5E8EF] bg-[#F8F9FC]">
                  <ImageIcon className="size-6 text-[#94A3B8]" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Judul</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Posisi</label>
                <input
                  type="number"
                  value={form.position}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, position: Number(e.target.value) || 0 }))
                  }
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Subtitle</label>
              <input
                type="text"
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Link URL</label>
              <input
                type="url"
                value={form.link_url}
                onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
                placeholder="https://… (opsional)"
                className={inputCls}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="size-4 cursor-pointer accent-primary"
              />
              <span className="text-sm text-[#0F172A]">Aktifkan banner</span>
            </label>
          </div>
          <DialogFooter>
            <ChipButton onClick={() => setOpen(false)} variant="default">
              Batal
            </ChipButton>
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium bg-primary text-white shadow-sm hover:bg-primary/90 transition cursor-pointer disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Simpan
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
