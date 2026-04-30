import { redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import Link from "next/link";

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default async function AllUsersPage() {
  const authClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) redirect("/sign-in");

  // Service client supaya bypass RLS dan menampilkan SEMUA klien.
  const supabase = await createSupabaseServiceClient();

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
        <h1 className="text-2xl font-bold text-foreground">Semua User</h1>
        <p className="text-foreground/60 mt-1 text-sm">
          Daftar semua klien terdaftar di platform.{" "}
          <span className="text-foreground/40 italic">Gunakan Ctrl+F untuk mencari.</span>
        </p>
      </div>

      <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase w-10">
                  No
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Nama
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  User ID
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  WA
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Referral Code
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Toko
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
              {clients && clients.length > 0 ? (
                clients.map((client, idx) => (
                  <tr key={client.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 text-foreground/40 text-xs">{idx + 1}</td>
                    <td className="py-3 px-4 font-medium text-foreground">{client.full_name ?? "-"}</td>
                    <td className="py-3 px-4 text-foreground/40 font-mono text-xs truncate max-w-[140px]">
                      {client.user_id ?? "-"}
                    </td>
                    <td className="py-3 px-4 text-foreground/70 font-mono text-xs">
                      {client.phone ?? "-"}
                    </td>
                    <td className="py-3 px-4 text-foreground/70 font-mono text-xs">
                      {client.referral_code ?? "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-semibold text-foreground">
                        {storeCountMap[client.id] ?? 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-foreground/60 text-xs">
                      {formatDate(client.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/superadmin/users/${client.id}`}
                        className="text-primary hover:text-primary/80 text-xs font-medium hover:underline"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-foreground/40 text-sm">
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
