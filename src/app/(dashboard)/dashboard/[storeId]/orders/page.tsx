export const dynamic = "force-dynamic";

import Link from "next/link";
import { Search, ShoppingCart } from "lucide-react";
import { getStoreForUser } from "@/lib/store/context";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  StorePageHeader,
  StoreCard,
  StatusBadge,
  EmptyState,
  ChipButton,
  formatIDR,
  formatDate,
} from "@/components/dashboard/store/ui";

const PAGE_SIZE = 20;

const STATUS_TABS = [
  { value: "", label: "Semua" },
  { value: "pending", label: "Pending" },
  { value: "awaiting_payment", label: "Menunggu Bayar" },
  { value: "paid", label: "Dibayar" },
  { value: "processing", label: "Diproses" },
  { value: "shipped", label: "Dikirim" },
  { value: "delivered", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

const STATUS_TONE: Record<string, "success" | "danger" | "warning" | "info" | "neutral"> = {
  pending: "warning",
  awaiting_payment: "warning",
  paid: "info",
  processing: "info",
  shipped: "success",
  delivered: "success",
  cancelled: "danger",
  refunded: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  awaiting_payment: "Menunggu Bayar",
  paid: "Dibayar",
  processing: "Diproses",
  shipped: "Dikirim",
  delivered: "Selesai",
  cancelled: "Dibatalkan",
  refunded: "Dikembalikan",
};

export default async function StoreOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { storeId } = await params;
  const sp = await searchParams;
  await getStoreForUser(storeId);

  const status = sp.status ?? "";
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createSupabaseServiceClient();

  let query = supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, customer_email, status, total_amount, created_at",
      { count: "exact" }
    )
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (status) query = query.eq("status", status);
  if (q) {
    query = query.or(
      `order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_email.ilike.%${q}%`
    );
  }

  const { data, count } = await query;
  const orders = data ?? [];
  const total = count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const filtered = Boolean(q || status);
  const basePath = `/dashboard/${storeId}/orders`;

  const rawParams = Object.fromEntries(
    Object.entries(sp).filter(([, v]) => v !== undefined)
  ) as Record<string, string>;

  function tabHref(s: string) {
    const p = new URLSearchParams(rawParams);
    if (s) p.set("status", s);
    else p.delete("status");
    p.delete("page");
    return `${basePath}${p.toString() ? `?${p}` : ""}`;
  }
  function pageHref(n: number) {
    const p = new URLSearchParams(rawParams);
    p.set("page", n.toString());
    return `${basePath}?${p.toString()}`;
  }

  return (
    <div>
      <StorePageHeader
        title="Pesanan"
        description={total > 0 ? `${total} pesanan` : "Kelola semua pesanan toko Anda"}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <form method="get" action={basePath} className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#94A3B8] pointer-events-none" />
          {status && <input type="hidden" name="status" value={status} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Cari nomor / pelanggan…"
            className="w-full bg-white border border-[#E5E8EF] rounded-full pl-9 pr-4 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </form>
        <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const isActive = status === tab.value;
            return (
              <Link
                key={tab.value}
                href={tabHref(tab.value)}
                className={`inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full transition cursor-pointer whitespace-nowrap ${
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
        {orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title={filtered ? "Tidak ada pesanan ditemukan" : "Belum ada pesanan"}
            description={
              filtered
                ? "Coba ubah filter atau kata kunci."
                : "Pesanan akan muncul di sini setelah pelanggan checkout di storefront."
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8F9FC] border-b border-[#F1F4FA]">
                    <th className="px-4 py-3 text-left font-medium text-[#64748B]">No. Pesanan</th>
                    <th className="px-4 py-3 text-left font-medium text-[#64748B]">Pelanggan</th>
                    <th className="px-4 py-3 text-right font-medium text-[#64748B]">Total</th>
                    <th className="px-4 py-3 text-left font-medium text-[#64748B]">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-[#64748B]">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr
                      key={o.id}
                      className="border-b border-[#F1F4FA] hover:bg-[#F8F9FC] transition cursor-pointer relative group"
                    >
                      <td className="relative px-4 py-3 font-mono text-xs text-[#0F172A]">
                        <Link
                          href={`${basePath}/${o.id}`}
                          className="absolute inset-0 z-0"
                          aria-label={`Detail pesanan ${o.order_number ?? o.id}`}
                        />
                        {o.order_number ?? `#${o.id.slice(0, 8)}`}
                      </td>
                      <td className="px-4 py-3 text-[#0F172A]">
                        <p className="font-medium line-clamp-1">{o.customer_name ?? "—"}</p>
                        {o.customer_email ? (
                          <p className="text-xs text-[#94A3B8] line-clamp-1">{o.customer_email}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-[#0F172A]">
                        {formatIDR(o.total_amount as number | string | null)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={STATUS_TONE[o.status as string] ?? "neutral"}>
                          {STATUS_LABEL[o.status as string] ?? (o.status as string)}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-[#64748B] text-xs">
                        {formatDate(o.created_at as string)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
