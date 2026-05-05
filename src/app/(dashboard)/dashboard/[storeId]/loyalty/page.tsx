export const dynamic = "force-dynamic";

import { getStoreForUser } from "@/lib/store/context";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { StorePageHeader } from "@/components/dashboard/store/ui";
import LoyaltyConfigForm from "@/components/dashboard/store/loyalty/LoyaltyConfigForm";

export default async function LoyaltyPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  await getStoreForUser(storeId);

  const supabase = await createSupabaseServiceClient();
  const { data: config } = await supabase
    .from("loyalty_config")
    .select("is_enabled, earn_rate, point_value, min_redeem, max_redeem_pct")
    .eq("store_id", storeId)
    .maybeSingle();

  return (
    <div>
      <StorePageHeader
        title="Program Loyalitas"
        description="Atur sistem poin pelanggan: earn rate, redemption, dan limit."
      />
      <LoyaltyConfigForm
        storeId={storeId}
        initial={
          config ?? {
            is_enabled: false,
            earn_rate: 0.01,
            point_value: 10,
            min_redeem: 100,
            max_redeem_pct: 0.1,
          }
        }
      />
    </div>
  );
}
