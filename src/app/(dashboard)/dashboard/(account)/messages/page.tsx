export const dynamic = "force-dynamic";

import { MessageCircle } from "lucide-react";
import { requireUserAndClient, getUserStores } from "@/lib/store/context";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  StorePageHeader,
  StoreCard,
  EmptyState,
  StatusBadge,
  formatDate,
} from "@/components/dashboard/store/ui";
import StoreBadge from "@/components/dashboard/account/StoreBadge";
import StoreFilter from "@/components/dashboard/account/StoreFilter";

export default async function AccountMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string }>;
}) {
  const { client } = await requireUserAndClient();
  const stores = await getUserStores(client.id);
  const allStoreIds = stores.map((s) => s.id);
  const storeById = new Map(stores.map((s) => [s.id, s]));

  // Filter dari URL ?store=<id>. Validasi: hanya boleh toko milik client
  // (prevent privilege escalation lewat URL manipulation).
  const params = await searchParams;
  const selectedStore = params.store && storeById.has(params.store) ? params.store : null;
  const storeIds = selectedStore ? [selectedStore] : allStoreIds;
  const filteredStore = selectedStore ? storeById.get(selectedStore) : null;

  // Source: store_messages (storoengine schema). Buyer → seller contact messages.
  const supabase = await createSupabaseServiceClient();
  const { data } = storeIds.length
    ? await supabase
        .from("store_messages")
        .select(
          "id, store_id, customer_name, customer_email, customer_phone, product_name, message, is_read, created_at"
        )
        .in("store_id", storeIds)
        .order("created_at", { ascending: false })
        .limit(200)
    : { data: [] as Array<{ id: string; store_id: string; customer_name: string; customer_email?: string | null; customer_phone?: string | null; product_name?: string | null; message: string; is_read: boolean; created_at: string }> };

  const items = data ?? [];
  const unreadCount = items.filter((m) => !m.is_read).length;

  return (
    <div>
      <StorePageHeader
        title="Pesan"
        description={
          items.length > 0
            ? `${unreadCount} belum dibaca dari ${items.length} pesan${
                filteredStore ? ` (${filteredStore.name})` : " (semua toko)"
              }`
            : filteredStore
            ? `Belum ada pesan untuk ${filteredStore.name}.`
            : "Pesan dari pelanggan via contact form di semua toko Anda."
        }
        actions={<StoreFilter stores={stores} />}
      />
      {items.length === 0 ? (
        <StoreCard padded={false}>
          <EmptyState
            icon={MessageCircle}
            title="Belum ada pesan"
            description="Pesan akan muncul saat ada yang mengisi contact form di storefront toko Anda."
          />
        </StoreCard>
      ) : (
        <div className="space-y-3">
          {items.map((m) => {
            const store = storeById.get(m.store_id);
            return (
              <StoreCard
                key={m.id}
                className={m.is_read ? "" : "border-primary/40 bg-primary/5"}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold text-[#0F172A]">
                        {m.customer_name}
                      </p>
                      {store ? (
                        <StoreBadge
                          storeId={store.id}
                          name={store.name}
                          slug={store.slug}
                        />
                      ) : null}
                      {!m.is_read ? <StatusBadge tone="info">Baru</StatusBadge> : null}
                    </div>
                    <p className="text-xs text-[#64748B]">
                      {[m.customer_email, m.customer_phone].filter(Boolean).join(" • ")} •{" "}
                      {formatDate(m.created_at)}
                    </p>
                    {m.product_name ? (
                      <p className="text-xs text-[#64748B] mt-1">
                        Tanya tentang: <span className="font-medium">{m.product_name}</span>
                      </p>
                    ) : null}
                    <p className="text-sm text-[#64748B] mt-2 whitespace-pre-wrap">
                      {m.message}
                    </p>
                  </div>
                  {m.customer_email ? (
                    <a
                      href={`mailto:${m.customer_email}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium bg-white border border-[#E5E8EF] text-[#0F172A] hover:bg-[#F8F9FC] transition cursor-pointer"
                    >
                      Balas via Email
                    </a>
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
