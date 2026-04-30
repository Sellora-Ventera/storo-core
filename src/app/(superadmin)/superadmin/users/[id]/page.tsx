import { redirect, notFound } from "next/navigation";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const authClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) redirect("/sign-in");
  const { id } = await params;

  // Service client supaya superadmin bisa lihat detail klien manapun, bukan hanya
  // miliknya sendiri.
  const supabase = await createSupabaseServiceClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, full_name, phone, referral_code, user_id, created_at")
    .eq("id", id)
    .single();

  if (!client) notFound();

  const { data: stores } = await supabase
    .from("onboarding_requests")
    .select("id, status, plan, template_name, store_url, created_at")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, amount, status, description, due_date, paid_at, created_at")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/superadmin/users"
        className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Semua User
      </Link>

      {/* Client Info Card */}
      <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
        <h1 className="text-xl font-bold text-foreground mb-4">{client.full_name ?? "User Detail"}</h1>
        <dl className="grid sm:grid-cols-2 gap-3">
          <div>
            <dt className="text-xs text-foreground/60 mb-1">WhatsApp</dt>
            <dd className="text-sm font-medium text-foreground font-mono">{client.phone ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-xs text-foreground/60 mb-1">Referral Code</dt>
            <dd className="text-sm font-medium text-foreground font-mono">
              {client.referral_code ?? "-"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-foreground/60 mb-1">User ID</dt>
            <dd className="text-sm text-foreground/40 font-mono text-xs">{client.user_id ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-xs text-foreground/60 mb-1">Tanggal Daftar</dt>
            <dd className="text-sm font-medium text-foreground">{formatDate(client.created_at)}</dd>
          </div>
        </dl>
      </div>

      {/* Stores */}
      <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold text-foreground mb-4">
          Store ({stores?.length ?? 0})
        </h2>
        {stores && stores.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="text-left py-2 pr-4 font-medium text-foreground/60 text-xs uppercase">
                    Paket
                  </th>
                  <th className="text-left py-2 pr-4 font-medium text-foreground/60 text-xs uppercase">
                    Template
                  </th>
                  <th className="text-left py-2 pr-4 font-medium text-foreground/60 text-xs uppercase">
                    Domain
                  </th>
                  <th className="text-left py-2 pr-4 font-medium text-foreground/60 text-xs uppercase">
                    Status
                  </th>
                  <th className="text-left py-2 font-medium text-foreground/60 text-xs uppercase">
                    Tanggal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stores.map((store) => {
                  const status = (store.status as StatusKey) ?? "pending";
                  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
                  return (
                    <tr key={store.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 pr-4 capitalize text-foreground">{store.plan}</td>
                      <td className="py-3 pr-4 text-foreground/70">{store.template_name ?? "-"}</td>
                      <td className="py-3 pr-4 text-foreground/60 font-mono text-xs truncate max-w-[140px]">
                        {store.store_url ?? "-"}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex text-xs font-medium px-2 py-1 rounded-full border ${config.color}`}
                        >
                          {config.label}
                        </span>
                      </td>
                      <td className="py-3 text-foreground/60 text-xs">
                        {formatDate(store.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-foreground/40 text-sm">Belum ada store</p>
        )}
      </div>

      {/* Invoices */}
      <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold text-foreground mb-4">
          Invoice ({invoices?.length ?? 0})
        </h2>
        {invoices && invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="text-left py-2 pr-4 font-medium text-foreground/60 text-xs uppercase">
                    Keterangan
                  </th>
                  <th className="text-left py-2 pr-4 font-medium text-foreground/60 text-xs uppercase">
                    Jumlah
                  </th>
                  <th className="text-left py-2 pr-4 font-medium text-foreground/60 text-xs uppercase">
                    Status
                  </th>
                  <th className="text-left py-2 font-medium text-foreground/60 text-xs uppercase">
                    Tanggal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3 pr-4 text-foreground/70">{inv.description ?? "-"}</td>
                    <td className="py-3 pr-4 text-foreground font-mono text-xs">
                      {formatCurrency(inv.amount)}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex text-xs font-medium px-2 py-1 rounded-full border ${
                          inv.status === "paid"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : inv.status === "overdue"
                            ? "bg-red-100 text-red-700 border-red-200"
                            : "bg-yellow-100 text-yellow-700 border-yellow-200"
                        }`}
                      >
                        {inv.status === "paid" ? "Lunas" : inv.status === "overdue" ? "Jatuh Tempo" : "Pending"}
                      </span>
                    </td>
                    <td className="py-3 text-foreground/60 text-xs">{formatDate(inv.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-foreground/40 text-sm">Belum ada invoice</p>
        )}
      </div>
    </div>
  );
}
