"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2, Ticket } from "lucide-react";
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

export type PromoRow = {
  id: string;
  name: string;
  code: string | null;
  type: string;
  value: number;
  min_purchase: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

const inputCls =
  "w-full rounded-xl border border-[#E5E8EF] bg-white px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition";

type FormState = {
  id?: string;
  name: string;
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
  min_purchase: number | "";
  max_discount: number | "";
  usage_limit: number | "";
  is_active: boolean;
};

const empty: FormState = {
  name: "",
  code: "",
  type: "percentage",
  value: 0,
  min_purchase: "",
  max_discount: "",
  usage_limit: "",
  is_active: true,
};

export default function PromosManager({
  storeId,
  initial,
}: {
  storeId: string;
  initial: PromoRow[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<PromoRow[]>(initial);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [busy, setBusy] = useState(false);

  function openNew() {
    setForm(empty);
    setOpen(true);
  }
  function openEdit(p: PromoRow) {
    setForm({
      id: p.id,
      name: p.name,
      code: p.code ?? "",
      type: p.type as FormState["type"],
      value: Number(p.value) || 0,
      min_purchase: p.min_purchase ?? "",
      max_discount: p.max_discount ?? "",
      usage_limit: p.usage_limit ?? "",
      is_active: p.is_active,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Nama promo wajib diisi");
      return;
    }
    setBusy(true);
    const isEdit = Boolean(form.id);
    const url = isEdit
      ? `/api/store/${storeId}/promos/${form.id}`
      : `/api/store/${storeId}/promos`;
    try {
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          code: form.code.trim() || null,
          type: form.type,
          value: form.value,
          min_purchase: form.min_purchase === "" ? null : form.min_purchase,
          max_discount: form.max_discount === "" ? null : form.max_discount,
          usage_limit: form.usage_limit === "" ? null : form.usage_limit,
          is_active: form.is_active,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal menyimpan");
        return;
      }
      const promo = data.promo as PromoRow;
      if (isEdit) {
        setItems((prev) => prev.map((p) => (p.id === promo.id ? promo : p)));
      } else {
        setItems((prev) => [promo, ...prev]);
      }
      setOpen(false);
      toast.success(isEdit ? "Promo diperbarui" : "Promo ditambahkan");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Hapus promo ini?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/store/${storeId}/promos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Gagal menghapus");
        return;
      }
      setItems((prev) => prev.filter((p) => p.id !== id));
      toast.success("Promo dihapus");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function valueLabel(p: PromoRow) {
    if (p.type === "percentage") return `${p.value}%`;
    if (p.type === "free_shipping") return "Gratis Ongkir";
    return formatIDR(p.value);
  }

  return (
    <>
      <div className="mb-4">
        <ChipButton onClick={openNew} variant="primary" icon={<Plus className="size-3.5" />}>
          Tambah Promo
        </ChipButton>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <StoreCard key={p.id}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="size-9 rounded-xl bg-primary/10 grid place-items-center">
                  <Ticket className="size-4 text-primary" />
                </div>
                <StatusBadge tone={p.is_active ? "success" : "neutral"}>
                  {p.is_active ? "Aktif" : "Nonaktif"}
                </StatusBadge>
              </div>
              <p className="text-sm font-semibold text-[#0F172A] line-clamp-1">{p.name}</p>
              {p.code ? (
                <p className="text-xs font-mono text-[#64748B] mt-0.5">Kode: {p.code}</p>
              ) : null}
              <p className="text-lg font-bold text-primary mt-2">{valueLabel(p)}</p>
              <div className="text-xs text-[#94A3B8] mt-1 space-y-0.5">
                {p.min_purchase ? <p>Min. {formatIDR(p.min_purchase)}</p> : null}
                <p>
                  Dipakai {p.used_count}
                  {p.usage_limit ? ` / ${p.usage_limit}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[#F1F4FA]">
                <ChipButton onClick={() => openEdit(p)} variant="default" icon={<Pencil className="size-3" />}>
                  Edit
                </ChipButton>
                <ChipButton
                  onClick={() => remove(p.id)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Promo" : "Tambah Promo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Nama Promo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="cth: Diskon Pelanggan Baru"
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Kode</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="HEMAT10"
                  className={`${inputCls} font-mono uppercase`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Tipe</label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value as FormState["type"] }))
                  }
                  className={`${inputCls} cursor-pointer`}
                >
                  <option value="percentage">Persentase (%)</option>
                  <option value="fixed">Nominal (Rp)</option>
                  <option value="free_shipping">Gratis Ongkir</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                {form.type === "percentage" ? "Nilai (%)" : "Nilai (Rp)"}
              </label>
              <input
                type="number"
                min={0}
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) || 0 }))}
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                  Min. Pembelian
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.min_purchase}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      min_purchase: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                  Maks. Diskon
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.max_discount}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      max_discount: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Limit Pemakaian
              </label>
              <input
                type="number"
                min={0}
                value={form.usage_limit}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    usage_limit: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
                placeholder="Kosongkan = unlimited"
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
              <span className="text-sm text-[#0F172A]">Aktifkan promo</span>
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
