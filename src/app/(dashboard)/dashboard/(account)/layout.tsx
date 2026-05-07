import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import AccountSidebar from "@/components/dashboard/account/AccountSidebar";
import StoreSidebar from "@/components/dashboard/store/StoreSidebar";
import { buildStorefrontUrl } from "@/lib/store/context";
import type { StoreSummary } from "@/components/dashboard/store/StoreSwitcher";

async function getActiveStoreContext(): Promise<{
  storeId: string | null;
  stores: StoreSummary[];
  storefrontUrl: string | null;
}> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { storeId: null, stores: [], storefrontUrl: null };

    const service = await createSupabaseServiceClient();
    const { data: client } = await service
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!client) return { storeId: null, stores: [], storefrontUrl: null };

    const { data: stores } = await service
      .from("stores")
      .select("id, name, slug, is_active")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false });

    if (!stores || stores.length === 0) return { storeId: null, stores: [], storefrontUrl: null };

    const activeStore = stores.find((s) => s.is_active) ?? stores[0];
    return {
      storeId: activeStore.id,
      stores: stores as StoreSummary[],
      storefrontUrl: buildStorefrontUrl(activeStore.slug),
    };
  } catch {
    return { storeId: null, stores: [], storefrontUrl: null };
  }
}

export default async function AccountDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { storeId, stores, storefrontUrl } = await getActiveStoreContext();

  if (storeId) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <StoreSidebar storeId={storeId} stores={stores} storefrontUrl={storefrontUrl} />
        <main className="lg:pl-64">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AccountSidebar />
      <main className="lg:pl-64">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
