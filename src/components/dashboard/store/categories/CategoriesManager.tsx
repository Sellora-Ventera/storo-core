"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Pencil, X, Check } from "lucide-react";
import { toast } from "sonner";
import {
  StoreCard,
  ChipButton,
  StatusBadge,
} from "@/components/dashboard/store/ui";

export type CategoryNode = {
  id: string;
  name: string;
  slug: string | null;
  parent_id: string | null;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CategoriesManager({
  storeId,
  initial,
}: {
  storeId: string;
  initial: CategoryNode[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<CategoryNode[]>(initial);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const [newName, setNewName] = useState("");
  const [newParentId, setNewParentId] = useState<string>("");

  const tree = useMemo(() => {
    const byParent = new Map<string | null, CategoryNode[]>();
    for (const c of items) {
      const arr = byParent.get(c.parent_id) ?? [];
      arr.push(c);
      byParent.set(c.parent_id, arr);
    }
    return byParent;
  }, [items]);

  const inputCls =
    "w-full rounded-xl border border-[#E5E8EF] bg-white px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition";

  async function createCategory() {
    if (!newName.trim()) {
      toast.error("Nama kategori wajib diisi");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/store/${storeId}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          slug: slugify(newName),
          parent_id: newParentId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal menambah kategori");
        return;
      }
      setItems((prev) => [...prev, data.category as CategoryNode]);
      setNewName("");
      setNewParentId("");
      toast.success("Kategori ditambahkan");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function saveRename(id: string) {
    if (!editName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/store/${storeId}/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), slug: slugify(editName) }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal mengubah");
        return;
      }
      setItems((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, name: editName.trim(), slug: slugify(editName) }
            : c
        )
      );
      setEditingId(null);
      toast.success("Kategori diperbarui");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm("Hapus kategori ini?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/store/${storeId}/categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Gagal menghapus");
        return;
      }
      setItems((prev) => prev.filter((c) => c.id !== id && c.parent_id !== id));
      toast.success("Kategori dihapus");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function renderNode(node: CategoryNode, depth: number) {
    const children = tree.get(node.id) ?? [];
    const isEditing = editingId === node.id;
    return (
      <li key={node.id}>
        <div
          className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-[#F8F9FC] transition"
          style={{ paddingLeft: 12 + depth * 24 }}
        >
          {isEditing ? (
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveRename(node.id);
                if (e.key === "Escape") setEditingId(null);
              }}
              className={inputCls}
            />
          ) : (
            <>
              <span className="flex-1 text-sm text-[#0F172A] font-medium">
                {node.name}
              </span>
              {!node.is_active ? (
                <StatusBadge tone="neutral">Nonaktif</StatusBadge>
              ) : null}
            </>
          )}
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <button
                  onClick={() => saveRename(node.id)}
                  disabled={busy}
                  className="size-8 rounded-full hover:bg-emerald-50 text-emerald-600 grid place-items-center cursor-pointer disabled:opacity-50"
                >
                  <Check className="size-4" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="size-8 rounded-full hover:bg-slate-100 text-slate-500 grid place-items-center cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setEditingId(node.id);
                    setEditName(node.name);
                  }}
                  className="size-8 rounded-full hover:bg-slate-100 text-slate-500 grid place-items-center cursor-pointer"
                  aria-label="Edit"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={() => deleteCategory(node.id)}
                  disabled={busy}
                  className="size-8 rounded-full hover:bg-red-50 text-slate-500 hover:text-red-600 grid place-items-center cursor-pointer disabled:opacity-50"
                  aria-label="Hapus"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
        {children.length > 0 ? (
          <ul className="space-y-0.5">
            {children.map((child) => renderNode(child, depth + 1))}
          </ul>
        ) : null}
      </li>
    );
  }

  const roots = tree.get(null) ?? [];

  return (
    <div className="space-y-4">
      <StoreCard padded={false}>
        <div className="p-3">
          {roots.length === 0 ? (
            <p className="px-3 py-6 text-sm text-[#94A3B8] text-center">
              Belum ada kategori.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {roots.map((node) => renderNode(node, 0))}
            </ul>
          )}
        </div>
      </StoreCard>

      <StoreCard>
        <h2 className="text-sm font-semibold text-[#0F172A] mb-3">
          Tambah Kategori
        </h2>
        <div className="grid sm:grid-cols-[1fr_240px_auto] gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nama kategori"
            className={inputCls}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                createCategory();
              }
            }}
          />
          <select
            value={newParentId}
            onChange={(e) => setNewParentId(e.target.value)}
            className={`${inputCls} cursor-pointer`}
          >
            <option value="">— Tanpa Parent —</option>
            {items.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ChipButton
            onClick={createCategory}
            variant="primary"
            disabled={busy}
            icon={
              busy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Plus className="size-3.5" />
              )
            }
          >
            Tambah
          </ChipButton>
        </div>
      </StoreCard>
    </div>
  );
}
