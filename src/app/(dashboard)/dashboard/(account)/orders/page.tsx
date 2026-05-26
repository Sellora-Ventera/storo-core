import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag,
  Package,
  Store,
  Calendar,
  Phone,
  Truck,
} from "lucide-react";
import OrderFilters from "@/components/dashboard/OrderFilters";

type OrderStatus =
  | "pending"
  | "awaiting_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: "Menunggu", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  awaiting_payment: { label: "Menunggu Pembayaran", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  paid: { label: "Dibayar", color: "bg-blue-100 text-blue-700 border-blue-100" },
  processing: { label: "Diproses", color: "bg-blue-100 text-blue-700 border-blue-100" },
  shipped: { label: "Dikirim", color: "bg-purple-100 text-purple-700 border-purple-200" },
  delivered: { label: "Terkirim", color: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "Dibatalkan", color: "bg-red-100 text-red-700 border-red-200" },
  refunded: { label: "Dikembalikan", color: "bg-gray-100 text-gray-700 border-gray-200" },
};

const STORE_COLORS = [
  "bg-blue-50 text-blue-700 border-blue-100",
  "bg-violet-50 text-violet-700 border-violet-100",
  "bg-emerald-50 text-emerald-700 border-emerald-100",
  "bg-orange-50 text-orange-700 border-orange-100",
  "bg-pink-50 text-pink-700 border-pink-100",
];

function formatIDR(amount: number | null): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string; status?: string }>;
}) {
  const { store: storeFilter, status: statusFilter } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!client) redirect("/sign-in");

  const { data: liveStores } = await supabase
    .from("onboarding_requests")
    .select("id, store_id, store_name, requested_slug")
    .eq("client_id", client.id)
    .eq("status", "live");

  const stores = (liveStores ?? []).filter((s) => s.store_id != null);

  if (stores.length === 0) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Semua Pesanan</h1>
          <p className="text-gray-500 text-sm mt-1">Pesanan dari semua toko aktif Anda</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-12 shadow-sm text-center">
          <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="font-semibold text-gray-700 mb-1">Belum ada toko aktif</p>
          <p className="text-gray-400 text-sm mb-5">
            Pesanan akan muncul setelah toko Anda live.
          </p>
          <Link
            href="/dashboard/stores"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <Store className="w-4 h-4" />
            Lihat Status Toko
          </Link>
        </div>
      </div>
    );
  }

  const storeIdMap = Object.fromEntries(
    stores.map((s, i) => [
      s.store_id!,
      {
        name: s.store_name ?? s.requested_slug ?? "Toko",
        color: STORE_COLORS[i % STORE_COLORS.length],
      },
    ])
  );

  const storeIds = stores.map((s) => s.store_id!);

  const serviceClient = await createSupabaseServiceClient();
  let query = serviceClient
    .from("orders")
    .select(
      "id, order_number, status, payment_status, total, customer_name, customer_phone, shipping_tracking_number, created_at, store_id"
    )
    .in("store_id", storeIds)
    .order("created_at", { ascending: false })
    .limit(100);

  if (storeFilter && storeIds.includes(storeFilter)) {
    query = query.eq("store_id", storeFilter);
  }
  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: orders } = await query;
  const orderList = orders ?? [];

  const filterStores = stores.map((s) => ({
    store_id: s.store_id!,
    name: s.store_name ?? s.requested_slug ?? "Toko",
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Semua Pesanan</h1>
          <p className="text-gray-500 text-sm mt-1">Pesanan dari semua toko aktif Anda</p>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-sm font-semibold px-3 py-1.5 rounded-full">
          <ShoppingBag className="w-4 h-4" />
          {orderList.length} pesanan
        </span>
      </div>

      <OrderFilters
        stores={filterStores}
        currentStore={storeFilter}
        currentStatus={statusFilter}
      />

      {orderList.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 shadow-sm text-center">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="font-semibold text-gray-700 mb-1">Belum ada pesanan</p>
          <p className="text-gray-400 text-sm">
            {storeFilter || statusFilter
              ? "Coba ubah filter untuk melihat pesanan lain."
              : "Pesanan dari pembeli akan muncul di sini."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {orderList.map((order) => {
              const storeMeta = storeIdMap[order.store_id] ?? {
                name: "Toko",
                color: STORE_COLORS[0],
              };
              const statusCfg =
                STATUS_CONFIG[order.status as OrderStatus] ?? STATUS_CONFIG.pending;
              return (
                <div
                  key={order.id}
                  className="p-4 sm:p-5 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Package className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 text-sm">
                            #{order.order_number}
                          </span>
                          <span
                            className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${storeMeta.color}`}
                          >
                            <Store className="w-3 h-3 mr-1" />
                            {storeMeta.name}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-3 flex-wrap text-xs text-gray-500">
                          {order.customer_name && (
                            <span>{order.customer_name}</span>
                          )}
                          {order.customer_phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {order.customer_phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(order.created_at)}
                          </span>
                          {order.shipping_tracking_number && (
                            <span className="flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              {order.shipping_tracking_number}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span
                        className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${statusCfg.color}`}
                      >
                        {statusCfg.label}
                      </span>
                      <span className="font-semibold text-gray-900 text-sm">
                        {formatIDR(order.total)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {orderList.length >= 100 && (
        <p className="text-center text-xs text-gray-400">
          Menampilkan 100 pesanan terbaru.
        </p>
      )}
    </div>
  );
}
