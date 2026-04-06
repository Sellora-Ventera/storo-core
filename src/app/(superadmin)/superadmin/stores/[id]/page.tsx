import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import StatusUpdateForm from "@/components/dashboard/superadmin/StatusUpdateForm";

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

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
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

  const { id } = await params;

  const { data: store } = await supabase
    .from("onboarding_requests")
    .select("id, status, plan, template_name, store_url, created_at, notes, clients(id, full_name, phone, clerk_user_id)")
    .eq("id", id)
    .single();

  if (!store) notFound();

  const status = (store.status as StatusKey) ?? "pending";
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const client = store.clients as {
    id?: string;
    full_name?: string;
    phone?: string;
    clerk_user_id?: string;
  } | null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/superadmin/stores"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Semua Store
      </Link>

      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {client?.full_name ?? "Store Detail"}
            </h1>
            <p className="text-gray-500 text-sm mt-1 capitalize">Paket: {store.plan}</p>
          </div>
          <span
            className={`inline-flex text-sm font-medium px-3 py-1.5 rounded-full border ${config.color}`}
          >
            {config.label}
          </span>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-3">
          <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide text-gray-500">
            Informasi Store
          </h2>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Template</dt>
              <dd className="text-sm font-medium text-gray-900">{store.template_name ?? "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Domain / URL</dt>
              <dd className="text-sm font-medium text-gray-900 font-mono truncate max-w-[200px]">
                {store.store_url ?? "-"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Tanggal Daftar</dt>
              <dd className="text-sm font-medium text-gray-900">{formatDate(store.created_at)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Engine Version</dt>
              <dd className="text-sm font-mono text-gray-500">1.0.0</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-3">
          <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide text-gray-500">
            Informasi Klien
          </h2>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Nama</dt>
              <dd className="text-sm font-medium text-gray-900">{client?.full_name ?? "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">WhatsApp</dt>
              <dd className="text-sm font-medium text-gray-900 font-mono">
                {client?.phone ?? "-"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">User ID</dt>
              <dd className="text-sm text-gray-400 font-mono text-xs truncate max-w-[180px]">
                {client?.clerk_user_id ?? "-"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Status Update Form */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Update Status</h2>
        <StatusUpdateForm
          storeId={store.id}
          currentStatus={store.status ?? "pending"}
          currentNotes={store.notes ?? ""}
        />
      </div>

      {/* Notes History */}
      {store.notes && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">Catatan Terakhir</h2>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
            {store.notes}
          </div>
        </div>
      )}
    </div>
  );
}
