"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2, Truck } from "lucide-react";
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

export type FreeShippingRow = {
  id: string;
  name: string;
  description: string | null;
  min_purchase: number | null;
  postal_codes: string[];
  allowed_courier_codes: string[];
  max_subsidy: number | null;
  is_active: boolean;
  priority: number;
  usage_count: number;
  created_at: string;
};

const inputCls =
  "w-full rounded-xl border border-[#E5E8EF] bg-white px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition";

type FormState = {
  id?: string;
  name: string;
  description: string;
  min_purchase: number | "";
  postal_codes: string;
  allowed_courier_codes: string;
  max_subsidy: number | "";
  priority: number;
  is_active: boolean;
};

const empty: FormState = {
  name: "",
  description: "",
  min_purchase: "",
  postal_codes: "",
  allowed_courier_codes: "",
  max_subsidy: "",
  priority: 0,
  is_active: true,
};

function parseList(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function FreeShippingManager({
  storeId,
  initial,
}: {
  storeId: string;
  initial: FreeShippingRow[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<FreeShippingRow[]>(initial);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [busy, setBusy] = useState(false);

  function openNew() {
    setForm(empty);
    setOpen(true);
  }
  function openEdit(r: FreeShippingRow) {
    setForm({
      id: r.id,
      name: r.name,
      description: r.description ?? "",
      min_purchase: r.min_purchase ?? "",
      postal_codes: (r.postal_codes ?? []).join("\n"),
      allowed_courier_codes: (r.allowed_courier_codes ?? []).join(", "),
      max_subsidy: r.max_subsidy ?? "",
      priority: r.priority,
      is_active: r.is_active,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Nama aturan wajib diisi");
      return;
    }
    setBusy(true);
    const isEdit = Boolean(form.id);
    const url = isEdit
      ? `/api/store/${storeId}/free-shipping/${form.id}`
      : `/api/store/${storeId}/free-shipping`;
    try {
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          min_purchase: form.min_purchase === "" ? null : form.min_purchase,
          postal_codes: parseList(form.postal_codes),
          allowed_courier_codes: parseList(form.allowed_courier_codes).map((c) => c.toLowerCase()),
          max_subsidy: form.max_subsidy === "" ? null : form.max_subsidy,
          priority: form.priority,
          is_active: form.is_active,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal menyimpan");
        return;
      }
      const rule = data.rule as FreeShippingRow;
      if (isEdit) {
        setItems((prev) => prev.map((r) => (r.id === rule.id ? rule : r)));
      } else {
        setItems((prev) => [rule, ...prev]);
      }
      setOpen(false);
      toast.success(isEdit ? "Aturan diperbarui" : "Aturan ditambahkan");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Hapus aturan ini?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/store/${storeId}/free-shipping/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Gagal menghapus");
        return;
      }
      setItems((prev) => prev.filter((r) => r.id !== id));
      toast.success("Aturan dihapus");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mb-4">
        <ChipButton onClick={openNew} variant="primary" icon={<Plus className="size-3.5" />}>
          Tambah Aturan
        </ChipButton>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((r) => (
            <StoreCard key={r.id}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="size-9 rounded-xl bg-emerald-50 grid place-items-center">
                  <Truck className="size-4 text-emerald-600" />
                </div>
                <StatusBadge tone={r.is_active ? "success" : "neutral"}>
                  {r.is_active ? "Aktif" : "Nonaktif"}
                </StatusBadge>
              </div>
              <p className="text-sm font-semibold text-[#0F172A]">{r.name}</p>
              {r.description ? (
                <p className="text-xs text-[#64748B] mt-0.5 line-clamp-2">{r.description}</p>
              ) : null}
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-[#94A3B8]">Min. Pembelian</dt>
                  <dd className="text-[#0F172A] font-semibold">
                    {r.min_purchase ? formatIDR(r.min_purchase) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#94A3B8]">Maks. Subsidi</dt>
                  <dd className="text-[#0F172A] font-semibold">
                    {r.max_subsidy ? formatIDR(r.max_subsidy) : "Penuh"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#94A3B8]">Kode Pos</dt>
                  <dd className="text-[#0F172A]">{r.postal_codes?.length ?? 0} pola</dd>
                </div>
                <div>
                  <dt className="text-[#94A3B8]">Kurir</dt>
                  <dd className="text-[#0F172A]">
                    {r.allowed_courier_codes?.length
                      ? `${r.allowed_courier_codes.length} kurir`
                      : "Semua"}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[#94A3B8]">Dipakai</dt>
                  <dd className="text-[#0F172A]">{r.usage_count} kali</dd>
                </div>
              </dl>
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[#F1F4FA]">
                <ChipButton onClick={() => openEdit(r)} variant="default" icon={<Pencil className="size-3" />}>
                  Edit
                </ChipButton>
                <ChipButton
                  onClick={() => remove(r.id)}
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
            <DialogTitle>{form.id ? "Edit Aturan Gratis Ongkir" : "Tambah Aturan Gratis Ongkir"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Nama <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="cth: Gratis Ongkir Jabodetabek"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Deskripsi
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className={`${inputCls} resize-none`}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                  Min. Pembelian (Rp)
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
                  placeholder="cth: 100000"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                  Maks. Subsidi (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.max_subsidy}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      max_subsidy: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  placeholder="Kosongkan = subsidi penuh"
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Kode Pos (satu per baris)
              </label>
              <textarea
                rows={3}
                value={form.postal_codes}
                onChange={(e) => setForm((f) => ({ ...f, postal_codes: e.target.value }))}
                placeholder="12190&#10;121*&#10;10000-14999"
                className={`${inputCls} font-mono text-xs resize-none`}
              />
              <p className="text-xs text-[#94A3B8] mt-1">
                Format: <code>12190</code> (eksak), <code>121*</code> (prefix), <code>10000-14999</code> (range). Kosong = semua.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Kode Kurir (pisahkan koma)
              </label>
              <input
                type="text"
                value={form.allowed_courier_codes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, allowed_courier_codes: e.target.value }))
                }
                placeholder="jne, sicepat, ide (kosong = semua)"
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Prioritas</label>
                <input
                  type="number"
                  value={form.priority}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, priority: Number(e.target.value) || 0 }))
                  }
                  className={inputCls}
                />
              </div>
              <label className="flex items-end gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="size-4 cursor-pointer accent-primary mb-3"
                />
                <span className="text-sm text-[#0F172A] mb-2.5">Aktifkan aturan</span>
              </label>
            </div>
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
