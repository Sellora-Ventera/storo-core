import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
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
  AlertCircle,
  Store,
  Globe,
  Calendar,
  LayoutTemplate,
  UserCog,
  Upload,
  MessageSquare,
  FileText,
  Download,
  Receipt,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const SHOPEE_UPLOADS_BUCKET = "shopee-uploads";
const SIGNED_URL_TTL = 60 * 60 * 24; // 24h
import { PLANS } from "@/lib/plans";
import { StoreEditDialog } from "@/components/dashboard/StoreEditDialog";
import { STATUS_CONFIG, getStepIndex, type StatusKey } from "@/lib/store-status";

const TIMELINE_STEPS = [
  { key: "pending", label: "Permintaan Diterima", description: "Data onboarding Anda telah kami terima." },
  { key: "reviewing", label: "Sedang Direview", description: "Tim kami sedang memeriksa data Anda." },
  { key: "in_progress", label: "Setup Toko", description: "Toko Anda sedang dalam proses pembuatan." },
  { key: "live", label: "Toko Aktif", description: "Toko Anda sudah live dan siap digunakan!" },
] as const;

const PLAN_NAME_MAP = Object.fromEntries(PLANS.map((p) => [p.id, p.name]));
const PLAN_SETUP_MAP = Object.fromEntries(PLANS.map((p) => [p.id, p.setup]));

const INVOICE_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: typeof Clock }
> = {
  paid: { label: "Lunas", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
  pending: { label: "Menunggu Pembayaran", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  expired: { label: "Kadaluarsa", color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle },
  failed: { label: "Gagal", color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle },
};

function formatIDR(amount: number | null): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

interface UploadedFile {
  name?: string;
  size?: number;
  storage_path?: string;
  uploaded_at?: string;
  // Legacy (pre-2026-05-18) — beberapa baris lama mungkin masih punya field ini
  url?: string;
}

interface FileWithUrl extends UploadedFile {
  signedUrl: string | null;
}

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
    .eq("user_id", user.id)
    .single();

  if (!client) redirect("/sign-in");

  const [{ data: store }, { data: invoice }] = await Promise.all([
    supabase
      .from("onboarding_requests")
      .select(
        "id, status, store_url, plan, template_name, template_id, store_name, created_at, live_at, updated_at, requested_slug, custom_domain, status_note, assigned_engineer, files_uploaded, upload_method, client_id, store_id"
      )
      .or(`id.eq.${id},store_id.eq.${id}`)
      .eq("client_id", client.id)
      .maybeSingle(),
    supabase
      .from("invoices")
      .select("id, amount, status, paid_at, invoice_url, type, provider, due_date, created_at")
      .eq("client_id", client.id)
      .eq("type", "setup")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!store) notFound();

  const status = (store.status as StatusKey) ?? "pending";
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;
  const completedIndex = getStepIndex(status);

  const planName = PLAN_NAME_MAP[store.plan] ?? store.plan ?? "—";
  const planSetup = PLAN_SETUP_MAP[store.plan] ?? null;

  const subdomainPreview = store.requested_slug ? `${store.requested_slug}.storo.id` : null;
  const storeName = store.store_name ?? store.requested_slug ?? store.custom_domain ?? "Toko";

  const filesRaw = (store.files_uploaded ?? []) as unknown;
  const files: UploadedFile[] = Array.isArray(filesRaw) ? (filesRaw as UploadedFile[]) : [];

  // Generate signed URL for each file (24h) so download links work for the client.
  // Files uploaded sebelum 2026-05-18 yang masih punya `url` field langsung dipakai.
  const service = await createSupabaseServiceClient();
  const filesWithUrls: FileWithUrl[] = await Promise.all(
    files.map(async (f) => {
      if (f.url) return { ...f, signedUrl: f.url };
      if (!f.storage_path) return { ...f, signedUrl: null };
      const { data } = await service.storage
        .from(SHOPEE_UPLOADS_BUCKET)
        .createSignedUrl(f.storage_path, SIGNED_URL_TTL);
      return { ...f, signedUrl: data?.signedUrl ?? null };
    }),
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <div>
        <Button asChild variant="ghost" size="sm" className="cursor-pointer text-gray-500 hover:text-gray-900 -ml-2">
          <Link href="/dashboard/stores">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali ke Semua Toko
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Store className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 capitalize truncate">{storeName}</h1>
                <StoreEditDialog
                  storeId={store.id}
                  currentName={store.store_name ?? store.requested_slug ?? null}
                  currentDomain={store.custom_domain ?? null}
                />
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-100">
                  Paket {planName}
                </span>
                {store.template_name && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border bg-gray-50 text-gray-700 border-gray-200 capitalize">
                    <LayoutTemplate className="w-3 h-3" />
                    {store.template_name}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                  <Calendar className="w-3.5 h-3.5" />
                  Dipesan {formatDate(store.created_at)}
                </span>
              </div>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full border flex-shrink-0 ${statusCfg.color}`}>
            <StatusIcon className={`w-4 h-4 ${statusCfg.spin ? "animate-spin" : ""}`} />
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Contextual alert */}
      {status === "rejected" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-red-900 text-sm mb-1">Ada data yang perlu diperbaiki</p>
            {store.status_note ? (
              <div className="bg-white border border-red-100 rounded-lg p-3 mt-2">
                <p className="text-xs font-semibold text-red-800 mb-0.5">Catatan dari tim:</p>
                <p className="text-sm text-red-700">{store.status_note}</p>
              </div>
            ) : (
              <p className="text-red-700 text-sm">Hubungi tim kami melalui WhatsApp untuk detail perbaikan.</p>
            )}
            <a
              href="https://wa.me/6285157406969"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              Chat via WhatsApp
            </a>
          </div>
        </div>
      )}

      {status === "live" && store.store_url && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-green-900 text-sm">Toko Anda sudah aktif!</p>
              <p className="text-green-700 text-sm truncate">{store.store_url}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <a
              href={store.store_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white border border-green-300 text-green-700 hover:bg-green-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              Lihat Toko
            </a>
            {store.store_id && (
              <Link
                href={`/dashboard/manage-store/${store.store_id}`}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <Store className="w-4 h-4" />
                Kelola Toko
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      )}

      {status !== "live" && status !== "rejected" && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900 text-sm">{statusCfg.label}</p>
            <p className="text-blue-800 text-sm mt-0.5">{statusCfg.description}</p>
            {statusCfg.eta && <p className="text-blue-600 text-xs mt-1">{statusCfg.eta}</p>}
          </div>
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
            const showLiveAt = step.key === "live" && isCompleted && store.live_at;

            return (
              <div key={step.key} className="flex gap-4">
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

                <div className="pb-8 pt-1 min-w-0">
                  <p className={`font-semibold text-sm ${isCompleted ? "text-gray-900" : "text-gray-400"}`}>
                    {step.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${isCompleted ? "text-gray-500" : "text-gray-300"}`}>
                    {step.description}
                  </p>
                  {showLiveAt && (
                    <p className="text-xs text-green-600 font-medium mt-1">
                      Aktif sejak {formatDate(store.live_at)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Store info grid */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">
          Informasi Toko
        </h2>
        <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
          <InfoItem
            icon={Receipt}
            label="Paket"
            value={
              <span>
                {planName}
                {planSetup != null && (
                  <span className="text-gray-400 text-xs font-normal ml-1.5">
                    · {formatIDR(planSetup)} setup
                  </span>
                )}
              </span>
            }
          />
          {store.template_name && (
            <InfoItem
              icon={LayoutTemplate}
              label="Template"
              value={<span className="capitalize">{store.template_name}</span>}
            />
          )}
          {subdomainPreview && (
            <InfoItem icon={Globe} label="Subdomain Storo" value={subdomainPreview} />
          )}
          {store.custom_domain && (
            <InfoItem icon={Globe} label="Custom Domain" value={store.custom_domain} />
          )}
          {store.store_url && (
            <InfoItem
              icon={ExternalLink}
              label="URL Toko Live"
              value={
                <a
                  href={store.store_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate block"
                >
                  {store.store_url}
                </a>
              }
            />
          )}
          <InfoItem
            icon={UserCog}
            label="Engineer"
            value={
              store.assigned_engineer ? (
                store.assigned_engineer
              ) : (
                <span className="text-gray-400 italic">Sedang dialokasikan</span>
              )
            }
          />
          {store.upload_method && (
            <InfoItem
              icon={store.upload_method === "whatsapp" ? MessageSquare : Upload}
              label="Metode Upload Data"
              value={store.upload_method === "whatsapp" ? "Via WhatsApp" : "Via Platform"}
            />
          )}
          <InfoItem icon={Calendar} label="Tanggal Dipesan" value={formatDate(store.created_at)} />
          {store.live_at && (
            <InfoItem icon={CheckCircle2} label="Tanggal Live" value={formatDate(store.live_at)} />
          )}
        </dl>
      </div>

      {/* Invoice */}
      {invoice && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">
            Status Pembayaran Setup
          </h2>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Receipt className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-lg">{formatIDR(invoice.amount)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Biaya Setup Paket {planName}</p>
                {invoice.paid_at && (
                  <p className="text-xs text-gray-400 mt-1">
                    Dibayar pada {formatDate(invoice.paid_at)}
                  </p>
                )}
                {!invoice.paid_at && invoice.due_date && (
                  <p className="text-xs text-gray-400 mt-1">
                    Jatuh tempo {formatDate(invoice.due_date)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {(() => {
                const invCfg = INVOICE_STATUS_CONFIG[invoice.status] ?? INVOICE_STATUS_CONFIG.pending;
                const InvIcon = invCfg.icon;
                return (
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${invCfg.color}`}>
                    <InvIcon className="w-3.5 h-3.5" />
                    {invCfg.label}
                  </span>
                );
              })()}
              <Button asChild variant="outline" size="sm" className="cursor-pointer">
                <Link href="/dashboard/billing">
                  Lihat Billing
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Files uploaded */}
      {store.upload_method !== "whatsapp" && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              File Shopee ({filesWithUrls.length})
            </h2>
            <Button asChild size="sm" variant="outline" className="cursor-pointer">
              <Link href={`/dashboard/stores/${store.id}/upload`}>
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                {filesWithUrls.length === 0 ? "Upload Sekarang" : "Tambah / Kelola"}
              </Link>
            </Button>
          </div>

          {filesWithUrls.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              Belum ada file Shopee yang di-upload. Klik tombol di atas untuk mulai.
            </p>
          ) : (
            <div className="space-y-2">
              {filesWithUrls.map((file, idx) => (
                <div
                  key={file.storage_path ?? idx}
                  className="flex items-center justify-between gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-4.5 h-4.5 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name ?? `File ${idx + 1}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {file.size != null && (
                          <>
                            {file.size < 1024 * 1024
                              ? `${(file.size / 1024).toFixed(1)} KB`
                              : `${(file.size / 1024 / 1024).toFixed(2)} MB`}
                          </>
                        )}
                        {file.uploaded_at && (
                          <>
                            {file.size != null ? " · " : ""}
                            {new Date(file.uploaded_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  {file.signedUrl && (
                    <a
                      href={file.signedUrl}
                      download={file.name}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 cursor-pointer shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
          className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          Hubungi via WhatsApp
        </a>
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-gray-500 mb-1 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </dt>
      <dd className="font-medium text-gray-900 text-sm truncate">{value}</dd>
    </div>
  );
}
