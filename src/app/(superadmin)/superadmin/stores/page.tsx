import { redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
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
  const authClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) redirect("/sign-in");

  // Layout sudah memvalidasi superadmin via service role; pakai service client
  // di sini supaya bypass RLS dan menampilkan SEMUA toko, bukan hanya milik user.
  const supabase = await createSupabaseServiceClient();
  const { data: stores } = await supabase
    .from("onboarding_requests")
    .select("id, status, plan, template_name, store_url, created_at, clients(full_name, user_id)")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Semua Store</h1>
        <p className="text-foreground/60 mt-1 text-sm">
          Daftar semua store yang terdaftar di platform.{" "}
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
                  Klien
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Email / User ID
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Paket
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Template
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Domain
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Engine
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Tanggal
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stores && stores.length > 0 ? (
                stores.map((store, idx) => {
                  const status = (store.status as StatusKey) ?? "pending";
                  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
                  const client = store.clients as {
                    full_name?: string;
                    user_id?: string;
                  } | null;
                  return (
                    <tr key={store.id} className="hover:bg-muted/50">
                      <td className="py-3 px-4 text-foreground/40 text-xs">{idx + 1}</td>
                      <td className="py-3 px-4 font-medium text-foreground">
                        {client?.full_name ?? "-"}
                      </td>
                      <td className="py-3 px-4 text-foreground/60 font-mono text-xs truncate max-w-[120px]">
                        {client?.user_id ?? "-"}
                      </td>
                      <td className="py-3 px-4 capitalize text-foreground/60">{store.plan}</td>
                      <td className="py-3 px-4 text-foreground/60">{store.template_name ?? "-"}</td>
                      <td className="py-3 px-4 text-foreground/60 text-xs font-mono truncate max-w-[140px]">
                        {store.store_url ?? "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex text-xs font-medium px-2 py-1 rounded-full border ${config.color}`}
                        >
                          {config.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-foreground/40 text-xs font-mono">1.0.0</td>
                      <td className="py-3 px-4 text-foreground/60 text-xs">
                        {formatDate(store.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/superadmin/stores/${store.id}`}
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
