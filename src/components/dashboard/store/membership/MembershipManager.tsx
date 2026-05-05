"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2, Crown } from "lucide-react";
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
  formatIDR,
} from "@/components/dashboard/store/ui";

export type TierRow = {
  id: string;
  name: string;
  min_spend: number;
  discount_pct: number;
  free_shipping: boolean;
  earn_multiplier: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

const inputCls =
  "w-full rounded-xl border border-[#E5E8EF] bg-white px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition";

type FormState = {
  id?: string;
  name: string;
  min_spend: number;
  discount_pct: number;
  free_shipping: boolean;
  earn_multiplier: number;
  sort_order: number;
  is_active: boolean;
};

const empty: FormState = {
  name: "",
  min_spend: 0,
  discount_pct: 0,
  free_shipping: false,
  earn_multiplier: 1,
  sort_order: 0,
  is_active: true,
};

export default function MembershipManager({
  storeId,
  initial,
}: {
  storeId: string;
  initial: TierRow[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<TierRow[]>(initial);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [busy, setBusy] = useState(false);

  function openNew() {
    setForm({ ...empty, sort_order: items.length });
    setOpen(true);
  }
  function openEdit(t: TierRow) {
    setForm({
      id: t.id,
      name: t.name,
      min_spend: Number(t.min_spend) || 0,
      discount_pct: Number(t.discount_pct) || 0,
      free_shipping: t.free_shipping,
      earn_multiplier: Number(t.earn_multiplier) || 1,
      sort_order: t.sort_order,
      is_active: t.is_active,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Nama tier wajib diisi");
      return;
    }
    setBusy(true);
    const isEdit = Boolean(form.id);
    const url = isEdit
      ? `/api/store/${storeId}/membership/${form.id}`
      : `/api/store/${storeId}/membership`;
    try {
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          min_spend: form.min_spend,
          discount_pct: form.discount_pct,
          free_shipping: form.free_shipping,
          earn_multiplier: form.earn_multiplier,
          sort_order: form.sort_order,
          is_active: form.is_active,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal menyimpan");
        return;
      }
      const tier = data.tier as TierRow;
      if (isEdit) setItems((prev) => prev.map((t) => (t.id === tier.id ? tier : t)));
      else setItems((prev) => [...prev, tier]);
      setOpen(false);
      toast.success(isEdit ? "Tier diperbarui" : "Tier ditambahkan");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Hapus tier ini?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/store/${storeId}/membership/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Gagal menghapus");
        return;
      }
      setItems((prev) => prev.filter((t) => t.id !== id));
      toast.success("Tier dihapus");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mb-4">
        <ChipButton onClick={openNew} variant="primary" icon={<Plus className="size-3.5" />}>
          Tambah Tier
        </ChipButton>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <StoreCard key={t.id}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="size-9 rounded-xl bg-amber-50 grid place-items-center">
                  <Crown className="size-4 text-amber-600" />
                </div>
                <StatusBadge tone={t.is_active ? "success" : "neutral"}>
                  {t.is_active ? "Aktif" : "Nonaktif"}
                </StatusBadge>
              </div>
              <p className="text-sm font-semibold text-[#0F172A]">{t.name}</p>
              <p className="text-xs text-[#64748B]">
                Min. belanja seumur hidup: {formatIDR(t.min_spend)}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-[#94A3B8]">Diskon</dt>
                  <dd className="text-[#0F172A] font-semibold">
                    {(Number(t.discount_pct) * 100).toFixed(1)}%
                  </dd>
                </div>
                <div>
                  <dt className="text-[#94A3B8]">Earn ×</dt>
                  <dd className="text-[#0F172A] font-semibold">{t.earn_multiplier}x</dd>
                </div>
                <div>
                  <dt className="text-[#94A3B8]">Gratis Ongkir</dt>
                  <dd className="text-[#0F172A]">{t.free_shipping ? "Ya" : "Tidak"}</dd>
                </div>
                <div>
                  <dt className="text-[#94A3B8]">Urutan</dt>
                  <dd className="text-[#0F172A]">{t.sort_order}</dd>
                </div>
              </dl>
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[#F1F4FA]">
                <ChipButton onClick={() => openEdit(t)} variant="default" icon={<Pencil className="size-3" />}>
                  Edit
                </ChipButton>
                <ChipButton
                  onClick={() => remove(t.id)}
                  variant="ghost"
                  icon={<Trash2 className="size-3" />}
                >
                  Hapus
                </ChipButton>
              </div>
            </StoreCard>
          ))}
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Tier" : "Tambah Tier"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Nama Tier <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="cth: Gold, Platinum"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Min. Total Belanja Seumur Hidup (Rp)
              </label>
              <input
                type="number"
                min={0}
                value={form.min_spend}
                onChange={(e) => setForm((f) => ({ ...f, min_spend: Number(e.target.value) || 0 }))}
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                  Diskon (0-1)
                </label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={form.discount_pct}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, discount_pct: Number(e.target.value) || 0 }))
                  }
                  className={inputCls}
                />
                <p className="text-[10px] text-[#94A3B8] mt-1">
                  0.05 = 5%
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                  Earn Multiplier
                </label>
                <input
                  type="number"
                  min={1}
                  step={0.1}
                  value={form.earn_multiplier}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, earn_multiplier: Number(e.target.value) || 1 }))
                  }
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Urutan</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
                className={inputCls}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.free_shipping}
                onChange={(e) => setForm((f) => ({ ...f, free_shipping: e.target.checked }))}
                className="size-4 cursor-pointer accent-primary"
              />
              <span className="text-sm text-[#0F172A]">Gratis ongkir untuk tier ini</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="size-4 cursor-pointer accent-primary"
              />
              <span className="text-sm text-[#0F172A]">Aktifkan tier</span>
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
