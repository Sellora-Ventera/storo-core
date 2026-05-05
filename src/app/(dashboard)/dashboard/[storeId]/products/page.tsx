export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, Package, Search, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { getStoreForUser } from "@/lib/store/context";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  StorePageHeader,
  ChipButton,
  StoreCard,
  StatusBadge,
  EmptyState,
  formatIDR,
} from "@/components/dashboard/store/ui";

const PAGE_SIZE = 20;

const STATUS_TABS = [
  { value: "", label: "Semua" },
  { value: "active", label: "Aktif" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Arsip" },
  { value: "delisted", label: "Delist" },
];

function statusLabel(s: string) {
  return (
    { active: "Aktif", delisted: "Delist", archived: "Arsip", draft: "Draft" }[s] ?? s
  );
}
function statusTone(s: string): "success" | "danger" | "neutral" {
  if (s === "active") return "success";
  if (s === "delisted") return "danger";
  return "neutral";
}

type ProductRow = {
  id: string;
  name: string;
  slug: string | null;
  price: number;
  stock: number;
  status: string;
  sku: string | null;
  images: string[] | null;
  product_images?: { url: string; position: number }[] | null;
  product_variants?: { id: string }[] | null;
};

export default async function StoreProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
    sort?: string;
    order?: string;
  }>;
}) {
  const { storeId } = await params;
  const sp = await searchParams;
  await getStoreForUser(storeId);

  const q = sp.q?.trim() ?? "";
  const status = sp.status ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const sort = ["price", "stock"].includes(sp.sort ?? "") ? (sp.sort as string) : "";
  const order = sp.order === "asc" ? "asc" : "desc";

  const supabase = await createSupabaseServiceClient();
  let query = supabase
    .from("products")
    .select(
      "id, name, slug, price, stock, status, sku, images, product_images(url, position), product_variants(id)",
      { count: "exact" }
    )
    .eq("store_id", storeId);

  if (sort) query = query.order(sort, { ascending: order === "asc" });
  else query = query.order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (q) query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, count } = await query.range(from, to);

  const products = (data as ProductRow[]) ?? [];
  const total = count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const filtered = Boolean(q || status);
  const basePath = `/dashboard/${storeId}/products`;

  const rawParams = Object.fromEntries(
    Object.entries(sp).filter(([, v]) => v !== undefined)
  ) as Record<string, string>;

  function tabHref(tabStatus: string) {
    const p = new URLSearchParams(rawParams);
    if (tabStatus) p.set("status", tabStatus);
    else p.delete("status");
    p.delete("page");
    const qs = p.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  }

  function buildSortHref(col: string) {
    const p = new URLSearchParams(rawParams);
    p.set("sort", col);
    p.set("order", sort === col && order === "asc" ? "desc" : "asc");
    p.delete("page");
    return `${basePath}?${p.toString()}`;
  }

  function pageHref(n: number) {
    const p = new URLSearchParams(rawParams);
    p.set("page", n.toString());
    return `${basePath}?${p.toString()}`;
  }

  return (
    <div>
      <StorePageHeader
        title="Produk"
        description={total > 0 ? `${total} produk ditemukan` : "Kelola produk toko Anda"}
        actions={
          <ChipButton
            variant="primary"
            href={`${basePath}/new`}
            icon={<Plus className="size-3.5" />}
          >
            Tambah Produk
          </ChipButton>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <form method="get" action={basePath} className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#94A3B8] pointer-events-none" />
          {sort && <input type="hidden" name="sort" value={sort} />}
          {order && <input type="hidden" name="order" value={order} />}
          {status && <input type="hidden" name="status" value={status} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Cari nama atau SKU…"
            className="w-full bg-white border border-[#E5E8EF] rounded-full pl-9 pr-4 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </form>

        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_TABS.map((tab) => {
            const isActive = status === tab.value;
            return (
              <Link
                key={tab.value}
                href={tabHref(tab.value)}
                className={`inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full transition cursor-pointer ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white border border-[#E5E8EF] text-[#64748B] hover:bg-[#F8F9FC]"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      <StoreCard padded={false}>
        {products.length === 0 ? (
          <EmptyState
            icon={Package}
            title={filtered ? "Tidak ada produk ditemukan" : "Belum ada produk"}
            description={
              filtered
                ? "Coba ubah filter atau kata kunci pencarian."
                : "Mulai tambahkan produk ke toko Anda."
            }
            action={!filtered ? { label: "Tambah Produk", href: `${basePath}/new` } : undefined}
          />
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8F9FC] border-b border-[#F1F4FA]">
                    <th className="w-14 px-4 py-3" />
                    <th className="px-4 py-3 text-left font-medium text-[#64748B]">Nama</th>
                    <th className="w-36 px-4 py-3 text-left font-medium text-[#64748B]">SKU</th>
                    <th className="w-36 px-4 py-3 text-right font-medium text-[#64748B]">
                      <Link
                        href={buildSortHref("price")}
                        className="inline-flex items-center justify-end gap-1 hover:text-[#0F172A] transition cursor-pointer"
                      >
                        Harga
                        {sort === "price" ? (
                          order === "asc" ? (
                            <ChevronUp className="size-3 text-primary" />
                          ) : (
                            <ChevronDown className="size-3 text-primary" />
                          )
                        ) : (
                          <ChevronsUpDown className="size-3 text-[#94A3B8]" />
                        )}
                      </Link>
                    </th>
                    <th className="w-24 px-4 py-3 text-center font-medium text-[#64748B]">
                      <Link
                        href={buildSortHref("stock")}
                        className="inline-flex items-center justify-center gap-1 hover:text-[#0F172A] transition cursor-pointer"
                      >
                        Stok
                        {sort === "stock" ? (
                          order === "asc" ? (
                            <ChevronUp className="size-3 text-primary" />
                          ) : (
                            <ChevronDown className="size-3 text-primary" />
                          )
                        ) : (
                          <ChevronsUpDown className="size-3 text-[#94A3B8]" />
                        )}
                      </Link>
                    </th>
                    <th className="w-28 px-4 py-3 text-left font-medium text-[#64748B]">
                      Status
                    </th>
                    <th className="w-20 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const imageUrl =
                      product.product_images
                        ?.slice()
                        .sort((a, b) => a.position - b.position)[0]?.url ||
                      product.images?.[0];
                    const href = `${basePath}/${product.id}`;
                    return (
                      <tr
                        key={product.id}
                        className="relative group border-b border-[#F1F4FA] hover:bg-[#F8F9FC] transition-colors"
                      >
                        <td className="relative px-4 py-3">
                          {imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imageUrl}
                              alt=""
                              className="w-12 h-12 object-cover rounded-lg border border-[#E5E8EF]"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-[#F1F4FA] border border-[#E5E8EF] rounded-lg flex items-center justify-center">
                              <Package className="size-5 text-[#94A3B8]" />
                            </div>
                          )}
                        </td>
                        <td className="relative px-4 py-3">
                          <Link
                            href={href}
                            className="absolute inset-0 z-0"
                            aria-label={product.name}
                          />
                          <p className="font-medium text-[#0F172A] line-clamp-1 leading-snug">
                            {product.name}
                          </p>
                          {product.product_variants && product.product_variants.length > 0 && (
                            <p className="text-xs text-[#94A3B8] mt-0.5">
                              {product.product_variants.length} variasi
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-[#94A3B8]">
                          {product.sku ?? <span className="text-[#D1D5DB]">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums text-[#0F172A]">
                          {formatIDR(product.price)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {product.stock === 0 ? (
                            <StatusBadge tone="danger">Habis</StatusBadge>
                          ) : (
                            <span className="text-sm tabular-nums text-[#0F172A]">
                              {product.stock}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge tone={statusTone(product.status)}>
                            {statusLabel(product.status)}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChipButton href={href} variant="default">
                              Edit
                            </ChipButton>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden flex flex-col gap-3 p-4">
              {products.map((product) => {
                const imageUrl =
                  product.product_images
                    ?.slice()
                    .sort((a, b) => a.position - b.position)[0]?.url ||
                  product.images?.[0];
                const href = `${basePath}/${product.id}`;
                return (
                  <Link
                    key={product.id}
                    href={href}
                    className="flex items-start gap-3 p-3 rounded-xl border border-[#E5E8EF] bg-white hover:bg-[#F8F9FC] transition cursor-pointer"
                  >
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt=""
                        className="w-16 h-16 object-cover rounded-lg border border-[#E5E8EF] shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-[#F1F4FA] border border-[#E5E8EF] rounded-lg flex items-center justify-center shrink-0">
                        <Package className="size-6 text-[#94A3B8]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#0F172A] line-clamp-2 leading-snug">
                        {product.name}
                      </p>
                      {product.sku && (
                        <p className="text-[11px] font-mono text-[#94A3B8] mt-0.5 truncate">
                          SKU: {product.sku}
                        </p>
                      )}
                      <p className="mt-1 font-bold text-[#0F172A] tabular-nums">
                        {formatIDR(product.price)}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <StatusBadge tone={statusTone(product.status)}>
                          {statusLabel(product.status)}
                        </StatusBadge>
                        <span className="text-[11px] text-[#94A3B8]">
                          Stok: {product.stock}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="px-4 py-4 border-t border-[#F1F4FA] flex items-center justify-between gap-3 flex-wrap">
                <span className="text-xs text-[#64748B]">
                  Halaman {page} dari {totalPages} ({total} total)
                </span>
                <div className="flex items-center gap-1.5">
                  {page > 1 ? (
                    <ChipButton href={pageHref(page - 1)} variant="default">
                      Sebelumnya
                    </ChipButton>
                  ) : null}
                  {page < totalPages ? (
                    <ChipButton href={pageHref(page + 1)} variant="default">
                      Selanjutnya
                    </ChipButton>
                  ) : null}
                </div>
              </div>
            )}
          </>
        )}
      </StoreCard>
    </div>
  );
}
