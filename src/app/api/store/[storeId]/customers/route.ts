import { NextResponse } from "next/server";
import { authorizeStoreApi } from "@/lib/store/context";

export async function GET(
  request: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await context.params;
  const auth = await authorizeStoreApi(storeId);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const search = url.searchParams.get("search");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, parseInt(url.searchParams.get("limit") ?? "20", 10));
  const offset = (page - 1) * limit;

  let query = auth.service
    .from("customers")
    .select(
      "id, name, email, phone, total_orders, total_spent, created_at, last_order_at",
      { count: "exact" }
    )
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
    );
  }

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({
    customers: data,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      total_pages: count ? Math.ceil(count / limit) : 0,
    },
  });
}
