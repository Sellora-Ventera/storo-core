export const dynamic = "force-dynamic";

import Link from "next/link";
import { Search, Users } from "lucide-react";
import { getStoreForUser } from "@/lib/store/context";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  StorePageHeader,
  StoreCard,
  EmptyState,
  ChipButton,
  formatIDR,
  formatDate,
} from "@/components/dashboard/store/ui";

const PAGE_SIZE = 20;

export default async function StoreCustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { storeId } = await params;
  const sp = await searchParams;
  await getStoreForUser(storeId);

  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createSupabaseServiceClient();
  let query = supabase
    .from("customers")
    .select(
      "id, name, email, phone, total_orders, total_spent, created_at, last_order_at",
      { count: "exact" }
    )
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);

  const { data, count } = await query;
  const customers = data ?? [];
  const total = count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const filtered = Boolean(q);
  const basePath = `/dashboard/${storeId}/customers`;

  function pageHref(n: number) {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    p.set("page", n.toString());
    return `${basePath}?${p.toString()}`;
  }

  return (
    <div>
      <StorePageHeader
        title="Pelanggan"
        description={total > 0 ? `${total} pelanggan` : "Pelanggan toko Anda"}
      />

      <form method="get" action={basePath} className="relative max-w-xs w-full mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#94A3B8] pointer-events-none" />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Cari nama / email / telepon…"
          className="w-full bg-white border border-[#E5E8EF] rounded-full pl-9 pr-4 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
        />
      </form>

      <StoreCard padded={false}>
        {customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={filtered ? "Tidak ada pelanggan ditemukan" : "Belum ada pelanggan"}
            description={
              filtered
                ? "Coba ubah kata kunci pencarian."
                : "Pelanggan akan muncul setelah ada yang berbelanja di storefront."
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8F9FC] border-b border-[#F1F4FA]">
                    <th className="px-4 py-3 text-left font-medium text-[#64748B]">Nama</th>
                    <th className="px-4 py-3 text-left font-medium text-[#64748B]">Kontak</th>
                    <th className="px-4 py-3 text-center font-medium text-[#64748B]">Pesanan</th>
                    <th className="px-4 py-3 text-right font-medium text-[#64748B]">Total Belanja</th>
                    <th className="px-4 py-3 text-left font-medium text-[#64748B]">Bergabung</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-[#F1F4FA] hover:bg-[#F8F9FC] transition"
                    >
                      <td className="px-4 py-3 text-[#0F172A] font-medium">
                        {c.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[#64748B] text-xs">
                        {c.email ? <p className="line-clamp-1">{c.email}</p> : null}
                        {c.phone ? <p className="line-clamp-1">{c.phone}</p> : null}
                        {!c.email && !c.phone ? "—" : null}
                      </td>
                      <td className="px-4 py-3 text-center text-[#0F172A] tabular-nums">
                        {c.total_orders ?? 0}
                      </td>
                      <td className="px-4 py-3 text-right text-[#0F172A] tabular-nums font-semibold">
                        {formatIDR(c.total_spent as number | string | null)}
                      </td>
                      <td className="px-4 py-3 text-[#64748B] text-xs">
                        {formatDate(c.created_at as string)}
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
