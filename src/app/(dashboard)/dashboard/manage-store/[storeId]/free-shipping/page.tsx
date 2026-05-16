export const dynamic = "force-dynamic";

import { Truck } from "lucide-react";
import { getStoreForUser } from "@/lib/store/context";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { StorePageHeader, StoreCard, EmptyState } from "@/components/dashboard/store/ui";
import FreeShippingManager, {
  type FreeShippingRow,
} from "@/components/dashboard/store/free-shipping/FreeShippingManager";

export default async function FreeShippingPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  await getStoreForUser(storeId);

  const supabase = await createSupabaseServiceClient();
  const { data } = await supabase
    .from("free_shipping_rules")
    .select(
      "id, name, description, min_purchase, postal_codes, allowed_courier_codes, max_subsidy, is_active, priority, usage_count, created_at"
    )
    .eq("store_id", storeId)
    .order("priority", { ascending: false });

  const rules = (data ?? []) as FreeShippingRow[];

  return (
    <div>
      <StorePageHeader
        title="Gratis Ongkir"
        description={
          rules.length > 0
            ? `${rules.length} aturan auto-apply`
            : "Aturan gratis ongkir otomatis di checkout."
        }
      />
      {rules.length === 0 ? (
        <StoreCard padded={false}>
          <EmptyState
            icon={Truck}
            title="Belum ada aturan"
            description="Atur kondisi gratis ongkir berdasarkan minimum pembelian, kode pos, atau kurir."
          />
        </StoreCard>
      ) : null}
      <FreeShippingManager storeId={storeId} initial={rules} />
    </div>
  );
}
