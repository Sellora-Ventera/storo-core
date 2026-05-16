export const dynamic = "force-dynamic";

import { ArrowLeft } from "lucide-react";
import { getStoreForUser } from "@/lib/store/context";
import { StorePageHeader, ChipButton } from "@/components/dashboard/store/ui";
import ShippingSettingsForm from "@/components/dashboard/store/settings/ShippingSettingsForm";

export default async function ShippingSettingsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const { store } = await getStoreForUser(storeId);

  const settings =
    typeof store.settings === "object" && store.settings !== null
      ? (store.settings as Record<string, unknown>)
      : {};
  const shipping =
    typeof settings.shipping === "object" && settings.shipping !== null
      ? (settings.shipping as Record<string, unknown>)
      : {};

  return (
    <div>
      <StorePageHeader
        title="Pengaturan Pengiriman"
        description="Atur alamat asal dan kurir aktif untuk perhitungan ongkir."
        actions={
          <ChipButton
            href={`/dashboard/manage-store/${storeId}/settings`}
            variant="default"
            icon={<ArrowLeft className="size-3.5" />}
          >
            Kembali ke Pengaturan
          </ChipButton>
        }
      />
      <ShippingSettingsForm
        storeId={storeId}
        initial={{
          origin_address: (shipping.origin_address as string) ?? "",
          origin_city: (shipping.origin_city as string) ?? "",
          origin_province: (shipping.origin_province as string) ?? "",
          origin_postal_code: (shipping.origin_postal_code as string) ?? "",
          allowed_couriers: (shipping.allowed_couriers as string[]) ?? [],
        }}
      />
    </div>
  );
}
