import { getStoreForUser } from "@/lib/store/context";
import { getWallet, getTransactions } from "@/lib/wallet";
import {
  StorePageHeader,
  StoreCard,
  ChipButton,
  StatusBadge,
  EmptyState,
  formatIDR,
  formatDate,
} from "@/components/dashboard/store/ui";
import { Wallet, ArrowUpCircle, Info, TrendingDown, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

function txTypeTone(
  type: string
): "success" | "danger" | "warning" | "info" | "neutral" {
  switch (type) {
    case "topup":
    case "refund":
      return "success";
    case "ops_fee":
      return "danger";
    case "adjustment":
      return "warning";
    default:
      return "neutral";
  }
}

function txTypeLabel(type: string): string {
  switch (type) {
    case "topup":
      return "Top Up";
    case "ops_fee":
      return "Biaya Ops";
    case "refund":
      return "Refund";
    case "adjustment":
      return "Adjustment";
    default:
      return type;
  }
}

export default async function WalletPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const { store } = await getStoreForUser(storeId);

  const isStoroGateway = store.billing_model === "storo_gateway";

  const [wallet, transactions] = await Promise.all([
    getWallet(storeId),
    getTransactions(storeId, 20),
  ]);

  const balance = wallet?.balance ?? 0;
  const walletStatus = (wallet as { status?: string } | null)?.status ?? "active";

  return (
    <div>
      <StorePageHeader
        title="Wallet"
        description="Saldo prepaid untuk biaya operasional transaksi toko Anda."
        actions={
          <ChipButton
            href={`/dashboard/${storeId}/wallet/topup`}
            variant="primary"
            icon={<ArrowUpCircle className="size-3.5" />}
          >
            Top Up
          </ChipButton>
        }
      />

      {isStoroGateway ? (
        <StoreCard className="mb-5">
          <div className="flex items-start gap-3">
            <Info className="size-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#0F172A] mb-0.5">
                Wallet hanya dibutuhkan untuk mode &ldquo;Own Prepaid&rdquo;
              </p>
              <p className="text-sm text-[#64748B]">
                Toko Anda saat ini menggunakan <strong>Storo Gateway</strong>. Storo
                mengelola pembayaran dan otomatis memotong 5% sebelum disbursement ke
                Anda — tidak perlu top up wallet. Wallet diperlukan jika Anda beralih
                ke mode <em>Own Prepaid</em> (payment gateway milik sendiri), di mana
                Storo memotong 1% biaya operasional dari saldo wallet.
              </p>
            </div>
          </div>
        </StoreCard>
      ) : null}

      {/* Balance Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StoreCard className="sm:col-span-2 lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
            Saldo Wallet
          </p>
          <p className="text-3xl font-bold text-[#0F172A] mb-1">{formatIDR(balance)}</p>
          {wallet === null ? (
            <p className="text-xs text-[#94A3B8]">Belum ada aktivitas wallet.</p>
          ) : walletStatus === "suspended" ? (
            <div className="flex items-center gap-1.5 mt-1">
              <StatusBadge tone="danger">Ditangguhkan</StatusBadge>
              <span className="text-xs text-[#94A3B8]">Top up untuk mengaktifkan</span>
            </div>
          ) : walletStatus === "warning" ? (
            <div className="flex items-center gap-1.5 mt-1">
              <StatusBadge tone="warning">Saldo Rendah</StatusBadge>
              <span className="text-xs text-[#94A3B8]">
                Min {formatIDR(wallet.low_balance_threshold)}
              </span>
            </div>
          ) : (
            <StatusBadge tone="success">Aktif</StatusBadge>
          )}
        </StoreCard>

        <StoreCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
            Total Transaksi
          </p>
          <p className="text-3xl font-bold text-[#0F172A]">{transactions.length}</p>
          <p className="text-xs text-[#94A3B8] mt-1">20 transaksi terakhir</p>
        </StoreCard>

        <StoreCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
            Batas Minimum
          </p>
          <p className="text-3xl font-bold text-[#0F172A]">
            {formatIDR(wallet?.low_balance_threshold ?? 100_000)}
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">
            {wallet?.auto_suspend ? "Auto-suspend aktif" : "Auto-suspend nonaktif"}
          </p>
        </StoreCard>
      </div>

      {/* Transactions Table */}
      <StoreCard padded={false}>
        <div className="px-5 py-4 border-b border-[#E5E8EF]">
          <h2 className="text-base font-semibold text-[#0F172A]">
            Riwayat Transaksi
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">20 transaksi terbaru</p>
        </div>

        {transactions.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Belum ada transaksi"
            description="Top up wallet Anda untuk mulai menggunakan mode Own Prepaid."
            action={{
              label: "Top Up Sekarang",
              href: `/dashboard/${storeId}/wallet/topup`,
            }}
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
                  <th className="text-right px-5 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider hidden sm:table-cell">
                    Saldo Setelah
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isCredit = tx.amount > 0;
                  return (
                    <tr
                      key={tx.id}
                      className="border-b border-[#F1F4FA] last:border-0 hover:bg-[#F8FAFC] transition"
                    >
                      <td className="px-5 py-3.5 text-[#64748B] whitespace-nowrap">
                        {formatDate(tx.created_at)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge tone={txTypeTone(tx.type)}>
                          {txTypeLabel(tx.type)}
                        </StatusBadge>
                      </td>
                      <td className="px-5 py-3.5 text-[#64748B] hidden md:table-cell max-w-xs truncate">
                        {tx.description ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium whitespace-nowrap">
                        <span
                          className={`flex items-center justify-end gap-1 ${
                            isCredit ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {isCredit ? (
                            <TrendingUp className="size-3.5" />
                          ) : (
                            <TrendingDown className="size-3.5" />
                          )}
                          {isCredit ? "+" : ""}
                          {formatIDR(tx.amount)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-[#64748B] whitespace-nowrap hidden sm:table-cell">
                        {formatIDR(tx.balance_after)}
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
