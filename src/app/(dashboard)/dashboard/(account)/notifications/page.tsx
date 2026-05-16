export const dynamic = "force-dynamic";

import { Bell, ShoppingCart } from "lucide-react";
import { requireUserAndClient, getUserStores } from "@/lib/store/context";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  StorePageHeader,
  StoreCard,
  EmptyState,
  StatusBadge,
  formatDate,
} from "@/components/dashboard/store/ui";
import NotificationActions from "@/components/dashboard/store/notifications/NotificationActions";
import StoreBadge from "@/components/dashboard/account/StoreBadge";
import StoreFilter from "@/components/dashboard/account/StoreFilter";

export default async function AccountNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string }>;
}) {
  const { client } = await requireUserAndClient();
  const stores = await getUserStores(client.id);
  const allStoreIds = stores.map((s) => s.id);
  const storeById = new Map(stores.map((s) => [s.id, s]));

  // Filter dari URL ?store=<id>. Validasi: hanya boleh toko milik client.
  const params = await searchParams;
  const selectedStore = params.store && storeById.has(params.store) ? params.store : null;
  const storeIds = selectedStore ? [selectedStore] : allStoreIds;
  const filteredStore = selectedStore ? storeById.get(selectedStore) : null;

  // Source: store_notifications (storoengine schema). Order events, system events.
  const supabase = await createSupabaseServiceClient();
  const { data } = storeIds.length
    ? await supabase
        .from("store_notifications")
        .select("id, store_id, type, title, body, metadata, is_read, created_at")
        .in("store_id", storeIds)
        .order("created_at", { ascending: false })
        .limit(200)
    : { data: [] as Array<{ id: string; store_id: string; type: string; title: string; body?: string | null; metadata?: unknown; is_read: boolean; created_at: string }> };

  const items = data ?? [];
  const unread = items.filter((n) => !n.is_read).length;

  return (
    <div>
      <StorePageHeader
        title="Notifikasi"
        description={
          items.length > 0
            ? `${unread} belum dibaca dari ${items.length}${
                filteredStore ? ` (${filteredStore.name})` : " (semua toko)"
              }`
            : filteredStore
            ? `Belum ada notifikasi untuk ${filteredStore.name}.`
            : "Notifikasi sistem & event dari semua toko Anda."
        }
        actions={<StoreFilter stores={stores} />}
      />
      {items.length === 0 ? (
        <StoreCard padded={false}>
          <EmptyState
            icon={Bell}
            title="Belum ada notifikasi"
            description="Notifikasi akan muncul saat ada event baru di toko Anda."
          />
        </StoreCard>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const store = storeById.get(n.store_id);
            const Icon = n.type === "order_paid" ? ShoppingCart : Bell;
            return (
              <StoreCard
                key={n.id}
                className={n.is_read ? "" : "border-primary/40 bg-primary/5"}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`size-9 rounded-xl grid place-items-center shrink-0 ${
                      n.is_read ? "bg-slate-100 text-slate-500" : "bg-primary/10 text-primary"
                    }`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#0F172A]">{n.title}</p>
                      {store ? (
                        <StoreBadge
                          storeId={store.id}
                          name={store.name}
                          slug={store.slug}
                        />
                      ) : null}
                      {!n.is_read ? <StatusBadge tone="info">Baru</StatusBadge> : null}
                    </div>
                    {n.body ? (
                      <p className="text-sm text-[#64748B] mt-1">{n.body}</p>
                    ) : null}
                    <p className="text-[11px] text-[#94A3B8] mt-1.5">
                      {formatDate(n.created_at)}
                    </p>
                  </div>
                  {!n.is_read && store ? (
                    <NotificationActions
                      storeId={store.id}
                      mode="single"
                      id={n.id}
                    />
                  ) : null}
                </div>
              </StoreCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
