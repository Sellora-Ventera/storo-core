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

  const { data: store, error: fetchErr } = await auth.service
    .from("stores")
    .select("settings")
    .eq("id", storeId)
    .single();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 400 });

  const settings =
    typeof store?.settings === "object" && store.settings !== null
      ? { ...(store.settings as Record<string, unknown>) }
      : {};
  settings.shipping = {
    origin_address: body.origin_address ?? "",
    origin_city: body.origin_city ?? "",
    origin_province: body.origin_province ?? "",
    origin_postal_code: body.origin_postal_code ?? "",
    allowed_couriers: Array.isArray(body.allowed_couriers) ? body.allowed_couriers : [],
  };

  const { data, error } = await auth.service
    .from("stores")
    .update({ settings })
    .eq("id", storeId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ store: data });
}
