import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

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

export default async function OnboardingQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: adminUser } = await supabase
    .from("superadmin_users")
    .select("id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!adminUser) redirect("/sign-in");

  const params = await searchParams;
  const activeFilter = params.status || "all";

  const { data: requests } = await supabase
    .from("onboarding_requests")
    .select("id, status, plan, template_name, store_url, created_at, clients(full_name, phone)")
    .order("created_at", { ascending: false });

  const all = requests ?? [];

  // Count per status
  const counts = {
    all: all.length,
    pending: all.filter((r) => r.status === "pending").length,
    reviewing: all.filter((r) => r.status === "reviewing").length,
    in_progress: all.filter((r) => r.status === "in_progress").length,
    rejected: all.filter((r) => r.status === "rejected").length,
  };

  const filtered =
    activeFilter === "all" ? all : all.filter((r) => r.status === activeFilter);

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
          <h1 className="text-2xl font-bold text-gray-900">Onboarding Queue</h1>
          <p className="text-gray-500 mt-1 text-sm">Kelola permintaan onboarding klien</p>
        </div>
        <Link
          href="/superadmin/onboarding"
          className="text-sm text-blue-400 hover:text-blue-500 font-medium border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Refresh
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 w-fit shadow-sm">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "all" ? "/superadmin/onboarding" : `/superadmin/onboarding?status=${tab.key}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === tab.key
                ? "bg-slate-700 text-white"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            {tab.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${
                activeFilter === tab.key ? "bg-slate-600 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {tab.count}
            </span>
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase w-10">
                  No
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">
                  Klien
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">
                  Kontak WA
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">
                  Paket
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">
                  Template
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">
                  Tanggal Daftar
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((req, idx) => {
                  const status = (req.status as StatusKey) ?? "pending";
                  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
                  const client = req.clients as { full_name?: string; phone?: string } | null;
                  return (
                    <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {client?.full_name ?? "-"}
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-mono text-xs">
                        {client?.phone ?? "-"}
                      </td>
                      <td className="py-3 px-4 capitalize text-gray-600">{req.plan}</td>
                      <td className="py-3 px-4 text-gray-600">{req.template_name ?? "-"}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex text-xs font-medium px-2 py-1 rounded-full border ${config.color}`}
                        >
                          {config.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">
                        {formatDate(req.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/superadmin/stores/${req.id}`}
                          className="text-blue-400 hover:text-blue-600 text-xs font-medium hover:underline"
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-400 text-sm">
                    Tidak ada data untuk filter ini
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
