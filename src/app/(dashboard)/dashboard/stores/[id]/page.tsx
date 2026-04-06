import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "Menunggu Konfirmasi", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  reviewing: { label: "Sedang Direview", color: "bg-blue-100 text-blue-700 border-blue-200" },
  in_progress: { label: "Dalam Proses Setup", color: "bg-orange-100 text-orange-700 border-orange-200" },
  live: { label: "Toko Aktif", color: "bg-green-100 text-green-700 border-green-200" },
  rejected: { label: "Perlu Perbaikan Data", color: "bg-red-100 text-red-700 border-red-200" },
} as const;

const TIMELINE_STEPS = [
  { key: "pending", label: "Permintaan Diterima", description: "Data onboarding Anda telah kami terima." },
  { key: "reviewing", label: "Sedang Direview", description: "Tim kami sedang memeriksa data Anda." },
  { key: "in_progress", label: "Setup Toko", description: "Toko Anda sedang dalam proses pembuatan." },
  { key: "live", label: "Toko Aktif", description: "Toko Anda sudah live dan siap digunakan!" },
] as const;

const STATUS_ORDER = ["pending", "reviewing", "in_progress", "live"] as const;

function getCompletedIndex(status: string): number {
  if (status === "rejected") return 1; // stuck at reviewing
  return STATUS_ORDER.indexOf(status as (typeof STATUS_ORDER)[number]);
}

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  business: "Business",
  enterprise: "Enterprise",
};

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("clerk_user_id", user.id)
    .single();

  if (!client) redirect("/sign-in");

  const { data: store } = await supabase
    .from("onboarding_requests")
    .select("id, status, store_url, plan, template_name, created_at, domain, subdomain")
    .eq("id", id)
    .eq("client_id", client.id)
    .single();

  if (!store) notFound();

  const status = (store.status as keyof typeof STATUS_CONFIG) ?? "pending";
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const completedIndex = getCompletedIndex(status);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <Button asChild variant="ghost" size="sm" className="mt-1 cursor-pointer text-gray-500 hover:text-gray-900">
          <Link href="/dashboard/stores">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Paket {PLAN_LABELS[store.plan] ?? store.plan}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Dibuat pada{" "}
            {new Date(store.created_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full border ${statusCfg.color}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* Rejected warning */}
      {status === "rejected" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-900 text-sm mb-1">Ada data yang perlu diperbaiki</p>
            <p className="text-yellow-700 text-sm">
              Ada data yang perlu diperbaiki. Hubungi tim kami melalui WhatsApp.
            </p>
            <a
              href="https://wa.me/6285157406969"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Chat via WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Live CTA */}
      {status === "live" && store.store_url && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-900 text-sm">Toko Anda sudah aktif!</p>
              <p className="text-green-700 text-sm">{store.store_url}</p>
            </div>
          </div>
          <a
            href={store.store_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Kunjungi Toko
          </a>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-6">
          Progres Setup
        </h2>
        <div className="space-y-0">
          {TIMELINE_STEPS.map((step, idx) => {
            const isCompleted = idx <= completedIndex;
            const isCurrent = idx === completedIndex && status !== "live";
            const isLast = idx === TIMELINE_STEPS.length - 1;

            return (
              <div key={step.key} className="flex gap-4">
                {/* Icon + line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                      isCompleted
                        ? "bg-primary border-primary"
                        : isCurrent
                        ? "bg-white border-primary"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : isCurrent ? (
                      <Clock className="w-4 h-4 text-primary" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-300" />
                    )}
                  </div>
                  {!isLast && (
                    <div
                      className={`w-0.5 h-10 mt-1 ${
                        idx < completedIndex ? "bg-primary" : "bg-gray-100"
                      }`}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="pb-8 pt-1">
                  <p
                    className={`font-semibold text-sm ${
                      isCompleted ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${
                      isCompleted ? "text-gray-500" : "text-gray-300"
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Store info */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Informasi Toko
        </h2>
        <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <dt className="text-xs text-gray-500 mb-1">Paket</dt>
            <dd className="font-medium text-gray-900 text-sm">
              {PLAN_LABELS[store.plan] ?? store.plan}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 mb-1">Template</dt>
            <dd className="font-medium text-gray-900 text-sm">
              {store.template_name ?? "—"}
            </dd>
          </div>
          {store.subdomain && (
            <div>
              <dt className="text-xs text-gray-500 mb-1">Subdomain</dt>
              <dd className="font-medium text-gray-900 text-sm">{store.subdomain}</dd>
            </div>
          )}
          {store.domain && (
            <div>
              <dt className="text-xs text-gray-500 mb-1">Domain</dt>
              <dd className="font-medium text-gray-900 text-sm">{store.domain}</dd>
            </div>
          )}
          {store.store_url && (
            <div>
              <dt className="text-xs text-gray-500 mb-1">URL Toko</dt>
              <dd className="font-medium text-primary text-sm">
                <a href={store.store_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {store.store_url}
                </a>
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-gray-500 mb-1">Tanggal Dibuat</dt>
            <dd className="font-medium text-gray-900 text-sm">
              {new Date(store.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </dd>
          </div>
        </dl>
      </div>

      {/* Help */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-semibold text-gray-900 text-sm">Ada pertanyaan tentang toko ini?</p>
          <p className="text-gray-500 text-xs mt-0.5">Tim kami siap membantu Anda.</p>
        </div>
        <a
          href="https://wa.me/6285157406969"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Hubungi via WhatsApp
        </a>
      </div>
    </div>
  );
}
