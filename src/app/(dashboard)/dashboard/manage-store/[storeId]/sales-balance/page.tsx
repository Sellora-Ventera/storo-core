import { redirect } from "next/navigation";
import { getStoreForUser } from "@/lib/store/context";
import { getSalesBalance, getRecentEntries } from "@/lib/sales-ledger";
import {
  StorePageHeader,
  StoreCard,
  ChipButton,
  StatusBadge,
  EmptyState,
  formatIDR,
  formatDate,
} from "@/components/dashboard/store/ui";
import {
  Coins,
  ArrowDownCircle,
  FileText,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Receipt,
  RotateCcw,
} from "lucide-react";

export const dynamic = "force-dynamic";

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

export default async function SalesBalancePage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const { store } = await getStoreForUser(storeId);

  if (store.billing_model !== "storo_gateway") {
    redirect(`/dashboard/manage-store/${storeId}/wallet`);
  }

  const [balance, entries] = await Promise.all([
    getSalesBalance(storeId),
    getRecentEntries(storeId, 20),
  ]);

  return (
    <div>
      <StorePageHeader
        title="Saldo Penjualan"
        description="Saldo dari pesanan selesai yang siap ditarik ke rekening Anda."
        actions={
          <>
            <ChipButton
              href={`/dashboard/manage-store/${storeId}/sales-balance/reports`}
              variant="default"
              icon={<FileText className="size-3.5" />}
            >
              Laporan
            </ChipButton>
            <ChipButton
              href={`/dashboard/manage-store/${storeId}/sales-balance/withdraw`}
              variant="primary"
              icon={<ArrowDownCircle className="size-3.5" />}
            >
              Tarik Saldo
            </ChipButton>
          </>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StoreCard className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
              Saldo Tersedia
            </p>
            <PiggyBank className="size-4 text-[#94A3B8]" />
          </div>
          <p className="text-3xl font-bold text-[#0F172A] mt-2">
            {formatIDR(balance.available_balance)}
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">Siap ditarik</p>
        </StoreCard>

        <StoreCard>
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
              Total Penjualan
            </p>
            <TrendingUp className="size-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">
            {formatIDR(balance.total_sales)}
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">Net 95% setelah fee</p>
        </StoreCard>

        <StoreCard>
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
              Total Penarikan
            </p>
            <Receipt className="size-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {formatIDR(balance.total_withdrawn)}
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">Sudah ditransfer</p>
        </StoreCard>

        <StoreCard>
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
              Total Refund
            </p>
            <RotateCcw className="size-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600 mt-2">
            {formatIDR(balance.total_refunded)}
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">Dikembalikan ke buyer</p>
        </StoreCard>
      </div>

      {/* Recent entries */}
      <StoreCard padded={false}>
        <div className="px-5 py-4 border-b border-[#E5E8EF] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A]">
              Riwayat Terbaru
            </h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              20 entri ledger terakhir
            </p>
          </div>
          <ChipButton
            href={`/dashboard/manage-store/${storeId}/sales-balance/reports`}
            variant="ghost"
          >
            Lihat semua
          </ChipButton>
        </div>

        {entries.length === 0 ? (
          <EmptyState
            icon={Coins}
            title="Belum ada aktivitas"
            description="Saldo penjualan akan otomatis bertambah 7 hari setelah pesanan terkirim ke pembeli."
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
                  <th className="text-right px-5 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                    Jumlah
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const isCredit = entry.amount > 0;
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
                      <td className="px-5 py-3.5 text-[#64748B] hidden md:table-cell max-w-md truncate">
                        {entry.description ?? "—"}
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
      </StoreCard>
    </div>
  );
}
