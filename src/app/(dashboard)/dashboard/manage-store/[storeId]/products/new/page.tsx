import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getStoreForUser } from "@/lib/store/context";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { StorePageHeader, ChipButton } from "@/components/dashboard/store/ui";
import ProductForm from "@/components/dashboard/store/products/ProductForm";

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  await getStoreForUser(storeId);

  const supabase = await createSupabaseServiceClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("store_id", storeId)
    .order("name");

  return (
    <div>
      <StorePageHeader
        title="Tambah Produk"
        description="Lengkapi data produk Anda."
        actions={
          <ChipButton
            href={`/dashboard/manage-store/${storeId}/products`}
            variant="default"
            icon={<ArrowLeft className="size-3.5" />}
          >
            Kembali
          </ChipButton>
        }
      />
      <ProductForm
        storeId={storeId}
        categories={(categories ?? []) as { id: string; name: string }[]}
        mode="create"
      />
    </div>
  );
}
