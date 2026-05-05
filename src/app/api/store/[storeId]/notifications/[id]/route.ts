import { NextResponse } from "next/server";
import { authorizeStoreApi } from "@/lib/store/context";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ storeId: string; id: string }> }
) {
  const { storeId, id } = await context.params;
  const auth = await authorizeStoreApi(storeId);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const update: Record<string, unknown> = {};
  if (body?.is_read !== undefined) update.is_read = body.is_read;

  const { data, error } = await auth.service
    .from("notifications")
    .update(update)
    .eq("id", id)
    .eq("store_id", storeId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ notification: data });
}
