export const dynamic = "force-dynamic";

import { Ticket } from "lucide-react";
import { getStoreForUser } from "@/lib/store/context";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { StorePageHeader, StoreCard, EmptyState } from "@/components/dashboard/store/ui";
import PromosManager, {
  type PromoRow,
} from "@/components/dashboard/store/promos/PromosManager";

export default async function PromosPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  await getStoreForUser(storeId);

  const supabase = await createSupabaseServiceClient();
  const { data } = await supabase
    .from("store_promos")
    .select(
      "id, name, code, type, value, min_purchase, max_discount, usage_limit, used_count, is_active, start_date, end_date, created_at"
    )
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  const promos = (data ?? []) as PromoRow[];

  return (
    <div>
      <StorePageHeader
        title="Promo & Voucher"
        description={
          promos.length > 0
            ? `${promos.length} promo`
            : "Kelola voucher diskon untuk pelanggan."
        }
      />
      {promos.length === 0 ? (
        <StoreCard padded={false}>
          <EmptyState
            icon={Ticket}
            title="Belum ada promo"
            description="Tambah voucher diskon untuk pelanggan."
          />
        </StoreCard>
      ) : null}
      <PromosManager storeId={storeId} initial={promos} />
    </div>
  );
}
