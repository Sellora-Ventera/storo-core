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

  return { service, clientId: client.id, userId: user.id };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await context.params;
  const auth = await authorize(storeId);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const search = url.searchParams.get("search");
  const status = url.searchParams.get("status");
  const categoryId = url.searchParams.get("category_id");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, parseInt(url.searchParams.get("limit") ?? "20", 10));
  const offset = (page - 1) * limit;

  let query = auth.service
    .from("products")
    .select("*, product_images(*), product_variants(*)", { count: "exact" })
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (status) query = query.eq("status", status);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({
    products: data,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      total_pages: count ? Math.ceil(count / limit) : 0,
    },
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await context.params;
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

  if (!name || price === undefined || price === null) {
    return NextResponse.json(
      { error: "name dan price wajib diisi" },
      { status: 400 }
    );
  }

  const { data: product, error: insertErr } = await auth.service
    .from("products")
    .insert({
      store_id: storeId,
      name,
      slug: slug ?? name.toLowerCase().replace(/\s+/g, "-"),
      description: description ?? null,
      category_id: category_id ?? null,
      price,
      compare_at_price: compare_at_price ?? null,
      sku: sku ?? null,
      weight: weight ?? null,
      weight_unit: weight_unit ?? "gram",
      status: status ?? "draft",
      stock: stock ?? 0,
    })
    .select()
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 400 });
  }

  if (Array.isArray(images) && images.length > 0) {
    await auth.service.from("product_images").insert(
      images.map((img: { url: string; alt?: string }, i: number) => ({
        product_id: product.id,
        url: img.url,
        alt: img.alt ?? null,
        position: i,
      }))
    );
  }

  if (Array.isArray(variants) && variants.length > 0) {
    await auth.service.from("product_variants").insert(
      variants.map(
        (v: {
          name: string;
          sku?: string | null;
          price: number;
          stock: number;
          options?: Record<string, string>;
        }) => ({
          product_id: product.id,
          name: v.name,
          sku: v.sku ?? null,
          price: v.price,
          stock: v.stock ?? 0,
          options: v.options ?? {},
        })
      )
    );
  }

  const { data: fullProduct } = await auth.service
    .from("products")
    .select("*, product_images(*), product_variants(*)")
    .eq("id", product.id)
    .single();

  return NextResponse.json({ product: fullProduct }, { status: 201 });
}
