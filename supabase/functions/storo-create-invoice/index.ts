import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

  // --- Parse body ---
  let body: {
    order_id: string;
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

  const { order_id, description, customer, success_redirect_url, failure_redirect_url } = body;

  if (
    !order_id ||
    !customer?.given_names ||
    !customer?.email ||
    !success_redirect_url ||
    !failure_redirect_url
  ) {
    return json(
      {
        error:
          "Missing required fields: order_id, customer.given_names, customer.email, success_redirect_url, failure_redirect_url",
      },
      400
    );
  }

  // --- Pick API key based on XENDIT_ENV ---
  const env = Deno.env.get("XENDIT_ENV") ?? "sandbox";
  const apiKey =
    env === "production"
      ? Deno.env.get("XENDIT_API_KEY_PRODUCTION")
      : Deno.env.get("XENDIT_API_KEY_SANDBOX");

  if (!apiKey) {
    console.error(`XENDIT_API_KEY_${env.toUpperCase()} not configured`);
    return json({ error: "Xendit payment is not configured" }, 500);
  }

  // --- Supabase admin client ---
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // --- Fetch invoice by order_id (mapped to invoices.id) ---
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("id, amount, description, status, metadata")
    .eq("id", order_id)
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

  // --- Idempotency: return existing invoice_url if already created ---
  const existingMeta =
    typeof invoice.metadata === "object" && invoice.metadata !== null
      ? (invoice.metadata as Record<string, unknown>)
      : {};

  if (existingMeta.xendit_invoice_url) {
    return json({
      invoice_url: existingMeta.xendit_invoice_url as string,
      xendit_invoice_id: existingMeta.xendit_invoice_id as string,
      external_id: existingMeta.xendit_external_id as string,
    });
  }

  // --- Build external_id (STORO prefix required by Gateway routing) ---
  const external_id = `STORO-INV-${invoice.id}`;
  const invoiceDescription = description ?? invoice.description ?? "Pembayaran Storo.id";
  const auth = btoa(`${apiKey}:`);

  const xenditPayload = {
    external_id,
    amount: Number(invoice.amount),
    currency: "IDR",
    description: invoiceDescription,
    invoice_duration: 86400 * 3, // 3 hari
    customer: {
      given_names: customer.given_names,
      email: customer.email,
    },
    customer_notification_preference: {
      invoice_created: ["email"],
      invoice_reminder: ["email"],
      invoice_paid: ["email"],
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
    return json({ error: "Failed to reach Xendit API", detail: String(err) }, 502);
  }

  const xenditData = await xenditRes.json();

  if (!xenditRes.ok) {
    console.error("Xendit API error:", xenditRes.status, JSON.stringify(xenditData));
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
        xendit_env: env,
      },
    })
    .eq("id", order_id);

  if (updateError) {
    console.error("DB update error:", updateError.message);
    return json({ error: "Failed to save invoice data", detail: updateError.message }, 500);
  }

  return json({ invoice_url, xendit_invoice_id, external_id });
});
