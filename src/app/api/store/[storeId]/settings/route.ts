import { NextResponse } from "next/server";
import { authorizeStoreApi } from "@/lib/store/context";

export async function PUT(
  request: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await context.params;
  const auth = await authorizeStoreApi(storeId);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const update: Record<string, unknown> = {};
  for (const key of [
    "name",
    "slug",
    "description",
    "logo_url",
    "banner_url",
    "is_active",
    "settings",
  ] as const) {
    if (body?.[key] !== undefined) update[key] = body[key];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await auth.service
    .from("stores")
    .update(update)
    .eq("id", storeId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ store: data });
}
