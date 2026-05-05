import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Store,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  ArrowRight,
  Globe,
  Calendar,
  LayoutTemplate,
} from "lucide-react";
import { StoreEditDialog } from "@/components/dashboard/StoreEditDialog";
import { ManageStoreLink } from "@/components/dashboard/ManageStoreLink";

const STATUS_CONFIG = {
  pending: { label: "Menunggu Konfirmasi", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock, spin: false },
  reviewing: { label: "Sedang Direview", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Loader2, spin: true },
  in_progress: { label: "Dalam Proses Setup", color: "bg-orange-100 text-orange-700 border-orange-200", icon: Loader2, spin: true },
  live: { label: "Toko Aktif", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2, spin: false },
  rejected: { label: "Perlu Perbaikan Data", color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle, spin: false },
} as const;

const PLAN_CONFIG = {
  starter: { label: "Starter", color: "bg-gray-100 text-gray-700 border-gray-200" },
  pro: { label: "Pro", color: "bg-blue-100 text-blue-700 border-blue-200" },
  advance: { label: "Advance", color: "bg-purple-100 text-purple-700 border-purple-200" },
  flexible: { label: "Flexible", color: "bg-amber-100 text-amber-700 border-amber-200" },
  custom: { label: "Custom", color: "bg-slate-100 text-slate-700 border-slate-200" },
} as const;

const PROGRESS_STEPS = ["pending", "reviewing", "in_progress", "live"] as const;

function getStepIndex(status: string): number {
  if (status === "rejected") return 1;
  const idx = PROGRESS_STEPS.indexOf(status as (typeof PROGRESS_STEPS)[number]);
  return idx === -1 ? 0 : idx;
}

export default async function StoresPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: stores } = client
    ? await supabase
        .from("onboarding_requests")
        .select("id, status, store_url, plan, template_name, created_at, requested_slug, custom_domain, store_name, store_id")
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
          <Link href="/dashboard/stores/new">
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
            <Link href="/dashboard/stores/new">Tambah Toko Pertama</Link>
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
              const stepIndex = getStepIndex(status);
              const isLive = status === "live";
              const isRejected = status === "rejected";
              const displayDomain =
                store.custom_domain ??
                (store.requested_slug ? `${store.requested_slug}.storo.id` : null);
              const primaryUrl = store.store_url ?? (displayDomain ? `https://${displayDomain}` : null);
              const storeName = store.store_name ?? store.requested_slug ?? displayDomain ?? "Toko";

              return (
                <Link
                  key={store.id}
                  href={`/dashboard/stores/${store.id}`}
                  className="block bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 group overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-5 sm:p-6 flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Store className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-gray-900 capitalize truncate">
                            {storeName}
                          </p>
                          <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${planCfg.color}`}>
                            {planCfg.label}
                          </span>
                          <StoreEditDialog
                            storeId={store.id}
                            currentName={store.store_name ?? store.requested_slug ?? null}
                            currentDomain={store.custom_domain ?? null}
                          />
                        </div>
                        {displayDomain && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 min-w-0">
                            <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{displayDomain}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                          {store.template_name && (
                            <div className="flex items-center gap-1.5">
                              <LayoutTemplate className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="capitalize">{store.template_name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>
                              {new Date(store.created_at).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border flex-shrink-0 ${statusCfg.color}`}>
                      <StatusIcon className={`w-3.5 h-3.5 ${statusCfg.spin ? "animate-spin" : ""}`} />
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Progress bar (non-terminal) */}
                  {!isLive && !isRejected && (
                    <div className="px-5 sm:px-6 pb-4">
                      <div className="flex items-center gap-1.5">
                        {PROGRESS_STEPS.map((_, idx) => {
                          const isDone = idx < stepIndex;
                          const isActive = idx === stepIndex;
                          return (
                            <div
                              key={idx}
                              className={`h-1.5 flex-1 rounded-full transition-colors ${
                                isDone
                                  ? "bg-primary"
                                  : isActive
                                  ? "bg-primary/40"
                                  : "bg-gray-100"
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Footer CTA */}
                  <div className="border-t border-gray-100 px-5 sm:px-6 py-3 flex items-center justify-between gap-3 bg-gray-50/50">
                    <div className="min-w-0">
                      {isLive && primaryUrl ? (
                        <span className="text-xs text-primary truncate max-w-[60%]">
                          {primaryUrl.replace(/^https?:\/\//, "")}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {isRejected ? "Perlu tindak lanjut" : "Sedang diproses tim VenteraAI"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isLive && store.store_id && (
                        <ManageStoreLink storeId={store.store_id} />
                      )}
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
                        Detail
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
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
