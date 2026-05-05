import { NextResponse } from "next/server";
import { authorizeStoreApi } from "@/lib/store/context";

const ALLOWED = new Set(["pending", "approved", "rejected"]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ storeId: string; id: string }> }
) {
  const { storeId, id } = await context.params;
  const auth = await authorizeStoreApi(storeId);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  if (!ALLOWED.has(body?.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data, error } = await auth.service
    .from("product_reviews")
    .update({ status: body.status })
    .eq("id", id)
    .eq("store_id", storeId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ review: data });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ storeId: string; id: string }> }
) {
  const { storeId, id } = await context.params;
  const auth = await authorizeStoreApi(storeId);
  if (auth instanceof NextResponse) return auth;

  const { error } = await auth.service
    .from("product_reviews")
    .delete()
    .eq("id", id)
    .eq("store_id", storeId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
