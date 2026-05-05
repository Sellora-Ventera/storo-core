import { FolderTree } from "lucide-react";
import { getStoreForUser } from "@/lib/store/context";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { StorePageHeader } from "@/components/dashboard/store/ui";
import CategoriesManager, {
  type CategoryNode,
} from "@/components/dashboard/store/categories/CategoriesManager";

export const dynamic = "force-dynamic";

export default async function StoreCategoriesPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  await getStoreForUser(storeId);

  const supabase = await createSupabaseServiceClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, description, image_url, sort_order, is_active")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const categories = (data ?? []) as CategoryNode[];

  return (
    <div>
      <StorePageHeader
        title="Kategori"
        description={
          categories.length > 0
            ? `${categories.length} kategori`
            : "Organisir produk toko Anda dengan kategori"
        }
      />
      {categories.length === 0 && (
        <p className="text-sm text-[#94A3B8] mb-4 inline-flex items-center gap-2">
          <FolderTree className="size-4" /> Belum ada kategori — tambahkan yang pertama di bawah.
        </p>
      )}
      <CategoriesManager storeId={storeId} initial={categories} />
    </div>
  );
}
