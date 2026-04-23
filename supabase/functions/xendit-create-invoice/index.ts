import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userError || !user) throw new Error("Invalid or expired token");

    const { invoice_id } = await req.json();
    if (!invoice_id) throw new Error("invoice_id is required");

    const XENDIT_SECRET_KEY = Deno.env.get("XENDIT_SECRET_KEY");
    if (!XENDIT_SECRET_KEY) throw new Error("Xendit payment is not configured");

    const APP_URL = Deno.env.get("APP_URL") || "https://storo.id";

    // Fetch invoice + client info
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoice_id)
      .single();

    if (invoiceError || !invoice) throw new Error("Invoice not found");
    if (invoice.status !== "unpaid") throw new Error(`Invoice is not payable (status: ${invoice.status})`);

    // If already has Xendit URL, return it
    if (invoice.provider === "xendit") {
      const existingUrl = (invoice.metadata as Record<string, unknown>)?.xendit_invoice_url as string | undefined;
      if (existingUrl) {
        return new Response(
          JSON.stringify({ success: true, xendit_invoice_url: existingUrl }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    // Fetch client for customer info
    const { data: client } = await supabase
      .from("clients")
      .select("full_name, whatsapp, shopee_store_name")
      .eq("id", invoice.client_id)
      .single();

    const externalId = `storo-${invoice.id}`;
    const amountInRupiah = Number(invoice.amount); // already in IDR

    const xenditPayload = {
      external_id: externalId,
      amount: amountInRupiah,
      currency: "IDR",
      description: invoice.description || `Pembayaran Storo.id - ${client?.shopee_store_name || ""}`,
      customer: {
        given_names: client?.full_name || "Customer",
        mobile_number: client?.whatsapp ? `+62${client.whatsapp.replace(/^0/, "")}` : undefined,
      },
      customer_notification_preference: {
        invoice_created: ["whatsapp"],
        invoice_reminder: ["whatsapp"],
        invoice_paid: ["whatsapp"],
      },
      success_redirect_url: `${APP_URL}/payment/success?invoice_id=${invoice.id}`,
      failure_redirect_url: `${APP_URL}/payment/failed?invoice_id=${invoice.id}`,
      invoice_duration: 86400 * 3, // 3 hari
      locale: "id",
      items: [
        {
          name: invoice.description || "Setup Webstore Storo.id",
          quantity: 1,
          price: amountInRupiah,
          category: "Service",
        },
      ],
    };

    const xenditResponse = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(XENDIT_SECRET_KEY + ":")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(xenditPayload),
    });

    if (!xenditResponse.ok) {
      const err = await xenditResponse.text();
      console.error("Xendit API error:", xenditResponse.status, err);
      throw new Error(`Xendit API error: ${xenditResponse.status}`);
    }

    const xenditInvoice = await xenditResponse.json();
    const existingMeta = (typeof invoice.metadata === "object" && invoice.metadata !== null)
      ? invoice.metadata as Record<string, unknown>
      : {};

    await supabase
      .from("invoices")
      .update({
        provider: "xendit",
        provider_ref: xenditInvoice.id,
        metadata: {
          ...existingMeta,
          xendit_invoice_id: xenditInvoice.id,
          xendit_invoice_url: xenditInvoice.invoice_url,
          xendit_external_id: externalId,
        },
      })
      .eq("id", invoice.id);

    return new Response(
      JSON.stringify({ success: true, xendit_invoice_url: xenditInvoice.invoice_url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
