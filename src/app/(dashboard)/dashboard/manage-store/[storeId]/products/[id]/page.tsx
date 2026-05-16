import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getStoreForUser } from "@/lib/store/context";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { StorePageHeader, ChipButton } from "@/components/dashboard/store/ui";
import ProductForm, {
  type ProductInitialData,
} from "@/components/dashboard/store/products/ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ storeId: string; id: string }>;
}) {
  const { storeId, id } = await params;
  await getStoreForUser(storeId);
  const supabase = await createSupabaseServiceClient();

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, slug, description, price, compare_at_price, stock, sku, status, category_id, images, product_images(url, position), product_variants(id, name, sku, price, stock)"
      )
      .eq("id", id)
      .eq("store_id", storeId)
      .maybeSingle(),
    supabase
      .from("categories")
      .select("id, name")
      .eq("store_id", storeId)
      .order("name"),
  ]);

  if (!product) notFound();

  const productImages =
    (product.product_images as { url: string; position: number }[] | null)
      ?.slice()
      .sort((a, b) => a.position - b.position)
      .map((p) => ({ url: p.url })) ?? [];
  const fallbackImages =
    Array.isArray(product.images)
      ? (product.images as string[]).map((url) => ({ url }))
      : [];

  const initial: ProductInitialData = {
    id: product.id as string,
    name: (product.name as string) ?? "",
    slug: (product.slug as string) ?? "",
    description: (product.description as string | null) ?? null,
    price: Number(product.price) || 0,
    compare_at_price:
      product.compare_at_price === null ? null : Number(product.compare_at_price),
    stock: Number(product.stock) || 0,
    sku: (product.sku as string | null) ?? null,
    status: (product.status as string) ?? "draft",
    category_id: (product.category_id as string | null) ?? null,
    images: productImages.length > 0 ? productImages : fallbackImages,
    variants:
      (product.product_variants as
        | { id: string; name: string; sku: string | null; price: number; stock: number }[]
        | null) ?? [],
  };

  return (
    <div>
      <StorePageHeader
        title="Edit Produk"
        description={initial.name}
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
        mode="edit"
        initial={initial}
      />
    </div>
  );
}
