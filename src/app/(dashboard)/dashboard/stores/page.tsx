import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Store, Clock, CheckCircle2, AlertCircle, Loader2, Plus, ExternalLink } from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "Menunggu Konfirmasi", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  reviewing: { label: "Sedang Direview", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Loader2 },
  in_progress: { label: "Dalam Proses Setup", color: "bg-orange-100 text-orange-700 border-orange-200", icon: Loader2 },
  live: { label: "Toko Aktif", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
  rejected: { label: "Perlu Perbaikan Data", color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle },
} as const;

const PLAN_CONFIG = {
  starter: { label: "Starter", color: "bg-gray-100 text-gray-600 border-gray-200" },
  business: { label: "Business", color: "bg-blue-100 text-blue-700 border-blue-200" },
  enterprise: { label: "Enterprise", color: "bg-purple-100 text-purple-700 border-purple-200" },
} as const;

export default async function StoresPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("clerk_user_id", user.id)
    .single();

  const { data: stores } = client
    ? await supabase
        .from("onboarding_requests")
        .select("id, status, store_url, plan, template_name, created_at")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Toko Saya</h1>
          <p className="text-gray-500 mt-1">Kelola semua toko online Anda.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-white cursor-pointer">
          <Link href="/onboarding">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Toko Baru
          </Link>
        </Button>
      </div>

      {/* Empty state */}
      {(!stores || stores.length === 0) && (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 shadow-sm text-center">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Belum ada toko</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Belum ada toko. Mulai onboarding untuk membuat toko pertama Anda.
          </p>
          <Button asChild className="bg-primary hover:bg-primary/90 text-white cursor-pointer">
            <Link href="/onboarding">Mulai Onboarding</Link>
          </Button>
        </div>
      )}

      {/* Store list */}
      {stores && stores.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Semua Toko ({stores.length})
          </h2>
          <div className="space-y-3">
            {stores.map((store) => {
              const status = (store.status as keyof typeof STATUS_CONFIG) ?? "pending";
              const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
              const StatusIcon = statusCfg.icon;
              const plan = (store.plan as keyof typeof PLAN_CONFIG) ?? "starter";
              const planCfg = PLAN_CONFIG[plan] ?? PLAN_CONFIG.starter;

              return (
                <Link
                  key={store.id}
                  href={`/dashboard/stores/${store.id}`}
                  className="block bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Store className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${planCfg.color}`}>
                            {planCfg.label}
                          </span>
                          {store.template_name && (
                            <span className="text-sm text-gray-700 font-medium truncate">
                              {store.template_name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {store.store_url && (
                            <span className="text-xs text-primary truncate max-w-[200px]">
                              {store.store_url}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {new Date(store.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${statusCfg.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusCfg.label}
                      </span>
                      <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
