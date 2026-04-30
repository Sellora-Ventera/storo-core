import { redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import Link from "next/link";
import { Plus } from "lucide-react";

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatCurrency = (amount: number | null) => {
  if (amount === null || amount === undefined) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default async function DisbursementsPage() {
  const authClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) redirect("/sign-in");

  // Service client supaya bypass RLS dan menampilkan SEMUA disbursement.
  const supabase = await createSupabaseServiceClient();

  const { data: disbursements } = await supabase
    .from("disbursements")
    .select("id, store_id, period_label, gross_amount, pg_fee, ops_fee, net_amount, status, paid_at, created_at, onboarding_requests(store_url)")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Disbursement</h1>
          <p className="text-foreground/60 mt-1 text-sm">Kelola pembayaran ke klien</p>
        </div>
        <Link
          href="/superadmin/disbursements/new"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Buat Disbursement
        </Link>
      </div>

      <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm divide-y divide-border">
            <thead>
              <tr className="bg-muted">
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase w-10">
                  No
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Store
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Periode
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Gross
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Fee PG
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Fee Ops
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Net
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Tanggal Bayar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {disbursements && disbursements.length > 0 ? (
                disbursements.map((d, idx) => {
                  const storeUrl =
                    (d.onboarding_requests as { store_url?: string } | null)?.store_url ?? d.store_id;
                  return (
                    <tr key={d.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 text-foreground/40 text-xs">{idx + 1}</td>
                      <td className="py-3 px-4 text-foreground font-mono text-xs truncate max-w-[140px]">
                        {storeUrl ?? "-"}
                      </td>
                      <td className="py-3 px-4 text-foreground/70">{d.period_label ?? "-"}</td>
                      <td className="py-3 px-4 text-foreground font-mono text-xs">
                        {formatCurrency(d.gross_amount)}
                      </td>
                      <td className="py-3 px-4 text-red-400 font-mono text-xs">
                        {formatCurrency(d.pg_fee)}
                      </td>
                      <td className="py-3 px-4 text-red-400 font-mono text-xs">
                        {formatCurrency(d.ops_fee)}
                      </td>
                      <td className="py-3 px-4 text-green-600 font-mono text-xs font-semibold">
                        {formatCurrency(d.net_amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex text-xs font-medium px-2 py-1 rounded-full border ${
                            d.status === "paid"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : d.status === "processing"
                              ? "bg-blue-100 text-blue-700 border-blue-200"
                              : "bg-yellow-100 text-yellow-700 border-yellow-200"
                          }`}
                        >
                          {d.status === "paid" ? "Lunas" : d.status === "processing" ? "Diproses" : "Pending"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-foreground/60 text-xs">{formatDate(d.paid_at)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-foreground/40 text-sm">
                    Belum ada disbursement
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
