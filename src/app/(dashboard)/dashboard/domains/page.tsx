import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Globe, Plus, CheckCircle2, Clock, AlertCircle, RefreshCw } from "lucide-react";

const DOMAIN_STATUS_CONFIG = {
  active: { label: "Aktif", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
  pending: { label: "Menunggu", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  expired: { label: "Kadaluarsa", color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle },
} as const;

interface DomainOrder {
  id: string;
  domain_name: string;
  status: string;
  expires_at: string | null;
  auto_renew: boolean;
  created_at: string;
}

export default async function DomainsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("clerk_user_id", user.id)
    .single();

  const { data: domains } = client
    ? await supabase
        .from("domain_orders")
        .select("id, domain_name, status, expires_at, auto_renew, created_at")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Domain Saya</h1>
          <p className="text-gray-500 mt-1">Kelola domain toko Anda.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-white cursor-pointer">
          <Link href="/dashboard/domains/search">
            <Plus className="w-4 h-4 mr-2" />
            Cari Domain Baru
          </Link>
        </Button>
      </div>

      {/* Empty state */}
      {(!domains || domains.length === 0) && (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 shadow-sm text-center">
          <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Belum ada domain</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Belum ada domain terdaftar. Dapatkan domain profesional untuk toko Anda.
          </p>
          <Button asChild className="bg-primary hover:bg-primary/90 text-white cursor-pointer">
            <Link href="/dashboard/domains/search">Cari Domain</Link>
          </Button>
        </div>
      )}

      {/* Domain list */}
      {domains && domains.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Daftar Domain ({domains.length})
          </h2>
          <div className="space-y-3">
            {(domains as DomainOrder[]).map((domain) => {
              const status = (domain.status as keyof typeof DOMAIN_STATUS_CONFIG) ?? "pending";
              const statusCfg = DOMAIN_STATUS_CONFIG[status] ?? DOMAIN_STATUS_CONFIG.pending;
              const StatusIcon = statusCfg.icon;

              return (
                <div
                  key={domain.id}
                  className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Globe className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-base truncate">
                          {domain.domain_name}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          {domain.expires_at && (
                            <span className="text-xs text-gray-500">
                              Kedaluwarsa:{" "}
                              {new Date(domain.expires_at).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            Didaftarkan:{" "}
                            {new Date(domain.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Auto renew badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                          domain.auto_renew
                            ? "bg-blue-50 text-blue-600 border-blue-200"
                            : "bg-gray-50 text-gray-500 border-gray-200"
                        }`}
                      >
                        <RefreshCw className="w-3 h-3" />
                        Auto-renew {domain.auto_renew ? "ON" : "OFF"}
                      </span>

                      {/* Status badge */}
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${statusCfg.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info card */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
        <p className="text-sm font-semibold text-blue-900 mb-1">Tentang Domain di Storo.id</p>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Subdomain gratis tersedia untuk semua paket (namatoko.storo.id)</li>
          <li>Domain .com, .id, .co.id tersedia untuk dibeli</li>
          <li>Domain yang sudah Anda miliki bisa diarahkan ke toko Anda</li>
        </ul>
      </div>
    </div>
  );
}
