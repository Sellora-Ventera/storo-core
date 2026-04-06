import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Store, Package, ShoppingBag, Clock, CheckCircle2, AlertCircle, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STATUS_CONFIG = {
  pending: { label: "Menunggu Konfirmasi", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  reviewing: { label: "Sedang Direview", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Loader2Icon },
  in_progress: { label: "Dalam Proses Setup", color: "bg-orange-100 text-orange-700 border-orange-200", icon: Loader2Icon },
  live: { label: "Toko Aktif", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
  rejected: { label: "Perlu Perbaikan Data", color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle },
} as const;

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  // Fetch client data
  const { data: client } = await supabase
    .from("clients")
    .select("id, full_name")
    .eq("clerk_user_id", user.id)
    .single();

  // Fetch onboarding requests (stores)
  const { data: requests } = client
    ? await supabase
        .from("onboarding_requests")
        .select("id, status, store_url, plan, template_name, store_id, created_at")
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
            Mulai onboarding untuk mendirikan webstore Anda dari Shopee.
          </p>
          <Button asChild className="btn-hero cursor-pointer">
            <Link href="/onboarding">Mulai Sekarang</Link>
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
            return (
              <div
                key={req.id}
                className="bg-white border border-gray-100 rounded-xl p-5 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Store className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 capitalize">
                      Paket {req.plan}
                    </p>
                    <p className="text-xs text-gray-500">Template: {req.template_name}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${config.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {config.label}
                </span>
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
            <Link href="/onboarding">+ Tambah Toko Baru</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
