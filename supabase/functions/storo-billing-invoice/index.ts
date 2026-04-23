import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // --- Parse & validate request body ---
  let body: {
    invoice_id: string;
    description?: string;
    customer: { given_names: string; email: string };
    success_redirect_url: string;
    failure_redirect_url: string;
  };

  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const {
    invoice_id,
    description,
    customer,
    success_redirect_url,
    failure_redirect_url,
  } = body;

  if (
    !invoice_id ||
    !customer?.given_names ||
    !customer?.email ||
    !success_redirect_url ||
    !failure_redirect_url
  ) {
    return json(
      {
        error:
          "Missing required fields: invoice_id, customer.given_names, customer.email, success_redirect_url, failure_redirect_url",
      },
      400
    );
  }

  // --- Supabase admin client ---
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // --- Fetch invoice ---
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("id, amount, description, status, provider, metadata")
    .eq("id", invoice_id)
    .single();

  if (invoiceError || !invoice) {
    return json({ error: "Invoice not found" }, 404);
  }

  if (invoice.status !== "unpaid") {
    return json(
      { error: `Invoice is not payable (status: ${invoice.status})` },
      400
    );
  }

  // --- Idempotency: return existing Xendit URL if already created ---
  if (invoice.provider === "xendit") {
    const existingMeta =
      typeof invoice.metadata === "object" && invoice.metadata !== null
        ? (invoice.metadata as Record<string, unknown>)
        : {};
    const existingUrl = existingMeta.xendit_invoice_url as string | undefined;
    if (existingUrl) {
      return json({
        invoice_url: existingUrl,
        xendit_invoice_id: existingMeta.xendit_invoice_id,
        external_id: existingMeta.xendit_external_id,
      });
    }
  }

  // --- Determine environment & API key ---
  const env = Deno.env.get("XENDIT_ENV") ?? "sandbox";
  const xenditApiKey =
    env === "production"
      ? Deno.env.get("XENDIT_API_KEY_PRODUCTION")
      : Deno.env.get("XENDIT_API_KEY_SANDBOX");

  if (!xenditApiKey) {
    return json({ error: `Missing XENDIT_API_KEY_${env.toUpperCase()}` }, 500);
  }

  const external_id = `STORO-INV-${invoice.id}`;
  const auth = btoa(`${xenditApiKey}:`);

  // --- Resolve gateway callback URL ---
  const gatewayCallbackUrl = Deno.env.get("XENDIT_GATEWAY_CALLBACK_URL");

  // --- Build Xendit payload ---
  const invoiceDescription =
    description ?? invoice.description ?? "Pembayaran Storo.id";

  const xenditPayload: Record<string, unknown> = {
    external_id,
    amount: Number(invoice.amount),
    currency: "IDR",
    description: invoiceDescription,
    invoice_duration: 86400 * 3, // 3 days
    customer: {
      given_names: customer.given_names,
      email: customer.email,
    },
    customer_notification_preference: {
      invoice_created: ["whatsapp", "email"],
      invoice_reminder: ["whatsapp", "email"],
      invoice_paid: ["whatsapp", "email"],
    },
    success_redirect_url,
    failure_redirect_url,
    locale: "id",
    items: [
      {
        name: invoiceDescription,
        quantity: 1,
        price: Number(invoice.amount),
        category: "Service",
      },
    ],
  };

  if (gatewayCallbackUrl) {
    xenditPayload.callback_url = gatewayCallbackUrl;
  }

  // --- Call Xendit Create Invoice API ---
  let xenditRes: Response;
  try {
    xenditRes = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(xenditPayload),
    });
  } catch (err) {
    return json(
      { error: "Failed to reach Xendit API", detail: String(err) },
      502
    );
  }

  const xenditData = await xenditRes.json();

  if (!xenditRes.ok) {
    return json(
      { error: "Xendit API error", detail: xenditData },
      xenditRes.status >= 500 ? 502 : 400
    );
  }

  const { id: xendit_invoice_id, invoice_url } = xenditData as {
    id: string;
    invoice_url: string;
  };

  // --- Update invoice in DB ---
  const existingMeta =
    typeof invoice.metadata === "object" && invoice.metadata !== null
      ? (invoice.metadata as Record<string, unknown>)
      : {};

  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      provider: "xendit",
      provider_ref: xendit_invoice_id,
      invoice_url,
      metadata: {
        ...existingMeta,
        xendit_invoice_id,
        xendit_invoice_url: invoice_url,
        xendit_external_id: external_id,
      },
    })
    .eq("id", invoice_id);

  if (updateError) {
    return json(
      { error: "Failed to update invoice", detail: updateError.message },
      500
    );
  }

  return json({ invoice_url, xendit_invoice_id, external_id });
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
