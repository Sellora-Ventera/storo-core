import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

async function authorize(storeId: string) {
  const auth = await createSupabaseServerClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const service = await createSupabaseServiceClient();
  const { data: client } = await service
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!client) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };

  const { data: store } = await service
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .eq("client_id", client.id)
    .maybeSingle();
  if (!store) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };

  return { service };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ storeId: string; id: string }> }
) {
  const { storeId, id } = await context.params;
  const auth = await authorize(storeId);
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.service
    .from("products")
    .select("*, product_images(*), product_variants(*)")
    .eq("id", id)
    .eq("store_id", storeId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product: data });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ storeId: string; id: string }> }
) {
  const { storeId, id } = await context.params;
  const auth = await authorize(storeId);
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const {
    name,
    slug,
    description,
    category_id,
    price,
    compare_at_price,
    sku,
    weight,
    weight_unit,
    status,
    stock,
    images,
    variants,
  } = body ?? {};

  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (slug !== undefined) update.slug = slug;
  if (description !== undefined) update.description = description;
  if (category_id !== undefined) update.category_id = category_id;
  if (price !== undefined) update.price = price;
  if (compare_at_price !== undefined) update.compare_at_price = compare_at_price;
  if (sku !== undefined) update.sku = sku;
  if (weight !== undefined) update.weight = weight;
  if (weight_unit !== undefined) update.weight_unit = weight_unit;
  if (status !== undefined) update.status = status;
  if (stock !== undefined) update.stock = stock;

  const { error: updateErr } = await auth.service
    .from("products")
    .update(update)
    .eq("id", id)
    .eq("store_id", storeId);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 });

  if (Array.isArray(images)) {
    await auth.service.from("product_images").delete().eq("product_id", id);
    if (images.length > 0) {
      await auth.service.from("product_images").insert(
        images.map((img: { url: string; alt?: string }, i: number) => ({
          product_id: id,
          url: img.url,
          alt: img.alt ?? null,
          position: i,
        }))
      );
    }
  }

  if (Array.isArray(variants)) {
    await auth.service.from("product_variants").delete().eq("product_id", id);
    if (variants.length > 0) {
      await auth.service.from("product_variants").insert(
        variants.map(
          (v: {
            name: string;
            sku?: string | null;
            price: number;
            stock: number;
            options?: Record<string, string>;
          }) => ({
            product_id: id,
            name: v.name,
            sku: v.sku ?? null,
            price: v.price,
            stock: v.stock ?? 0,
            options: v.options ?? {},
          })
        )
      );
    }
  }

  const { data: full } = await auth.service
    .from("products")
    .select("*, product_images(*), product_variants(*)")
    .eq("id", id)
    .single();
  return NextResponse.json({ product: full });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ storeId: string; id: string }> }
) {
  const { storeId, id } = await context.params;
  const auth = await authorize(storeId);
  if ("error" in auth) return auth.error;

  const { error } = await auth.service
    .from("products")
    .delete()
    .eq("id", id)
    .eq("store_id", storeId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
