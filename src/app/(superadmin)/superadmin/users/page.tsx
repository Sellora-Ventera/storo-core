import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default async function AllUsersPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");
  const { data: clients } = await supabase
    .from("clients")
    .select("id, full_name, phone, referral_code, user_id, created_at")
    .order("created_at", { ascending: false });

  // Get store counts per client
  const { data: storeCounts } = await supabase
    .from("onboarding_requests")
    .select("client_id");

  const storeCountMap: Record<string, number> = {};
  storeCounts?.forEach((row) => {
    if (row.client_id) {
      storeCountMap[row.client_id] = (storeCountMap[row.client_id] ?? 0) + 1;
    }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Semua User</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Daftar semua klien terdaftar di platform.{" "}
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
                  Nama
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">
                  User ID
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">
                  WA
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">
                  Referral Code
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">
                  Toko
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
              {clients && clients.length > 0 ? (
                clients.map((client, idx) => (
                  <tr key={client.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{client.full_name ?? "-"}</td>
                    <td className="py-3 px-4 text-gray-400 font-mono text-xs truncate max-w-[140px]">
                      {client.user_id ?? "-"}
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">
                      {client.phone ?? "-"}
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">
                      {client.referral_code ?? "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-semibold text-gray-900">
                        {storeCountMap[client.id] ?? 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {formatDate(client.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/superadmin/users/${client.id}`}
                        className="text-blue-400 hover:text-blue-600 text-xs font-medium hover:underline"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-400 text-sm">
                    Belum ada user
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
