import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-token",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // --- Validate x-internal-token from Gateway ---
  const incoming = req.headers.get("x-internal-token") ?? "";
  const tokenProd = Deno.env.get("INTERNAL_TOKEN_PRODUCTION") ?? "";
  const tokenSandbox = Deno.env.get("INTERNAL_TOKEN_SANDBOX") ?? "";

  if (!incoming || (incoming !== tokenProd && incoming !== tokenSandbox)) {
    console.error("Unauthorized: invalid x-internal-token");
    return json({ error: "Unauthorized" }, 401);
  }

  // --- Parse Gateway payload ---
  let body: {
    external_id: string;
    invoice_id: string;
    invoice_number?: string;
    status: string;
    amount: number;
    paid_at?: string;
    payment_method?: string;
    payment_channel?: string;
    environment?: string;
  };

  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { external_id, invoice_id, status, amount, paid_at, payment_method, payment_channel } = body;

  if (!external_id || !invoice_id || !status) {
    return json({ error: "Missing required fields: external_id, invoice_id, status" }, 400);
  }

  console.log("storo-payment-confirm:", { external_id, invoice_id, status, environment: body.environment });

  // --- Only process PAID status ---
  if (status !== "PAID") {
    return json({ ok: true, skipped: true, reason: `status is ${status}` });
  }

  // --- Supabase admin client ---
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // --- Lookup invoice ---
  // Strategy 1: external_id STORO-INV-{uuid} → invoices.id
  let invoice: Record<string, unknown> | null = null;

  if (external_id.startsWith("STORO-INV-")) {
    const invoiceUuid = external_id.replace("STORO-INV-", "");
    const { data } = await supabase
      .from("invoices")
      .select("id, status, client_id, metadata")
      .eq("id", invoiceUuid)
      .maybeSingle();
    if (data) {
      invoice = data;
      console.log("Found via external_id STORO-INV- prefix");
    }
  }

  // Strategy 2: provider_ref = xendit invoice_id
  if (!invoice && invoice_id) {
    const { data } = await supabase
      .from("invoices")
      .select("id, status, client_id, metadata")
      .eq("provider_ref", invoice_id)
      .maybeSingle();
    if (data) {
      invoice = data;
      console.log("Found via provider_ref");
    }
  }

  // Strategy 3: metadata->xendit_invoice_id
  if (!invoice && invoice_id) {
    const { data } = await supabase
      .from("invoices")
      .select("id, status, client_id, metadata")
      .filter("metadata->>xendit_invoice_id", "eq", invoice_id)
      .maybeSingle();
    if (data) {
      invoice = data;
      console.log("Found via metadata.xendit_invoice_id");
    }
  }

  if (!invoice) {
    console.error("Invoice not found:", { external_id, invoice_id });
    return json({ error: "Invoice not found" }, 404);
  }

  // --- Idempotency: skip if already paid ---
  if (invoice.status === "paid") {
    console.log("Invoice already paid, skipping:", invoice.id);
    return json({ ok: true, skipped: true, reason: "already paid" });
  }

  // --- Update invoice ---
  const existingMeta =
    typeof invoice.metadata === "object" && invoice.metadata !== null
      ? (invoice.metadata as Record<string, unknown>)
      : {};

  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      status: "paid",
      paid_at: paid_at ?? new Date().toISOString(),
      payment_method: payment_method ?? null,
      payment_channel: payment_channel ?? null,
      metadata: {
        ...existingMeta,
        gateway_confirmed_at: new Date().toISOString(),
        gateway_invoice_id: invoice_id,
        gateway_external_id: external_id,
        gateway_payment_method: payment_method ?? null,
        gateway_payment_channel: payment_channel ?? null,
        gateway_amount: amount,
      },
    })
    .eq("id", invoice.id as string);

  if (updateError) {
    console.error("DB update error:", updateError.message);
    // Still return 200 to prevent Gateway from retrying endlessly
    return json({ error: "DB update failed", detail: updateError.message });
  }

  console.log("Invoice confirmed paid:", invoice.id);

  // --- Trigger notification to client ---
  if (invoice.client_id) {
    const { error: notifError } = await supabase
      .from("client_notifications")
      .insert({
        client_id: invoice.client_id as string,
        title: "Pembayaran Diterima",
        message: `Pembayaran Anda${payment_method ? ` via ${payment_method}` : ""} telah dikonfirmasi. Tim kami akan segera memproses.`,
        type: "success",
        link: `/dashboard/billing/${invoice.id as string}`,
      });
    if (notifError) {
      console.warn("Notification insert failed:", notifError.message);
    }
  }

  return json({ ok: true, invoice_id: invoice.id });
});
