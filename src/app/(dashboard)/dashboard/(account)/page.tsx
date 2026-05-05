import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Store,
  Package,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2Icon,
  Globe,
  Calendar,
  ArrowRight,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STATUS_CONFIG = {
  pending: {
    label: "Menunggu Konfirmasi",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: Clock,
    description: "Data onboarding Anda sudah kami terima. Tim kami akan segera menghubungi Anda.",
    eta: "Estimasi review: 1-2 jam kerja",
  },
  reviewing: {
    label: "Sedang Direview",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Loader2Icon,
    description: "Tim VenteraAI sedang memeriksa data toko & produk Anda dari Shopee.",
    eta: "Estimasi: 1-2 hari kerja",
  },
  in_progress: {
    label: "Dalam Proses Setup",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: Loader2Icon,
    description: "Engineer kami sedang menyiapkan toko, template, & import produk Anda.",
    eta: "Estimasi: 2-3 hari kerja",
  },
  live: {
    label: "Toko Aktif",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2,
    description: "Toko Anda sudah aktif & siap menerima pesanan!",
    eta: "",
  },
  rejected: {
    label: "Perlu Perbaikan Data",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: AlertCircle,
    description: "Ada data yang perlu diperbaiki. Silakan hubungi tim kami.",
    eta: "",
  },
} as const;

const PROGRESS_STEPS = ["pending", "reviewing", "in_progress", "live"] as const;

function getStepIndex(status: string): number {
  if (status === "rejected") return 1;
  const idx = PROGRESS_STEPS.indexOf(status as (typeof PROGRESS_STEPS)[number]);
  return idx === -1 ? 0 : idx;
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  // Fetch client data
  const { data: client } = await supabase
    .from("clients")
    .select("id, full_name")
    .eq("user_id", user.id)
    .single();

  // If user has any active stores linked to this client, redirect to the most recent one
  if (client) {
    const { data: activeStores } = await supabase
      .from("stores")
      .select("id")
      .eq("client_id", client.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .limit(1);

    if (activeStores && activeStores.length > 0) {
      redirect(`/dashboard/${activeStores[0].id}`);
    }
  }

  // Fetch onboarding requests (stores)
  const { data: requests } = client
    ? await supabase
        .from("onboarding_requests")
        .select("id, status, store_url, plan, template_name, store_id, created_at, requested_slug, custom_domain, status_note")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  // Fetch notifications (only "live" status ones per spec)
  const { data: notifications } = client
    ? await supabase
        .from("client_notifications")
        .select("id, title, message, type, created_at, is_read")
        .eq("client_id", client.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(5)
    : { data: [] };

  const firstName = user.user_metadata?.full_name?.split(" ")[0] ?? "Kamu";
  const liveStores = requests?.filter((r) => r.status === "live") ?? [];
  const pendingStores = requests?.filter((r) => r.status !== "live") ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Selamat datang, {firstName}!
        </h1>
        <p className="text-gray-500 mt-1">
          Pantau status toko dan aktivitas akun Anda.
        </p>
      </div>

      {/* No stores CTA */}
      {(!requests || requests.length === 0) && (
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10 rounded-2xl p-8 text-center">
          <Store className="w-12 h-12 text-primary/40 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Belum ada toko
          </h2>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Tambah toko pertama Anda dan mulai berjualan online bersama VenteraAI.
          </p>
          <Button asChild className="btn-hero cursor-pointer">
            <Link href="/dashboard/stores/new">Tambah Toko Sekarang</Link>
          </Button>
        </div>
      )}

      {/* Notifications */}
      {notifications && notifications.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Notifikasi
          </h2>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="bg-white border border-gray-100 rounded-xl p-4 flex items-start gap-3 shadow-sm"
            >
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">{notif.title}</p>
                <p className="text-gray-600 text-sm">{notif.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending stores */}
      {pendingStores.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Status Onboarding
          </h2>
          {pendingStores.map((req) => {
            const status = (req.status as keyof typeof STATUS_CONFIG) ?? "pending";
            const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
            const Icon = config.icon;
            const stepIndex = getStepIndex(status);
            const isRejected = status === "rejected";
            const displayDomain = req.custom_domain ?? (req.requested_slug ? `${req.requested_slug}.storo.id` : null);
            const createdDate = new Date(req.created_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });

            return (
              <div
                key={req.id}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
              >
                {/* Header */}
                <div className="p-5 sm:p-6 flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Store className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 capitalize">
                          Paket {req.plan}
                        </p>
                        <span className="text-gray-300">·</span>
                        <p className="text-sm text-gray-500 capitalize">
                          Template {req.template_name}
                        </p>
                      </div>
                      {displayDomain && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500 min-w-0">
                          <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{displayDomain}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Dipesan {createdDate}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border flex-shrink-0 ${config.color}`}>
                    <Icon className={`w-3.5 h-3.5 ${status === "reviewing" || status === "in_progress" ? "animate-spin" : ""}`} />
                    {config.label}
                  </span>
                </div>

                {/* Progress bar */}
                {!isRejected && (
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
                    <div className="mt-3 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-700">{config.description}</p>
                        {config.eta && (
                          <p className="text-xs text-gray-400 mt-0.5">{config.eta}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Rejected note */}
                {isRejected && req.status_note && (
                  <div className="mx-5 sm:mx-6 mb-4 bg-red-50 border border-red-100 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-800 mb-0.5">Catatan dari tim:</p>
                    <p className="text-xs text-red-700">{req.status_note}</p>
                  </div>
                )}

                {/* Footer actions */}
                <div className="border-t border-gray-100 px-5 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap bg-gray-50/50">
                  <a
                    href="https://wa.me/6285157406969"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-green-600 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Hubungi tim
                  </a>
                  <Link
                    href={`/dashboard/stores/${req.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                  >
                    Lihat detail
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Live stores quick stats */}
      {liveStores.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Toko Aktif
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Store, label: "Toko Aktif", value: liveStores.length },
              { icon: Package, label: "Total Produk", value: "—" },
              { icon: ShoppingBag, label: "Order Bulan Ini", value: "—" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <span className="text-xs text-gray-500 font-medium">{label}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      {requests && requests.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="cursor-pointer border-primary/30 text-primary hover:bg-primary hover:text-white">
            <Link href="/dashboard/stores">Lihat Semua Toko</Link>
          </Button>
          <Button asChild variant="outline" className="cursor-pointer">
            <Link href="/dashboard/stores/new">+ Tambah Toko Baru</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
