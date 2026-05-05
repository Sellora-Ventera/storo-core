export const dynamic = "force-dynamic";

import { Bell } from "lucide-react";
import { getStoreForUser } from "@/lib/store/context";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  StorePageHeader,
  StoreCard,
  EmptyState,
  StatusBadge,
  formatDate,
} from "@/components/dashboard/store/ui";
import NotificationActions from "@/components/dashboard/store/notifications/NotificationActions";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  await getStoreForUser(storeId);

  const supabase = await createSupabaseServiceClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, message, link, is_read, created_at")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(100);

  const items = data ?? [];
  const unread = items.filter((n) => !n.is_read).length;

  return (
    <div>
      <StorePageHeader
        title="Notifikasi"
        description={items.length > 0 ? `${unread} belum dibaca dari ${items.length}` : "Notifikasi sistem & event toko."}
        actions={items.length > 0 ? <NotificationActions storeId={storeId} mode="markAll" /> : null}
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
          {items.map((n) => (
            <StoreCard key={n.id as string} className={n.is_read ? "" : "border-primary/40 bg-primary/5"}>
              <div className="flex items-start gap-3">
                <div className={`size-9 rounded-xl grid place-items-center shrink-0 ${
                  n.is_read ? "bg-slate-100 text-slate-500" : "bg-primary/10 text-primary"
                }`}>
                  <Bell className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[#0F172A]">{n.title as string}</p>
                    {!n.is_read ? <StatusBadge tone="info">Baru</StatusBadge> : null}
                  </div>
                  {n.message ? (
                    <p className="text-sm text-[#64748B] mt-1">{n.message as string}</p>
                  ) : null}
                  <p className="text-[11px] text-[#94A3B8] mt-1.5">{formatDate(n.created_at as string)}</p>
                </div>
                {!n.is_read ? (
                  <NotificationActions storeId={storeId} mode="single" id={n.id as string} />
                ) : null}
              </div>
            </StoreCard>
          ))}
        </div>
      )}
    </div>
  );
}
