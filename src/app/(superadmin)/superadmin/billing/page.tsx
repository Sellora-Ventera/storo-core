import { redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import BillingFilters from "@/components/superadmin/BillingFilters";

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

const PAGE_SIZE_OPTIONS = [10, 15, 20, 30] as const;
const DEFAULT_PAGE_SIZE = 10;

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; pageSize?: string; q?: string }>;
}) {
  const authClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) redirect("/sign-in");

  const params = await searchParams;
  const activeFilter = params.status || "all";

  const requestedPageSize = parseInt(params.pageSize ?? "", 10);
  const pageSize = (PAGE_SIZE_OPTIONS as readonly number[]).includes(requestedPageSize)
    ? requestedPageSize
    : DEFAULT_PAGE_SIZE;
  const requestedPage = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const searchQuery = (params.q ?? "").trim();

  // Service client supaya bypass RLS dan menampilkan SEMUA invoice klien.
  const supabase = await createSupabaseServiceClient();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, amount, status, description, due_date, paid_at, created_at, clients(full_name)")
    .order("created_at", { ascending: false });

  const all = invoices ?? [];

  // Summary stats — dihitung dari SEMUA data, bukan dari hasil filter.
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

  // Count per status untuk badge tab.
  const counts = {
    all: all.length,
    paid: all.filter((inv) => inv.status === "paid").length,
    pending: all.filter((inv) => inv.status === "pending").length,
    overdue: all.filter((inv) => inv.status === "overdue").length,
  };

  const filtered = all.filter((inv) => {
    if (activeFilter !== "all" && inv.status !== activeFilter) return false;
    if (!searchQuery) return true;
    const needle = searchQuery.toLowerCase();
    const clientName =
      (inv.clients as { full_name?: string } | null)?.full_name ?? "";
    return (
      clientName.toLowerCase().includes(needle) ||
      (inv.description ?? "").toLowerCase().includes(needle)
    );
  });

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(offset, offset + pageSize);

  const buildHref = (next: { status?: string; page?: number; pageSize?: number; q?: string }) => {
    const sp = new URLSearchParams();
    const status = next.status ?? activeFilter;
    if (status && status !== "all") sp.set("status", status);
    const ps = next.pageSize ?? pageSize;
    if (ps !== DEFAULT_PAGE_SIZE) sp.set("pageSize", String(ps));
    const p = next.page ?? currentPage;
    if (p !== 1) sp.set("page", String(p));
    const q = next.q ?? searchQuery;
    if (q) sp.set("q", q);
    const qs = sp.toString();
    return qs ? `/superadmin/billing?${qs}` : "/superadmin/billing";
  };

  const tabs: { key: string; label: string; count: number }[] = [
    { key: "all", label: "Semua", count: counts.all },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "paid", label: "Lunas", count: counts.paid },
    { key: "overdue", label: "Jatuh Tempo", count: counts.overdue },
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

      {/* Filters: status tabs + search + page size */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-background border border-border rounded-xl p-1 w-fit">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={buildHref({ status: tab.key, page: 1 })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                activeFilter === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/60 hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {tab.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${
                  activeFilter === tab.key
                    ? "bg-primary/80 text-primary-foreground"
                    : "bg-muted text-foreground/60"
                }`}
              >
                {tab.count}
              </span>
            </Link>
          ))}
        </div>

        <BillingFilters
          q={searchQuery}
          status={activeFilter}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          defaultPageSize={DEFAULT_PAGE_SIZE}
        />
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
              {paginated.length > 0 ? (
                paginated.map((inv, idx) => {
                  const clientName =
                    (inv.clients as { full_name?: string } | null)?.full_name ?? "-";
                  return (
                    <tr key={inv.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 text-foreground/40 text-xs">
                        {offset + idx + 1}
                      </td>
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
                    {searchQuery || activeFilter !== "all"
                      ? "Tidak ada data untuk filter ini"
                      : "Belum ada invoice"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      {totalItems > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-foreground/60 text-xs">
            Menampilkan{" "}
            <span className="font-medium text-foreground">
              {offset + 1}–{Math.min(offset + pageSize, totalItems)}
            </span>{" "}
            dari <span className="font-medium text-foreground">{totalItems}</span> data
          </p>

          <div className="flex items-center gap-1">
            {currentPage > 1 ? (
              <Link
                href={buildHref({ page: currentPage - 1 })}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              >
                Prev
              </Link>
            ) : (
              <span className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-foreground/30 cursor-not-allowed">
                Prev
              </span>
            )}

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={buildHref({ page: p })}
                className={`min-w-[2rem] text-center px-2 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  p === currentPage
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-foreground/70 hover:bg-muted/50"
                }`}
              >
                {p}
              </Link>
            ))}

            {currentPage < totalPages ? (
              <Link
                href={buildHref({ page: currentPage + 1 })}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              >
                Next
              </Link>
            ) : (
              <span className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-foreground/30 cursor-not-allowed">
                Next
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
