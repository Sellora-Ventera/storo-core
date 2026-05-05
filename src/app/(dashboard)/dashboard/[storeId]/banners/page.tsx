export const dynamic = "force-dynamic";

import { Image as ImageIcon } from "lucide-react";
import { getStoreForUser } from "@/lib/store/context";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { StorePageHeader, StoreCard, EmptyState } from "@/components/dashboard/store/ui";
import BannersManager, {
  type BannerRow,
} from "@/components/dashboard/store/banners/BannersManager";

export default async function BannersPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  await getStoreForUser(storeId);

  const supabase = await createSupabaseServiceClient();
  const { data } = await supabase
    .from("store_banners")
    .select("id, title, subtitle, image_url, link_url, position, is_active, start_date, end_date, created_at")
    .eq("store_id", storeId)
    .order("position", { ascending: true });

  const banners = (data ?? []) as BannerRow[];

  return (
    <div>
      <StorePageHeader
        title="Banner"
        description={
          banners.length > 0
            ? `${banners.length} banner — tampil di homepage storefront`
            : "Banner promosi homepage storefront"
        }
      />
      {banners.length === 0 ? (
        <StoreCard padded={false}>
          <EmptyState
            icon={ImageIcon}
            title="Belum ada banner"
            description="Tambah banner untuk tampilan promosi di homepage storefront."
          />
        </StoreCard>
      ) : null}
      <BannersManager storeId={storeId} initial={banners} />
    </div>
  );
}
