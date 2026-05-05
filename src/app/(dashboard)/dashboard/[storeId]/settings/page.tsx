import { getStoreForUser } from "@/lib/store/context";
import { StorePageHeader } from "@/components/dashboard/store/ui";
import StoreSettingsForm from "@/components/dashboard/store/settings/StoreSettingsForm";

export const dynamic = "force-dynamic";

export default async function StoreSettingsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const { store } = await getStoreForUser(storeId);

  return (
    <div>
      <StorePageHeader
        title="Pengaturan Toko"
        description="Atur identitas, branding, dan preferensi toko Anda."
      />
      <StoreSettingsForm
        storeId={storeId}
        initial={{
          name: store.name,
          slug: store.slug ?? "",
          description: store.description,
          logo_url: store.logo_url,
          banner_url: store.banner_url,
          is_active: store.is_active,
        }}
      />
    </div>
  );
}
