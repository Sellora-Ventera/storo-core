import { NextResponse } from "next/server";
import { authorizeStoreApi } from "@/lib/store/context";

const ALLOWED_BILLING_MODELS = ["storo_gateway", "own_prepaid"] as const;
type BillingModel = (typeof ALLOWED_BILLING_MODELS)[number];

export async function PUT(
  request: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await context.params;
  const auth = await authorizeStoreApi(storeId);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const billingModel = body.billing_model as BillingModel | undefined;

  if (!billingModel || !ALLOWED_BILLING_MODELS.includes(billingModel)) {
    return NextResponse.json(
      { error: "Invalid billing_model. Must be 'storo_gateway' or 'own_prepaid'." },
      { status: 400 }
    );
  }

  // Read existing settings (preserve other keys, update payment block)
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
    xendit_secret_key: body.xendit_secret_key ?? "",
    xendit_public_key: body.xendit_public_key ?? "",
    midtrans_server_key: body.midtrans_server_key ?? "",
    midtrans_client_key: body.midtrans_client_key ?? "",
  };

  const { data, error } = await auth.service
    .from("stores")
    .update({ billing_model: billingModel, settings })
    .eq("id", storeId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ store: data });
}
