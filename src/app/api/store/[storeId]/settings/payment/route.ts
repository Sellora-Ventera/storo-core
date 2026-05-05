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
  settings.payment = {
    use_storo_gateway: body.use_storo_gateway ?? true,
    xendit_secret_key: body.xendit_secret_key ?? "",
    xendit_public_key: body.xendit_public_key ?? "",
    midtrans_server_key: body.midtrans_server_key ?? "",
    midtrans_client_key: body.midtrans_client_key ?? "",
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
