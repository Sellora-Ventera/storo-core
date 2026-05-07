import { buildStorefrontUrl, getStoreForUser } from "@/lib/store/context";
import StoreSidebar from "@/components/dashboard/store/StoreSidebar";

export default async function StoreDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const { store, stores } = await getStoreForUser(storeId);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <StoreSidebar
        storeId={store.id}
        stores={stores}
        storefrontUrl={buildStorefrontUrl(store.slug, store.custom_domain)}
      />
      <main className="lg:pl-64">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
