import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Receipt, CreditCard, TrendingUp, CheckCircle2, Clock, AlertCircle } from "lucide-react";

function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

const INVOICE_STATUS_CONFIG = {
  paid: { label: "Lunas", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
  pending: { label: "Menunggu Pembayaran", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  overdue: { label: "Terlambat", color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle },
} as const;

const DISBURSE_STATUS_CONFIG = {
  pending: { label: "Menunggu", color: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Disetujui", color: "bg-blue-100 text-blue-700" },
  paid: { label: "Dibayar", color: "bg-green-100 text-green-700" },
} as const;

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  business: "Business",
  enterprise: "Enterprise",
};

export default async function BillingPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("clerk_user_id", user.id)
    .single();

  const [{ data: invoices }, { data: disbursements }, { data: latestRequest }] = await Promise.all([
    client
      ? supabase
          .from("invoices")
          .select("id, amount, status, plan, due_date, paid_at, created_at")
          .eq("client_id", client.id)
          .order("created_at", { ascending: false })
      : { data: [] },
    client
      ? supabase
          .from("disbursements")
          .select("id, period_label, gross_amount, net_amount, status, paid_at")
          .eq("client_id", client.id)
          .order("created_at", { ascending: false })
      : { data: [] },
    client
      ? supabase
          .from("onboarding_requests")
          .select("plan")
          .eq("client_id", client.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()
      : { data: null },
  ]);

  const activePlan = latestRequest?.plan ?? null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tagihan &amp; Pembayaran</h1>
        <p className="text-gray-500 mt-1">Kelola tagihan dan riwayat pembayaran Anda.</p>
      </div>

      {/* Active plan card */}
      <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Paket Aktif</p>
            <p className="text-xl font-bold text-gray-900">
              {activePlan ? `Paket ${PLAN_LABELS[activePlan] ?? activePlan}` : "Belum ada paket aktif"}
            </p>
          </div>
        </div>
      </div>

      {/* Invoices section */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          <Receipt className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Tagihan
          </h2>
        </div>

        {(!invoices || invoices.length === 0) ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Belum ada tagihan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Tanggal</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Keterangan</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Jumlah</th>
                  <th className="text-center text-xs font-semibold text-gray-500 px-5 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Jatuh Tempo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv) => {
                  const status = (inv.status as keyof typeof INVOICE_STATUS_CONFIG) ?? "pending";
                  const statusCfg = INVOICE_STATUS_CONFIG[status] ?? INVOICE_STATUS_CONFIG.pending;
                  const StatusIcon = statusCfg.icon;
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5 text-sm text-gray-600">
                        {new Date(inv.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-900 font-medium">
                        {inv.plan ? `Langganan Paket ${PLAN_LABELS[inv.plan] ?? inv.plan}` : "Tagihan"}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-900 font-semibold text-right tabular-nums">
                        {formatIDR(inv.amount)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${statusCfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">
                        {inv.due_date
                          ? new Date(inv.due_date).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Disbursements section */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-secondary" />
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Pencairan Dana
          </h2>
        </div>

        {(!disbursements || disbursements.length === 0) ? (
          <div className="p-12 text-center">
            <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Belum ada riwayat pencairan dana.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Periode</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Gross</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Net</th>
                  <th className="text-center text-xs font-semibold text-gray-500 px-5 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Tanggal Bayar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {disbursements.map((d) => {
                  const status = (d.status as keyof typeof DISBURSE_STATUS_CONFIG) ?? "pending";
                  const statusCfg = DISBURSE_STATUS_CONFIG[status] ?? DISBURSE_STATUS_CONFIG.pending;
                  return (
                    <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5 text-sm text-gray-900 font-medium">
                        {d.period_label ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-900 text-right tabular-nums">
                        {formatIDR(d.gross_amount)}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-green-700 text-right tabular-nums">
                        {formatIDR(d.net_amount)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">
                        {d.paid_at
                          ? new Date(d.paid_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
