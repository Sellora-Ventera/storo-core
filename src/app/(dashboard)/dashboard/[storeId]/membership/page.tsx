export const dynamic = "force-dynamic";

import { Crown } from "lucide-react";
import { getStoreForUser } from "@/lib/store/context";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { StorePageHeader, StoreCard, EmptyState } from "@/components/dashboard/store/ui";
import MembershipManager, {
  type TierRow,
} from "@/components/dashboard/store/membership/MembershipManager";

export default async function MembershipPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  await getStoreForUser(storeId);

  const supabase = await createSupabaseServiceClient();
  const { data } = await supabase
    .from("membership_tiers")
    .select(
      "id, name, min_spend, discount_pct, free_shipping, earn_multiplier, sort_order, is_active, created_at"
    )
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true });

  const tiers = (data ?? []) as TierRow[];

  return (
    <div>
      <StorePageHeader
        title="Membership Tiers"
        description={
          tiers.length > 0
            ? `${tiers.length} tier`
            : "Atur level membership pelanggan berdasarkan total belanja."
        }
      />
      {tiers.length === 0 ? (
        <StoreCard padded={false}>
          <EmptyState
            icon={Crown}
            title="Belum ada tier"
            description="Tambah tier untuk reward pelanggan loyal."
          />
        </StoreCard>
      ) : null}
      <MembershipManager storeId={storeId} initial={tiers} />
    </div>
  );
}
