import { NextResponse } from "next/server";
import { authorizeStoreApi } from "@/lib/store/context";

export async function POST(
  _request: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await context.params;
  const auth = await authorizeStoreApi(storeId);
  if (auth instanceof NextResponse) return auth;

  const { error } = await auth.service
    .from("notifications")
    .update({ is_read: true })
    .eq("store_id", storeId)
    .eq("is_read", false);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
