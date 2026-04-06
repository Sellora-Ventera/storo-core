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

export default async function AllStoresPage() {
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

  const { data: stores } = await supabase
    .from("onboarding_requests")
    .select("id, status, plan, template_name, store_url, created_at, clients(full_name, clerk_user_id)")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Semua Store</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Daftar semua store yang terdaftar di platform.{" "}
          <span className="text-gray-400 italic">Gunakan Ctrl+F untuk mencari.</span>
        </p>
      </div>

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
                  Email / User ID
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">
                  Paket
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">
                  Template
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">
                  Domain
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">
                  Engine
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">
                  Tanggal
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {stores && stores.length > 0 ? (
                stores.map((store, idx) => {
                  const status = (store.status as StatusKey) ?? "pending";
                  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
                  const client = store.clients as {
                    full_name?: string;
                    clerk_user_id?: string;
                  } | null;
                  return (
                    <tr key={store.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {client?.full_name ?? "-"}
                      </td>
                      <td className="py-3 px-4 text-gray-500 font-mono text-xs truncate max-w-[120px]">
                        {client?.clerk_user_id ?? "-"}
                      </td>
                      <td className="py-3 px-4 capitalize text-gray-600">{store.plan}</td>
                      <td className="py-3 px-4 text-gray-600">{store.template_name ?? "-"}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs font-mono truncate max-w-[140px]">
                        {store.store_url ?? "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex text-xs font-medium px-2 py-1 rounded-full border ${config.color}`}
                        >
                          {config.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-xs font-mono">1.0.0</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">
                        {formatDate(store.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/superadmin/stores/${store.id}`}
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
                  <td colSpan={10} className="py-10 text-center text-gray-400 text-sm">
                    Belum ada store
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
