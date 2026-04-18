import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Globe,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Store,
  ArrowRight,
  Gift,
  Sparkles,
  Loader2,
} from "lucide-react";

const DOMAIN_STATUS_CONFIG = {
  active: { label: "Aktif", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2, spin: false },
  pending: { label: "Menunggu Setup", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock, spin: false },
  setup: { label: "Sedang Disiapkan", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Loader2, spin: true },
  expired: { label: "Kadaluarsa", color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle, spin: false },
  rejected: { label: "Perlu Perbaikan", color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle, spin: false },
} as const;

type DomainStatus = keyof typeof DOMAIN_STATUS_CONFIG;

interface DomainEntry {
  id: string;
  name: string;
  status: DomainStatus;
  kind: "subdomain" | "custom" | "registered";
  source: "onboarding" | "domain_order";
  createdAt: string;
  expiresAt?: string | null;
  autoRenew?: boolean;
  storeId?: string;
  storeLabel?: string;
  free?: boolean;
}

function mapStoreStatusToDomain(storeStatus: string | null): DomainStatus {
  switch (storeStatus) {
    case "live":
      return "active";
    case "in_progress":
    case "reviewing":
      return "setup";
    case "rejected":
      return "rejected";
    default:
      return "pending";
  }
}

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default async function DomainsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const [domainOrdersRes, onboardingRes] = client
    ? await Promise.all([
        supabase
          .from("domain_orders")
          .select("id, domain_name, status, expires_at, auto_renew, created_at")
          .eq("client_id", client.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("onboarding_requests")
          .select("id, status, requested_slug, custom_domain, created_at, live_at, plan, template_name")
          .eq("client_id", client.id)
          .order("created_at", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }];

  const domainOrders = domainOrdersRes.data ?? [];
  const onboardings = onboardingRes.data ?? [];

  const domains: DomainEntry[] = [];

  // From onboarding: subdomain + custom domain (if any)
  for (const req of onboardings) {
    const storeLabel = req.requested_slug ?? req.custom_domain ?? "Toko";
    const domainStatus = mapStoreStatusToDomain(req.status);

    if (req.requested_slug) {
      domains.push({
        id: `ob-sub-${req.id}`,
        name: `${req.requested_slug}.storo.id`,
        status: domainStatus,
        kind: "subdomain",
        source: "onboarding",
        createdAt: req.created_at,
        storeId: req.id,
        storeLabel,
        free: true,
      });
    }

    if (req.custom_domain) {
      domains.push({
        id: `ob-custom-${req.id}`,
        name: req.custom_domain,
        status: domainStatus,
        kind: "custom",
        source: "onboarding",
        createdAt: req.created_at,
        storeId: req.id,
        storeLabel,
        free: true,
      });
    }
  }

  // From domain_orders (separate Namecheap purchases)
  for (const d of domainOrders) {
    domains.push({
      id: d.id,
      name: d.domain_name,
      status: (d.status as DomainStatus) ?? "pending",
      kind: "registered",
      source: "domain_order",
      createdAt: d.created_at,
      expiresAt: d.expires_at,
      autoRenew: d.auto_renew,
    });
  }

  const hasAny = domains.length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Domain Saya</h1>
        <p className="text-gray-500 mt-1">
          Kelola subdomain gratis & custom domain toko Anda.
        </p>
      </div>

      {/* Empty state */}
      {!hasAny && (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 shadow-sm text-center">
          <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Belum ada domain</h2>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Domain akan otomatis muncul di sini setelah kamu memesan toko via onboarding.
          </p>
        </div>
      )}

      {/* Domain list */}
      {hasAny && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Daftar Domain ({domains.length})
          </h2>
          <div className="space-y-3">
            {domains.map((domain) => {
              const statusCfg =
                DOMAIN_STATUS_CONFIG[domain.status] ?? DOMAIN_STATUS_CONFIG.pending;
              const StatusIcon = statusCfg.icon;
              const isSubdomain = domain.kind === "subdomain";
              const isCustom = domain.kind === "custom";
              const isRegistered = domain.kind === "registered";

              return (
                <div
                  key={domain.id}
                  className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
                >
                  <div className="p-5 flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Globe className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-gray-900 text-base truncate">
                            {domain.name}
                          </p>
                          {isSubdomain && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wide">
                              Subdomain
                            </span>
                          )}
                          {isCustom && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 uppercase tracking-wide">
                              Custom Domain
                            </span>
                          )}
                          {isRegistered && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-200 uppercase tracking-wide">
                              Terdaftar
                            </span>
                          )}
                          {domain.free && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100 uppercase tracking-wide">
                              <Gift className="w-2.5 h-2.5" />
                              Gratis
                            </span>
                          )}
                        </div>

                        {domain.storeLabel && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 capitalize">
                            <Store className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">Untuk toko: {domain.storeLabel}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                          {domain.expiresAt && (
                            <span>Kedaluwarsa {formatDate(domain.expiresAt)}</span>
                          )}
                          <span>Didaftarkan {formatDate(domain.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {domain.autoRenew !== undefined && (
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                            domain.autoRenew
                              ? "bg-blue-50 text-blue-600 border-blue-200"
                              : "bg-gray-50 text-gray-500 border-gray-200"
                          }`}
                        >
                          <RefreshCw className="w-3 h-3" />
                          Auto-renew {domain.autoRenew ? "ON" : "OFF"}
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${statusCfg.color}`}>
                        <StatusIcon className={`w-3.5 h-3.5 ${statusCfg.spin ? "animate-spin" : ""}`} />
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>

                  {domain.storeId && (
                    <div className="border-t border-gray-100 px-5 py-3 bg-gray-50/50 flex items-center justify-between gap-3">
                      <span className="text-xs text-gray-500">
                        {domain.status === "active"
                          ? "Domain aktif & dipakai toko"
                          : "Akan aktif saat toko live"}
                      </span>
                      <Link
                        href={`/dashboard/stores/${domain.storeId}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 cursor-pointer"
                      >
                        Lihat toko
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info card */}
      <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-2">Tentang Domain di Storo.id</p>
            <ul className="text-sm text-gray-600 space-y-1.5">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong>Subdomain gratis</strong> (namatoko.storo.id) — langsung aktif untuk semua paket.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  <strong>Custom domain</strong> yang kamu pilih saat onboarding sudah di-cover VenteraAI — kamu nggak perlu bayar tambahan.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>
                  Punya domain sendiri? Bisa diarahkan ke toko kamu — hubungi tim kami.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
