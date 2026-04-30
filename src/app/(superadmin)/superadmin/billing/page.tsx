import { redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

export default async function BillingPage() {
  const authClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) redirect("/sign-in");

  // Service client supaya bypass RLS dan menampilkan SEMUA invoice klien.
  const supabase = await createSupabaseServiceClient();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, amount, status, description, due_date, paid_at, created_at, clients(full_name)")
    .order("created_at", { ascending: false });

  const all = invoices ?? [];

  // Summary stats
  const pendingTotal = all
    .filter((inv) => inv.status === "pending")
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const paidThisMonth = all
    .filter((inv) => inv.status === "paid" && inv.paid_at && new Date(inv.paid_at) >= startOfMonth)
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

  const overdueCount = all.filter((inv) => inv.status === "overdue").length;

  const stats = [
    {
      label: "Total Pending",
      value: formatCurrency(pendingTotal),
      icon: Clock,
      color: "text-yellow-500",
      bg: "bg-yellow-50",
    },
    {
      label: "Dibayar Bulan Ini",
      value: formatCurrency(paidThisMonth),
      icon: CheckCircle2,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      label: "Jatuh Tempo",
      value: overdueCount,
      icon: AlertCircle,
      color: "text-red-400",
      bg: "bg-red-50",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tagihan</h1>
        <p className="text-foreground/60 mt-1 text-sm">Kelola semua invoice klien</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-background border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-4.5 h-4.5 ${color}`} />
              </div>
              <span className="text-xs text-foreground/60 font-medium">{label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Invoices Table */}
      <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm divide-y divide-border">
            <thead>
              <tr className="bg-muted">
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase w-10">
                  No
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Klien
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Keterangan
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Jumlah
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Jatuh Tempo
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Tanggal Bayar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {all.length > 0 ? (
                all.map((inv, idx) => {
                  const clientName =
                    (inv.clients as { full_name?: string } | null)?.full_name ?? "-";
                  return (
                    <tr key={inv.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 text-foreground/40 text-xs">{idx + 1}</td>
                      <td className="py-3 px-4 font-medium text-foreground">{clientName}</td>
                      <td className="py-3 px-4 text-foreground/70">{inv.description ?? "-"}</td>
                      <td className="py-3 px-4 text-foreground font-mono text-xs">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex text-xs font-medium px-2 py-1 rounded-full border ${
                            inv.status === "paid"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : inv.status === "overdue"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : "bg-yellow-100 text-yellow-700 border-yellow-200"
                          }`}
                        >
                          {inv.status === "paid"
                            ? "Lunas"
                            : inv.status === "overdue"
                            ? "Jatuh Tempo"
                            : "Pending"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-foreground/60 text-xs">
                        {formatDate(inv.due_date)}
                      </td>
                      <td className="py-3 px-4 text-foreground/60 text-xs">
                        {formatDate(inv.paid_at)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-foreground/40 text-sm">
                    Belum ada invoice
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
