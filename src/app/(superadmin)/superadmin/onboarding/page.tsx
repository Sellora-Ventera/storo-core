import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import Link from "next/link";
import OnboardingFilters from "@/components/superadmin/OnboardingFilters";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  reviewing: { label: "Reviewing", color: "bg-blue-100 text-blue-700 border-blue-200" },
  in_progress: { label: "In Progress", color: "bg-orange-100 text-orange-700 border-orange-200" },
  live: { label: "Live", color: "bg-green-100 text-green-700 border-green-200" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700 border-red-200" },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const PAGE_SIZE_OPTIONS = [10, 15, 20, 30] as const;
const DEFAULT_PAGE_SIZE = 10;

export default async function OnboardingQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; pageSize?: string; q?: string }>;
}) {
  const sessionClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) redirect("/sign-in");
  const params = await searchParams;
  const activeFilter = params.status || "all";

  const requestedPageSize = parseInt(params.pageSize ?? "", 10);
  const pageSize = (PAGE_SIZE_OPTIONS as readonly number[]).includes(requestedPageSize)
    ? requestedPageSize
    : DEFAULT_PAGE_SIZE;
  const requestedPage = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const searchQuery = (params.q ?? "").trim();

  // Layout sudah gating superadmin → pakai service role di sini supaya RLS
  // tidak filter `onboarding_requests` ke milik user login saja, dan supaya
  // bisa baca `onboarding_leads` (RLS `FOR ALL USING (false)`).
  const adminClient = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { data: requests } = await adminClient
    .from("onboarding_requests")
    .select(
      "id, status, plan, template_name, store_url, requested_slug, custom_domain, client_id, created_at, clients(full_name, phone)"
    )
    .order("created_at", { ascending: false });

  const all = requests ?? [];

  const clientIds = Array.from(
    new Set(all.map((r) => r.client_id).filter((id): id is string => Boolean(id)))
  );
  const { data: leads } = clientIds.length
    ? await adminClient
        .from("onboarding_leads")
        .select("client_id, email, created_at")
        .in("client_id", clientIds)
        .order("created_at", { ascending: false })
    : { data: [] as Array<{ client_id: string; email: string | null; created_at: string }> };

  const emailByClient = new Map<string, string>();
  for (const lead of leads ?? []) {
    if (lead.client_id && lead.email && !emailByClient.has(lead.client_id)) {
      emailByClient.set(lead.client_id, lead.email);
    }
  }

  // Fallback: kalau client_id tidak punya lead (lead lama tanpa client_id link),
  // ambil email dari auth.users via admin API.
  const missingClientIds = clientIds.filter((id) => !emailByClient.has(id));
  if (missingClientIds.length) {
    const { data: clientRows } = await adminClient
      .from("clients")
      .select("id, user_id")
      .in("id", missingClientIds);

    const userIds = (clientRows ?? [])
      .map((c) => c.user_id)
      .filter((id): id is string => Boolean(id));

    if (userIds.length) {
      const { data: usersResp } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      const emailByUser = new Map<string, string>(
        (usersResp?.users ?? [])
          .filter((u) => u.email)
          .map((u) => [u.id, u.email as string])
      );
      for (const c of clientRows ?? []) {
        if (c.user_id && emailByUser.has(c.user_id)) {
          emailByClient.set(c.id, emailByUser.get(c.user_id)!);
        }
      }
    }
  }

  // Count per status
  const counts = {
    all: all.length,
    pending: all.filter((r) => r.status === "pending").length,
    reviewing: all.filter((r) => r.status === "reviewing").length,
    in_progress: all.filter((r) => r.status === "in_progress").length,
    rejected: all.filter((r) => r.status === "rejected").length,
  };

  // Prioritas: reviewing → pending → in_progress → live → rejected.
  // Dalam status yang sama, tetap urut created_at terbaru dulu.
  const STATUS_PRIORITY: Record<string, number> = {
    reviewing: 0,
    pending: 1,
    in_progress: 2,
    live: 3,
    rejected: 4,
  };
  const sorted = [...all].sort((a, b) => {
    const pa = STATUS_PRIORITY[a.status] ?? 99;
    const pb = STATUS_PRIORITY[b.status] ?? 99;
    if (pa !== pb) return pa - pb;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const filtered = sorted.filter((r) => {
    if (activeFilter !== "all" && r.status !== activeFilter) return false;
    if (!searchQuery) return true;
    const needle = searchQuery.toLowerCase();
    const client = r.clients as { full_name?: string; phone?: string } | null;
    const email = r.client_id ? emailByClient.get(r.client_id) : "";
    const domain =
      r.custom_domain || (r.requested_slug ? `${r.requested_slug}.storo.id` : "");
    return (
      (client?.full_name ?? "").toLowerCase().includes(needle) ||
      (client?.phone ?? "").toLowerCase().includes(needle) ||
      (email ?? "").toLowerCase().includes(needle) ||
      domain.toLowerCase().includes(needle) ||
      (r.template_name ?? "").toLowerCase().includes(needle) ||
      (r.plan ?? "").toLowerCase().includes(needle)
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
    return qs ? `/superadmin/onboarding?${qs}` : "/superadmin/onboarding";
  };

  const tabs: { key: string; label: string; count: number }[] = [
    { key: "all", label: "Semua", count: counts.all },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "reviewing", label: "Reviewing", count: counts.reviewing },
    { key: "in_progress", label: "In Progress", count: counts.in_progress },
    { key: "rejected", label: "Rejected", count: counts.rejected },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Onboarding Queue</h1>
          <p className="text-foreground/60 mt-1 text-sm">Kelola permintaan onboarding klien</p>
        </div>
        <Link
          href="/superadmin/onboarding"
          className="text-sm text-primary hover:text-primary/80 font-medium border border-border px-3 py-1.5 rounded-lg hover:bg-muted/50 transition-colors"
        >
          Refresh
        </Link>
      </div>

      {/* Filters: status tabs + search + page size — single row, wrap on mobile */}
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
                  activeFilter === tab.key ? "bg-primary/80 text-primary-foreground" : "bg-muted text-foreground/60"
                }`}
              >
                {tab.count}
              </span>
            </Link>
          ))}
        </div>

        <OnboardingFilters
          q={searchQuery}
          status={activeFilter}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          defaultPageSize={DEFAULT_PAGE_SIZE}
        />
      </div>

      {/* Table */}
      <div className="bg-background border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase w-10">
                  No
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Klien
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Kontak WA
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Email
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Domain
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Paket
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Template
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Tanggal Daftar
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.length > 0 ? (
                paginated.map((req, idx) => {
                  const status = (req.status as StatusKey) ?? "pending";
                  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
                  const client = req.clients as { full_name?: string; phone?: string } | null;
                  const email = req.client_id ? emailByClient.get(req.client_id) : undefined;
                  const domain =
                    req.custom_domain ||
                    (req.requested_slug ? `${req.requested_slug}.storo.id` : null);
                  return (
                    <tr key={req.id} className="hover:bg-muted/50">
                      <td className="py-3 px-4 text-foreground/40 text-xs">{offset + idx + 1}</td>
                      <td className="py-3 px-4 font-medium text-foreground">
                        {client?.full_name ?? "-"}
                      </td>
                      <td className="py-3 px-4 text-foreground/70 font-mono text-xs">
                        {client?.phone ?? "-"}
                      </td>
                      <td className="py-3 px-4 text-foreground/70 text-xs">
                        {email ?? "-"}
                      </td>
                      <td className="py-3 px-4 text-foreground/70 font-mono text-xs">
                        {domain ?? "-"}
                      </td>
                      <td className="py-3 px-4 capitalize text-foreground/70">{req.plan}</td>
                      <td className="py-3 px-4 text-foreground/70">{req.template_name ?? "-"}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex text-xs font-medium px-2 py-1 rounded-full border ${config.color}`}
                        >
                          {config.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-foreground/60 text-xs">
                        {formatDate(req.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/superadmin/stores/${req.id}`}
                          className="text-primary hover:text-primary/80 text-xs font-medium hover:underline"
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-foreground/40 text-sm">
                    Tidak ada data untuk filter ini
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
            dari{" "}
            <span className="font-medium text-foreground">{totalItems}</span> data
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
