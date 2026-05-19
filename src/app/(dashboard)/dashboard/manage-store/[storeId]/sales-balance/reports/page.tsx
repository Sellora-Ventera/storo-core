import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getStoreForUser } from "@/lib/store/context";
import {
  getSalesBalance,
  getSalesLedgerEntries,
  type SalesLedgerType,
} from "@/lib/sales-ledger";
import {
  StorePageHeader,
  StoreCard,
  StatusBadge,
  EmptyState,
  formatIDR,
  formatDate,
} from "@/components/dashboard/store/ui";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const VALID_TYPES: SalesLedgerType[] = ["sale", "withdrawal", "refund", "adjustment"];

function txTypeTone(
  type: string
): "success" | "danger" | "warning" | "info" | "neutral" {
  switch (type) {
    case "sale":
      return "success";
    case "withdrawal":
      return "info";
    case "refund":
      return "danger";
    case "adjustment":
      return "warning";
    default:
      return "neutral";
  }
}

function txTypeLabel(type: string): string {
  switch (type) {
    case "sale":
      return "Penjualan";
    case "withdrawal":
      return "Penarikan";
    case "refund":
      return "Refund";
    case "adjustment":
      return "Adjustment";
    default:
      return type;
  }
}

function parseTypesParam(raw: string | undefined): SalesLedgerType[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter((t): t is SalesLedgerType =>
      VALID_TYPES.includes(t as SalesLedgerType)
    );
}

function buildPageHref(
  storeId: string,
  page: number,
  from: string | undefined,
  to: string | undefined,
  typesCsv: string | undefined
): string {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (typesCsv) params.set("type", typesCsv);
  const qs = params.toString();
  return `/dashboard/manage-store/${storeId}/sales-balance/reports${qs ? `?${qs}` : ""}`;
}

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{
    page?: string;
    from?: string;
    to?: string;
    type?: string;
  }>;
}) {
  const { storeId } = await params;
  const sp = await searchParams;

  const { store } = await getStoreForUser(storeId);
  if (store.billing_model !== "storo_gateway") {
    redirect(`/dashboard/manage-store/${storeId}/wallet`);
  }

  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const from = sp.from || undefined;
  const to = sp.to || undefined;
  const types = parseTypesParam(sp.type);
  const typesCsv = types.length > 0 ? types.join(",") : undefined;

  // Convert from "YYYY-MM-DD" to ISO range
  const fromIso = from ? new Date(`${from}T00:00:00`).toISOString() : undefined;
  const toIso = to ? new Date(`${to}T23:59:59`).toISOString() : undefined;

  const [balance, ledger] = await Promise.all([
    getSalesBalance(storeId),
    getSalesLedgerEntries(storeId, {
      from: fromIso,
      to: toIso,
      types: types.length > 0 ? types : undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(ledger.total / PAGE_SIZE));
  const exportParams = new URLSearchParams();
  if (from) exportParams.set("from", fromIso!);
  if (to) exportParams.set("to", toIso!);
  if (typesCsv) exportParams.set("type", typesCsv);
  const exportHref = `/api/store/${storeId}/sales-ledger/export${
    exportParams.toString() ? `?${exportParams.toString()}` : ""
  }`;

  return (
    <div>
      <div className="mb-4">
        <Link
          href={`/dashboard/manage-store/${storeId}/sales-balance`}
          className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] transition cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Saldo Penjualan
        </Link>
      </div>

      <StorePageHeader
        title="Laporan Ledger"
        description="Filter dan ekspor histori saldo penjualan untuk audit & rekonsiliasi."
        actions={
          <a
            href={exportHref}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-full bg-primary text-white hover:bg-primary/90 transition cursor-pointer"
          >
            <Download className="size-3.5" />
            Export CSV
          </a>
        }
      />

      {/* Overall summary (all-time) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StoreCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
            Saldo Tersedia
          </p>
          <p className="text-xl font-bold text-[#0F172A] mt-1">
            {formatIDR(balance.available_balance)}
          </p>
        </StoreCard>
        <StoreCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
            Total Penjualan
          </p>
          <p className="text-xl font-bold text-emerald-600 mt-1">
            {formatIDR(balance.total_sales)}
          </p>
        </StoreCard>
        <StoreCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
            Total Penarikan
          </p>
          <p className="text-xl font-bold text-blue-600 mt-1">
            {formatIDR(balance.total_withdrawn)}
          </p>
        </StoreCard>
        <StoreCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
            Total Refund
          </p>
          <p className="text-xl font-bold text-red-600 mt-1">
            {formatIDR(balance.total_refunded)}
          </p>
        </StoreCard>
      </div>

      {/* Filter form (GET, server-side) */}
      <StoreCard className="mb-5">
        <form method="get" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label
                htmlFor="from"
                className="block text-xs font-semibold text-[#0F172A] mb-1"
              >
                Dari Tanggal
              </label>
              <input
                id="from"
                name="from"
                type="date"
                defaultValue={from ?? ""}
                className="w-full text-sm px-3 py-2 rounded-xl border border-[#E5E8EF] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label
                htmlFor="to"
                className="block text-xs font-semibold text-[#0F172A] mb-1"
              >
                Sampai Tanggal
              </label>
              <input
                id="to"
                name="to"
                type="date"
                defaultValue={to ?? ""}
                className="w-full text-sm px-3 py-2 rounded-xl border border-[#E5E8EF] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <p className="block text-xs font-semibold text-[#0F172A] mb-1">
                Tipe Transaksi
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {VALID_TYPES.map((t) => (
                  <label
                    key={t}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F172A] cursor-pointer bg-white border border-[#E5E8EF] hover:border-primary/40 px-3 py-1.5 rounded-full transition has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:text-primary"
                  >
                    <input
                      type="checkbox"
                      name="type"
                      value={t}
                      defaultChecked={types.includes(t)}
                      className="sr-only"
                    />
                    {txTypeLabel(t)}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Link
              href={`/dashboard/manage-store/${storeId}/sales-balance/reports`}
              className="text-xs font-medium text-[#64748B] hover:text-[#0F172A] px-3.5 py-2 rounded-full transition cursor-pointer"
            >
              Reset
            </Link>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full bg-primary text-white hover:bg-primary/90 transition cursor-pointer"
            >
              Terapkan Filter
            </button>
          </div>
        </form>
      </StoreCard>

      {/* Table */}
      <StoreCard padded={false}>
        <div className="px-5 py-4 border-b border-[#E5E8EF]">
          <h2 className="text-base font-semibold text-[#0F172A]">
            Entri Ledger
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Total {ledger.total} entri · Halaman {page} dari {totalPages}
          </p>
        </div>

        {ledger.entries.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Tidak ada entri"
            description="Tidak ada entri ledger yang cocok dengan filter yang dipilih."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E8EF]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                    Tipe
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider hidden md:table-cell">
                    Deskripsi
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider hidden lg:table-cell">
                    Referensi
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                    Jumlah
                  </th>
                </tr>
              </thead>
              <tbody>
                {ledger.entries.map((entry) => {
                  const isCredit = entry.amount > 0;
                  const reference =
                    entry.order_id ?? entry.disbursement_id ?? null;
                  return (
                    <tr
                      key={entry.id}
                      className="border-b border-[#F1F4FA] last:border-0 hover:bg-[#F8FAFC] transition"
                    >
                      <td className="px-5 py-3.5 text-[#64748B] whitespace-nowrap">
                        {formatDate(entry.created_at)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge tone={txTypeTone(entry.type)}>
                          {txTypeLabel(entry.type)}
                        </StatusBadge>
                      </td>
                      <td className="px-5 py-3.5 text-[#64748B] hidden md:table-cell max-w-xs truncate">
                        {entry.description ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-[#94A3B8] hidden lg:table-cell font-mono text-xs">
                        {reference ? reference.slice(0, 8) : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium whitespace-nowrap">
                        <span
                          className={`inline-flex items-center justify-end gap-1 ${
                            isCredit ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {isCredit ? (
                            <TrendingUp className="size-3.5" />
                          ) : (
                            <TrendingDown className="size-3.5" />
                          )}
                          {isCredit ? "+" : ""}
                          {formatIDR(entry.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {ledger.total > PAGE_SIZE ? (
          <div className="px-5 py-3 border-t border-[#E5E8EF] flex items-center justify-between">
            <p className="text-xs text-[#94A3B8]">
              Menampilkan {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, ledger.total)} dari {ledger.total}
            </p>
            <div className="flex items-center gap-1.5">
              {page > 1 ? (
                <Link
                  href={buildPageHref(storeId, page - 1, from, to, typesCsv)}
                  className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-[#E5E8EF] hover:bg-[#F8FAFC] transition cursor-pointer"
                >
                  <ChevronLeft className="size-3.5" />
                  Sebelumnya
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-[#F8FAFC] border border-[#E5E8EF] text-[#CBD5E1] cursor-not-allowed">
                  <ChevronLeft className="size-3.5" />
                  Sebelumnya
                </span>
              )}
              {page < totalPages ? (
                <Link
                  href={buildPageHref(storeId, page + 1, from, to, typesCsv)}
                  className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-[#E5E8EF] hover:bg-[#F8FAFC] transition cursor-pointer"
                >
                  Berikutnya
                  <ChevronRight className="size-3.5" />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-[#F8FAFC] border border-[#E5E8EF] text-[#CBD5E1] cursor-not-allowed">
                  Berikutnya
                  <ChevronRight className="size-3.5" />
                </span>
              )}
            </div>
          </div>
        ) : null}
      </StoreCard>
    </div>
  );
}
