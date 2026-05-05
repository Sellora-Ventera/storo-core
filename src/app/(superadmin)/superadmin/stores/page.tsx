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

export default async function AllStoresPage() {
  const authClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) redirect("/sign-in");

  // Layout sudah memvalidasi superadmin via service role; pakai service client
  // di sini supaya bypass RLS dan menampilkan SEMUA toko.
  const supabase = await createSupabaseServiceClient();

  // Source utama: tabel `stores` (storoengine schema, DB sama). Ini list toko
  // yang sudah live/deployed, bukan request onboarding.
  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, slug, user_id, is_active, created_at")
    .order("created_at", { ascending: false });

  const storeRows = stores ?? [];

  // Enrichment 1: lookup clients via stores.user_id → clients.user_id (auth uid).
  const ownerIds = Array.from(
    new Set(
      storeRows
        .map((s) => s.user_id)
        .filter((id): id is string => Boolean(id))
    )
  );
  const { data: clientRows } = ownerIds.length
    ? await supabase
        .from("clients")
        .select("id, full_name, user_id")
        .in("user_id", ownerIds)
    : { data: [] as Array<{ id: string; full_name: string | null; user_id: string }> };

  const clientByOwner = new Map<string, { id: string; full_name: string | null }>();
  for (const c of clientRows ?? []) {
    if (c.user_id) clientByOwner.set(c.user_id, { id: c.id, full_name: c.full_name });
  }

  // Enrichment 2: ambil onboarding_request terbaru per client untuk plan +
  // template + custom_domain (info yang tidak ada di tabel stores).
  const clientIds = Array.from(new Set(Array.from(clientByOwner.values()).map((c) => c.id)));
  const { data: requestRows } = clientIds.length
    ? await supabase
        .from("onboarding_requests")
        .select("client_id, plan, template_name, custom_domain, created_at")
        .in("client_id", clientIds)
        .order("created_at", { ascending: false })
    : { data: [] as Array<{ client_id: string; plan: string; template_name: string | null; custom_domain: string | null; created_at: string }> };

  const requestByClient = new Map<
    string,
    { plan: string; template_name: string | null; custom_domain: string | null }
  >();
  for (const r of requestRows ?? []) {
    if (r.client_id && !requestByClient.has(r.client_id)) {
      requestByClient.set(r.client_id, {
        plan: r.plan,
        template_name: r.template_name,
        custom_domain: r.custom_domain,
      });
    }
  }

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
                  Nama Toko
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Klien
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
                  Tanggal
                </th>
                <th className="text-left py-3 px-4 font-medium text-foreground/60 text-xs uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {storeRows.length > 0 ? (
                storeRows.map((store, idx) => {
                  const client = store.user_id ? clientByOwner.get(store.user_id) : null;
                  const req = client ? requestByClient.get(client.id) : null;
                  const domain = req?.custom_domain || `${store.slug}.storo.id`;
                  return (
                    <tr key={store.id} className="hover:bg-muted/50">
                      <td className="py-3 px-4 text-foreground/40 text-xs">{idx + 1}</td>
                      <td className="py-3 px-4 font-medium text-foreground">{store.name}</td>
                      <td className="py-3 px-4 text-foreground/70">
                        {client?.full_name ?? "-"}
                      </td>
                      <td className="py-3 px-4 capitalize text-foreground/60">
                        {req?.plan ?? "-"}
                      </td>
                      <td className="py-3 px-4 text-foreground/60">
                        {req?.template_name ?? "-"}
                      </td>
                      <td className="py-3 px-4 text-foreground/60 text-xs font-mono truncate max-w-[200px]">
                        {domain}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex text-xs font-medium px-2 py-1 rounded-full border ${
                            store.is_active
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {store.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
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
                  <td colSpan={9} className="py-10 text-center text-foreground/40 text-sm">
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
