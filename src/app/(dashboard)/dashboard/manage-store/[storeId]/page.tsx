import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { getStoreForUser } from "@/lib/store/context";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

async function getQuickStats(storeId: string) {
  const supabase = await createSupabaseServiceClient();

  const since = new Date();
  since.setDate(since.getDate() - 14);
  const sinceIso = since.toISOString();

  const [productsRes, ordersRes, customersRes, recentOrdersRes] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId),
    supabase
      .from("orders")
      .select("id, total_amount, status, created_at", { count: "exact" })
      .eq("store_id", storeId)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false }),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId),
    supabase
      .from("orders")
      .select("id, order_number, total_amount, status, created_at, customer_name")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const totalProducts = productsRes.count ?? 0;
  const totalCustomers = customersRes.count ?? 0;
  const ordersInRange = ordersRes.data ?? [];
  const totalRevenue = ordersInRange
    .filter((o) => ["paid", "shipped", "delivered"].includes(o.status as string))
    .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  return {
    totalProducts,
    totalCustomers,
    totalOrders: ordersRes.count ?? 0,
    totalRevenue,
    recentOrders: recentOrdersRes.data ?? [],
  };
}

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  pending: { label: "Pending", tone: "bg-yellow-50 text-yellow-700" },
  awaiting_payment: { label: "Menunggu Bayar", tone: "bg-orange-50 text-orange-700" },
  paid: { label: "Dibayar", tone: "bg-blue-50 text-blue-700" },
  processing: { label: "Diproses", tone: "bg-blue-50 text-blue-700" },
  shipped: { label: "Dikirim", tone: "bg-indigo-50 text-indigo-700" },
  delivered: { label: "Selesai", tone: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Dibatalkan", tone: "bg-red-50 text-red-700" },
};

export default async function StoreDashboardPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const { store } = await getStoreForUser(storeId);
  const stats = await getQuickStats(storeId);

  const cards = [
    {
      label: "Pendapatan 14 hari",
      value: formatIDR(stats.totalRevenue),
      icon: TrendingUp,
      accent: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Pesanan 14 hari",
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      accent: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total Produk",
      value: stats.totalProducts.toString(),
      icon: Package,
      accent: "bg-purple-50 text-purple-600",
    },
    {
      label: "Total Pelanggan",
      value: stats.totalCustomers.toString(),
      icon: Users,
      accent: "bg-pink-50 text-pink-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-[#94A3B8] uppercase tracking-[0.18em] font-semibold mb-1">
            Dashboard Toko
          </p>
          <h1 className="text-2xl font-bold text-[#0F172A]">{store.name}</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Pantau penjualan, pesanan, dan aktivitas toko Anda.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/manage-store/${storeId}/products/new`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-primary text-white hover:bg-primary/90 transition cursor-pointer"
          >
            <Plus className="size-4" />
            Tambah Produk
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(({ label, value, icon: Icon, accent }) => (
          <div
            key={label}
            className="bg-white border border-[#E5E8EF] rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#64748B] font-medium">{label}</span>
              <span className={`size-8 rounded-lg grid place-items-center ${accent}`}>
                <Icon className="size-4" />
              </span>
            </div>
            <p className="text-xl font-bold text-[#0F172A]">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-[#E5E8EF] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#0F172A]">Pesanan Terbaru</h2>
            <Link
              href={`/dashboard/manage-store/${storeId}/orders`}
              className="text-xs text-primary hover:text-primary/80 inline-flex items-center gap-1 font-medium cursor-pointer"
            >
              Lihat semua
              <ArrowRight className="size-3" />
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#94A3B8]">
              Belum ada pesanan masuk.
            </div>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {stats.recentOrders.map((order) => {
                const status = STATUS_LABEL[order.status as string] ?? {
                  label: order.status as string,
                  tone: "bg-gray-100 text-gray-600",
                };
                return (
                  <Link
                    key={order.id}
                    href={`/dashboard/manage-store/${storeId}/orders/${order.id}`}
                    className="flex items-center justify-between gap-3 py-3 hover:bg-[#F8FAFC] -mx-2 px-2 rounded-lg transition cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#0F172A] truncate">
                        {order.order_number ?? order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-[#64748B] truncate">
                        {order.customer_name ?? "Pelanggan"} •{" "}
                        {new Date(order.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold text-[#0F172A]">
                        {formatIDR(Number(order.total_amount) || 0)}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.tone}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="size-9 rounded-xl bg-primary/10 grid place-items-center">
              <Sparkles className="size-4 text-primary" />
            </span>
            <h2 className="text-sm font-semibold text-[#0F172A]">Aksi Cepat</h2>
          </div>
          <div className="space-y-1.5">
            <Link
              href={`/dashboard/manage-store/${storeId}/products`}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white hover:bg-primary/5 transition text-sm text-[#0F172A] cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Package className="size-4 text-[#64748B]" />
                Kelola Produk
              </span>
              <ArrowRight className="size-3.5 text-[#94A3B8]" />
            </Link>
            <Link
              href={`/dashboard/manage-store/${storeId}/orders`}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white hover:bg-primary/5 transition text-sm text-[#0F172A] cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ShoppingCart className="size-4 text-[#64748B]" />
                Kelola Pesanan
              </span>
              <ArrowRight className="size-3.5 text-[#94A3B8]" />
            </Link>
            <Link
              href={`/dashboard/manage-store/${storeId}/banners`}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white hover:bg-primary/5 transition text-sm text-[#0F172A] cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="size-4 text-[#64748B]" />
                Atur Banner Homepage
              </span>
              <ArrowRight className="size-3.5 text-[#94A3B8]" />
            </Link>
            <Link
              href={`/dashboard/manage-store/${storeId}/settings`}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white hover:bg-primary/5 transition text-sm text-[#0F172A] cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Users className="size-4 text-[#64748B]" />
                Pengaturan Toko
              </span>
              <ArrowRight className="size-3.5 text-[#94A3B8]" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
