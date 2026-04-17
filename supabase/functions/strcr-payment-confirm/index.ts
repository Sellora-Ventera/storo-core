import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-internal-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // --- Validate internal token ---
  const token = req.headers.get("x-internal-token");
  const prodToken = Deno.env.get("INTERNAL_TOKEN_PRODUCTION");
  const sandboxToken = Deno.env.get("INTERNAL_TOKEN_SANDBOX");

  if (!token || (token !== prodToken && token !== sandboxToken)) {
    return json({ error: "Unauthorized" }, 401);
  }

  // --- Parse payload ---
  let payload: {
    external_id: string;
    invoice_id: string;
    invoice_number: string;
    status: string;
    amount: number;
    paid_at: string;
    payment_method: string;
    payment_channel: string;
    environment: string;
  };

  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const {
    external_id,
    invoice_id,
    status,
    amount,
    paid_at,
    payment_method,
    payment_channel,
  } = payload;

  // --- Skip non-PAID statuses (idempotent) ---
  if (status !== "PAID") {
    return json({ ok: true, skipped: true });
  }

  if (!external_id) {
    return json({ error: "Missing external_id" }, 400);
  }

  // --- Parse invoice UUID from external_id ---
  // external_id format: STRCR-{invoice_uuid}
  if (!external_id.startsWith("STRCR-")) {
    return json({ error: "Invalid external_id format" }, 400);
  }
  const invoiceUuid = external_id.slice("STRCR-".length);

  // --- Supabase admin client ---
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // --- Find invoice ---
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("id, status, client_id, provider_ref, metadata")
    .eq("id", invoiceUuid)
    .single();

  if (invoiceError || !invoice) {
    return json({ error: "Invoice not found", invoice_id: invoiceUuid }, 404);
  }

  // --- Idempotency: skip if already paid ---
  if (invoice.status !== "unpaid") {
    return json({ ok: true, skipped: "already_paid" });
  }

  // --- Update invoice to paid ---
  const existingMeta =
    typeof invoice.metadata === "object" && invoice.metadata !== null
      ? (invoice.metadata as Record<string, unknown>)
      : {};

  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      status: "paid",
      paid_at: paid_at ?? new Date().toISOString(),
      provider: "xendit",
      provider_ref: invoice.provider_ref || invoice_id,
      metadata: {
        ...existingMeta,
        xendit_invoice_id: invoice_id,
        xendit_external_id: external_id,
        xendit_status: status,
        xendit_payment_method: payment_method ?? null,
        xendit_payment_channel: payment_channel ?? null,
        xendit_paid_amount: amount ?? null,
        gateway_confirmed_at: new Date().toISOString(),
      },
    })
    .eq("id", invoice.id);

  if (updateError) {
    console.error("Failed to update invoice:", updateError.message);
    return json(
      { error: "Failed to update invoice", detail: updateError.message },
      200
    );
  }

  console.log("Invoice paid:", invoice.id);

  // --- Update onboarding_leads status ---
  await supabase
    .from("onboarding_leads")
    .update({ status: "paid" })
    .eq("invoice_id", invoice.id)
    .then(({ error }) => {
      if (error) console.warn("Failed to update onboarding_leads:", error.message);
    });

  // --- Create client notification ---
  if (invoice.client_id) {
    try {
      await supabase.from("client_notifications").insert({
        client_id: invoice.client_id,
        title: "Pembayaran Diterima",
        message: `Pembayaran Anda via ${payment_method || "Xendit"} telah dikonfirmasi. Tim kami akan segera memproses.`,
        type: "success",
        link: `/dashboard/billing/${invoice.id}`,
      });
    } catch (e) {
      console.warn("Notification insert failed:", e);
    }
  }

  return json({ ok: true });
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
