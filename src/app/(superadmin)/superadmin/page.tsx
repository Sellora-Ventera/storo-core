import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Users,
  ClipboardList,
  Store,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  reviewing: { label: "Reviewing", color: "bg-blue-100 text-blue-700 border-blue-200" },
  in_progress: { label: "In Progress", color: "bg-orange-100 text-orange-700 border-orange-200" },
  live: { label: "Live", color: "bg-green-100 text-green-700 border-green-200" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700 border-red-200" },
} as const;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default async function SuperadminOverviewPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");
  // KPI: Total clients
  const { count: totalClients } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true });

  // KPI: Pending onboarding
  const { count: pendingCount } = await supabase
    .from("onboarding_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  // KPI: Live stores
  const { count: liveCount } = await supabase
    .from("onboarding_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "live");

  // KPI: MRR — sum of paid invoices this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: paidInvoices } = await supabase
    .from("invoices")
    .select("amount")
    .eq("status", "paid")
    .gte("created_at", startOfMonth.toISOString());

  const mrr = paidInvoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0) ?? 0;

  // Recent onboarding requests (last 5)
  const { data: recentOnboarding } = await supabase
    .from("onboarding_requests")
    .select("id, status, plan, created_at, clients(full_name)")
    .order("created_at", { ascending: false })
    .limit(5);

  // Recent invoices (last 5)
  const { data: recentInvoices } = await supabase
    .from("invoices")
    .select("id, amount, status, created_at, clients(full_name)")
    .order("created_at", { ascending: false })
    .limit(5);

  const kpis = [
    {
      label: "Total Klien",
      value: totalClients ?? 0,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-50",
    },
    {
      label: "Pending Onboarding",
      value: pendingCount ?? 0,
      icon: ClipboardList,
      color: (pendingCount ?? 0) > 0 ? "text-orange-500" : "text-blue-400",
      bg: (pendingCount ?? 0) > 0 ? "bg-orange-50" : "bg-blue-50",
    },
    {
      label: "Toko Aktif",
      value: liveCount ?? 0,
      icon: Store,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      label: "MRR Bulan Ini",
      value: formatCurrency(mrr),
      icon: TrendingUp,
      color: "text-blue-400",
      bg: "bg-blue-50",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 mt-1 text-sm">Ringkasan platform Storo.id</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-4.5 h-4.5 ${color}`} />
              </div>
              <span className="text-xs text-gray-500 font-medium">{label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Recent Onboarding */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Onboarding Terbaru</h2>
          <Link
            href="/superadmin/onboarding"
            className="text-sm text-blue-400 hover:text-blue-500 font-medium"
          >
            Lihat Semua
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 font-medium text-gray-500 text-xs uppercase">
                  Klien
                </th>
                <th className="text-left py-2 pr-4 font-medium text-gray-500 text-xs uppercase">
                  Plan
                </th>
                <th className="text-left py-2 pr-4 font-medium text-gray-500 text-xs uppercase">
                  Status
                </th>
                <th className="text-left py-2 font-medium text-gray-500 text-xs uppercase">
                  Tanggal
                </th>
              </tr>
            </thead>
            <tbody>
              {recentOnboarding && recentOnboarding.length > 0 ? (
                recentOnboarding.map((req) => {
                  const status = (req.status as keyof typeof STATUS_CONFIG) ?? "pending";
                  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
                  const clientName =
                    (req.clients as { full_name?: string } | null)?.full_name ?? "-";
                  return (
                    <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium text-gray-900">{clientName}</td>
                      <td className="py-3 pr-4 capitalize text-gray-600">{req.plan}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex text-xs font-medium px-2 py-1 rounded-full border ${config.color}`}
                        >
                          {config.label}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500 text-xs">{formatDate(req.created_at)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-400 text-sm">
                    Belum ada data onboarding
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Invoice Terbaru</h2>
          <Link
            href="/superadmin/billing"
            className="text-sm text-blue-400 hover:text-blue-500 font-medium"
          >
            Lihat Semua
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 font-medium text-gray-500 text-xs uppercase">
                  Klien
                </th>
                <th className="text-left py-2 pr-4 font-medium text-gray-500 text-xs uppercase">
                  Jumlah
                </th>
                <th className="text-left py-2 pr-4 font-medium text-gray-500 text-xs uppercase">
                  Status
                </th>
                <th className="text-left py-2 font-medium text-gray-500 text-xs uppercase">
                  Tanggal
                </th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices && recentInvoices.length > 0 ? (
                recentInvoices.map((inv) => {
                  const clientName =
                    (inv.clients as { full_name?: string } | null)?.full_name ?? "-";
                  return (
                    <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium text-gray-900">{clientName}</td>
                      <td className="py-3 pr-4 text-gray-900 font-mono text-xs">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex text-xs font-medium px-2 py-1 rounded-full border ${
                            inv.status === "paid"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : inv.status === "overdue"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : "bg-yellow-100 text-yellow-700 border-yellow-200"
                          }`}
                        >
                          {inv.status === "paid" ? "Lunas" : inv.status === "overdue" ? "Jatuh Tempo" : "Pending"}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500 text-xs">{formatDate(inv.created_at)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-400 text-sm">
                    Belum ada data invoice
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
