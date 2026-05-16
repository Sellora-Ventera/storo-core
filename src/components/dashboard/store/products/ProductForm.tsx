"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, X, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { StoreCard, ChipButton } from "@/components/dashboard/store/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Category = { id: string; name: string };

type VariantRow = {
  key: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
};

type ImageRow = { key: string; url: string; preview?: string; file?: File };

export type ProductInitialData = {
  id?: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  sku: string | null;
  status: string;
  category_id: string | null;
  images: { url: string }[];
  variants?: { id?: string; name: string; sku: string | null; price: number; stock: number }[];
};

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Aktif" },
  { value: "delisted", label: "Delist" },
  { value: "archived", label: "Arsip" },
];

function getExtension(file: File) {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return map[file.type] ?? "jpg";
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatRupiah(val: number | "") {
  if (val === "" || val === 0) return val === 0 ? "0" : "";
  return new Intl.NumberFormat("id-ID").format(val);
}
function parseRupiah(s: string) {
  return s.replace(/\./g, "").replace(/[^\d]/g, "");
}

export default function ProductForm({
  storeId,
  categories,
  mode,
  initial,
}: {
  storeId: string;
  categories: Category[];
  mode: "create" | "edit";
  initial?: ProductInitialData;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugManual, setSlugManual] = useState(Boolean(initial?.slug));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState<number>(initial?.price ?? 0);
  const [compareAtPrice, setCompareAtPrice] = useState<number | "">(
    initial?.compare_at_price ?? ""
  );
  const [stock, setStock] = useState<number>(initial?.stock ?? 0);
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [status, setStatus] = useState(initial?.status ?? "draft");
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "");
  const [images, setImages] = useState<ImageRow[]>(
    (initial?.images ?? []).map((i) => ({
      key: crypto.randomUUID(),
      url: i.url,
    }))
  );
  const [draggingOver, setDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [variants, setVariants] = useState<VariantRow[]>(
    (initial?.variants ?? []).map((v) => ({
      key: crypto.randomUUID(),
      name: v.name,
      sku: v.sku ?? "",
      price: v.price,
      stock: v.stock,
    }))
  );

  useEffect(() => {
    if (!slugManual) setSlug(slugify(name));
  }, [name, slugManual]);

  const discount =
    compareAtPrice && Number(compareAtPrice) > price
      ? Math.round((1 - price / Number(compareAtPrice)) * 100)
      : null;

  const addFiles = useCallback((files: FileList | File[]) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    Array.from(files).forEach((file) => {
      if (!allowed.includes(file.type)) {
        toast.error(`${file.name}: hanya JPEG, PNG, WebP`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: maksimal 5 MB`);
        return;
      }
      const preview = URL.createObjectURL(file);
      setImages((prev) => [...prev, { key: crypto.randomUUID(), url: "", preview, file }]);
    });
  }, []);

  function removeImage(key: string) {
    setImages((prev) => {
      const item = prev.find((i) => i.key === key);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((i) => i.key !== key);
    });
  }

  const onFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDraggingOver(false);
      if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );
  function addVariant() {
    setVariants((prev) => [
      ...prev,
      { key: crypto.randomUUID(), name: "", sku: "", price, stock: 0 },
    ]);
  }
  function updateVariant(key: string, field: keyof VariantRow, val: string | number) {
    setVariants((prev) =>
      prev.map((v) => (v.key === key ? { ...v, [field]: val } : v))
    );
  }
  function removeVariant(key: string) {
    setVariants((prev) => prev.filter((v) => v.key !== key));
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Nama produk wajib diisi");
      return;
    }
    if (!price || price <= 0) {
      toast.error("Harga harus lebih dari 0");
      return;
    }
    setSaving(true);

    // Upload any new files to Supabase Storage
    const supabase = getSupabaseBrowserClient();
    const uploadedImages = await Promise.all(
      images.map(async (img) => {
        if (!img.file) return img;
        const ext = getExtension(img.file);
        const filename = `products/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from("product-images")
          .upload(filename, img.file, { contentType: img.file.type, upsert: false });
        if (error) {
          toast.error(`Gagal upload gambar: ${error.message}`);
          throw error;
        }
        const { data: { publicUrl } } = supabase.storage
          .from("product-images")
          .getPublicUrl(filename);
        if (img.preview) URL.revokeObjectURL(img.preview);
        return { ...img, url: publicUrl, file: undefined, preview: undefined };
      })
    ).catch(() => null);

    if (!uploadedImages) {
      setSaving(false);
      return;
    }

    const body = {
      name: name.trim(),
      slug: slug || slugify(name),
      description: description?.trim() || null,
      price,
      compare_at_price:
        compareAtPrice !== "" && Number(compareAtPrice) > price
          ? Number(compareAtPrice)
          : null,
      stock,
      sku: sku.trim() || null,
      status,
      category_id: categoryId || null,
      images: uploadedImages.map((i) => ({ url: i.url })),
      variants:
        variants.length > 0
          ? variants.map((v) => ({
              name: v.name,
              sku: v.sku || null,
              price: v.price,
              stock: v.stock,
            }))
          : undefined,
    };
    const url =
      mode === "edit" && initial?.id
        ? `/api/store/${storeId}/products/${initial.id}`
        : `/api/store/${storeId}/products`;
    const method = mode === "edit" ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal menyimpan produk");
        setSaving(false);
        return;
      }
      toast.success(mode === "edit" ? "Produk diperbarui" : "Produk ditambahkan");
      router.push(`/dashboard/manage-store/${storeId}/products`);
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan");
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-[#E5E8EF] bg-white px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition";

  return (
    <div className="grid gap-5 lg:grid-cols-3 pb-24 md:pb-0">
      <div className="lg:col-span-2 space-y-5">
        <StoreCard>
          <h2 className="text-sm font-semibold text-[#0F172A] mb-4">Informasi Produk</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Nama Produk <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama produk"
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
                placeholder="slug-produk-otomatis"
                className={`${inputCls} font-mono`}
              />
              <p className="text-xs text-[#94A3B8] mt-1">
                Auto-generate dari nama. Edit untuk kustomisasi.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Deskripsi
              </label>
              <textarea
                rows={5}
                value={description ?? ""}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Masukkan deskripsi produk…"
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>
        </StoreCard>

        <StoreCard>
          <h2 className="text-sm font-semibold text-[#0F172A] mb-4">Gambar Produk</h2>
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mb-3">
              {images.map((img, i) => (
                <div key={img.key} className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.preview ?? img.url}
                    alt=""
                    className="h-full w-full rounded-xl object-cover border border-[#E5E8EF]"
                  />
                  {i === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 rounded-md text-[10px] font-semibold bg-black/70 text-white px-1.5 py-0.5">
                      Utama
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(img.key)}
                    className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-red-600 cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div
            className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-8 px-4 transition cursor-pointer ${
              draggingOver
                ? "border-primary bg-primary/5"
                : "border-[#E5E8EF] hover:border-primary/40 hover:bg-gray-50"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDraggingOver(true); }}
            onDragLeave={() => setDraggingOver(false)}
            onDrop={onFileDrop}
          >
            <ImagePlus className="size-7 text-[#94A3B8]" />
            <p className="text-sm text-[#64748B]">
              Klik atau drag-drop gambar ke sini
            </p>
            <p className="text-xs text-[#94A3B8]">JPEG, PNG, WebP — maks. 5 MB per file</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
          />
          <p className="text-xs text-[#94A3B8] mt-2">Gambar pertama jadi gambar utama.</p>
        </StoreCard>

        <StoreCard>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#0F172A]">Varian Produk</h2>
            <ChipButton
              onClick={addVariant}
              variant="default"
              icon={<Plus className="size-3.5" />}
            >
              Tambah Varian
            </ChipButton>
          </div>
          {variants.length === 0 ? (
            <p className="text-sm text-[#94A3B8] text-center py-6">
              Belum ada varian. Klik &ldquo;Tambah Varian&rdquo;.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_140px_80px_100px_32px] gap-2 px-1">
                <span className="text-xs font-medium text-[#64748B]">Nama</span>
                <span className="text-xs font-medium text-[#64748B]">Harga</span>
                <span className="text-xs font-medium text-[#64748B]">Stok</span>
                <span className="text-xs font-medium text-[#64748B]">SKU</span>
                <span />
              </div>
              {variants.map((v) => (
                <div
                  key={v.key}
                  className="grid grid-cols-[1fr_140px_80px_100px_32px] gap-2 items-center"
                >
                  <input
                    type="text"
                    placeholder="cth: Merah - L"
                    value={v.name}
                    onChange={(e) => updateVariant(v.key, "name", e.target.value)}
                    className={inputCls.replace("py-2.5", "py-2")}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatRupiah(v.price)}
                    onChange={(e) => {
                      const raw = parseRupiah(e.target.value);
                      updateVariant(v.key, "price", raw === "" ? 0 : Number(raw));
                    }}
                    className={inputCls.replace("py-2.5", "py-2")}
                  />
                  <input
                    type="number"
                    min={0}
                    value={v.stock}
                    onChange={(e) => updateVariant(v.key, "stock", Number(e.target.value))}
                    className={inputCls.replace("py-2.5", "py-2")}
                  />
                  <input
                    type="text"
                    placeholder="SKU"
                    value={v.sku}
                    onChange={(e) => updateVariant(v.key, "sku", e.target.value)}
                    className={inputCls.replace("py-2.5", "py-2")}
                  />
                  <button
                    type="button"
                    onClick={() => removeVariant(v.key)}
                    className="flex items-center justify-center text-[#94A3B8] hover:text-red-500 transition cursor-pointer"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </StoreCard>
      </div>

      <div className="space-y-5">
        <StoreCard>
          <h2 className="text-sm font-semibold text-[#0F172A] mb-4">Harga & Stok</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Harga Jual <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formatRupiah(price)}
                onChange={(e) => {
                  const raw = parseRupiah(e.target.value);
                  setPrice(raw === "" ? 0 : Number(raw));
                }}
                placeholder="0"
                className={inputCls}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[#0F172A]">
                  Harga Coret
                </label>
                {discount ? (
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    -{discount}%
                  </span>
                ) : null}
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={formatRupiah(compareAtPrice)}
                onChange={(e) => {
                  const raw = parseRupiah(e.target.value);
                  setCompareAtPrice(raw === "" ? "" : Number(raw));
                }}
                placeholder="Kosongkan jika tanpa diskon"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Stok
              </label>
              <input
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                SKU
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Masukkan SKU"
                className={inputCls}
              />
            </div>
          </div>
        </StoreCard>

        <StoreCard>
          <h2 className="text-sm font-semibold text-[#0F172A] mb-3">Status</h2>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={`${inputCls} cursor-pointer`}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </StoreCard>

        <StoreCard>
          <h2 className="text-sm font-semibold text-[#0F172A] mb-3">Kategori</h2>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={`${inputCls} cursor-pointer`}
          >
            <option value="">Tanpa Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </StoreCard>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 bg-primary text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 cursor-pointer w-full"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Menyimpan…
              </>
            ) : mode === "edit" ? (
              "Simpan Perubahan"
            ) : (
              "Simpan Produk"
            )}
          </button>
          <ChipButton
            href={`/dashboard/manage-store/${storeId}/products`}
            variant="default"
          >
            Batal
          </ChipButton>
        </div>
      </div>
    </div>
  );
}
