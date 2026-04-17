import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  DUMMY_BANNERS,
  DUMMY_CATEGORIES,
  DUMMY_PRODUCTS,
} from "@/lib/data/template-preview-seed";

/**
 * Seeder for template preview deployments.
 * Creates a dedicated `stores` row + dummy products/categories/banners,
 * all scoped under one store_id (UUID) that the Vercel preview will read
 * via STORE_ID env var.
 */

function getServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export interface SeedResult {
  storeId: string;
  storeSlug: string;
  productsInserted: number;
  categoriesInserted: number;
  bannersInserted: number;
}

/**
 * Create a preview store row + populate dummy data.
 * Returns the new stores.id (UUID) to be used as STORE_ID env var on Vercel.
 */
export async function seedTemplatePreviewData(slug: string): Promise<SeedResult> {
  const supabase = getServiceClient();
  const storeSlug = `preview-${slug}`;

  // 1. Create store row (or fetch existing)
  const { data: existingStore } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", storeSlug)
    .maybeSingle();

  let storeId: string;
  if (existingStore?.id) {
    storeId = existingStore.id;
  } else {
    const { data: newStore, error: storeError } = await supabase
      .from("stores")
      .insert({
        name: `Preview ${slug}`,
        slug: storeSlug,
        description: `Preview demo untuk template ${slug}`,
        user_id: "system-preview",
        is_active: true,
        settings: { is_preview: true },
      })
      .select("id")
      .single();

    if (storeError || !newStore) {
      throw new Error(`Failed to create preview store: ${storeError?.message}`);
    }
    storeId = newStore.id;
  }

  // 2. Insert categories
  const categoryRows = DUMMY_CATEGORIES.map((c) => ({
    store_id: storeId,
    name: c.name,
    slug: c.slug,
    description: c.description,
    sort_order: c.sort_order,
    is_active: true,
  }));

  const { data: insertedCategories, error: catError } = await supabase
    .from("categories")
    .upsert(categoryRows, { onConflict: "store_id,slug" })
    .select("id, slug");

  if (catError) {
    throw new Error(`Failed to seed categories: ${catError.message}`);
  }

  const categoryMap = new Map((insertedCategories ?? []).map((c) => [c.slug, c.id]));

  // 3. Insert products
  const productRows = DUMMY_PRODUCTS.map((p) => ({
    store_id: storeId,
    category_id: categoryMap.get(p.category_slug) ?? null,
    name: p.name,
    slug: p.slug,
    description: p.description,
    short_description: p.short_description,
    images: p.images,
    price: p.price,
    compare_at_price: p.compare_at_price ?? null,
    stock: p.stock,
    sku: p.sku,
    is_active: true,
    is_featured: p.compare_at_price ? true : false,
  }));

  const { error: prodError } = await supabase
    .from("products")
    .upsert(productRows, { onConflict: "store_id,slug" });

  if (prodError) {
    throw new Error(`Failed to seed products: ${prodError.message}`);
  }

  // 4. Insert banners (table: store_banners, column: position not sort_order)
  const bannerRows = DUMMY_BANNERS.map((b) => ({
    store_id: storeId,
    title: b.title,
    subtitle: b.subtitle,
    image_url: b.image_url,
    link_url: b.link_url,
    position: b.sort_order,
    is_active: true,
  }));

  const { error: bannerError } = await supabase.from("store_banners").insert(bannerRows);

  // Banners non-fatal — table may not exist in all environments
  if (bannerError && !bannerError.message.includes("does not exist")) {
    console.warn(`Banner seed warning: ${bannerError.message}`);
  }

  return {
    storeId,
    storeSlug,
    productsInserted: productRows.length,
    categoriesInserted: categoryRows.length,
    bannersInserted: bannerError ? 0 : bannerRows.length,
  };
}

/**
 * Remove all data tied to a preview store, then delete the store row itself.
 */
export async function unseedTemplatePreviewData(slug: string): Promise<void> {
  const supabase = getServiceClient();
  const storeSlug = `preview-${slug}`;

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", storeSlug)
    .maybeSingle();

  if (!store?.id) return;

  // ON DELETE CASCADE on stores will clean up children
  await supabase.from("stores").delete().eq("id", store.id);
}
