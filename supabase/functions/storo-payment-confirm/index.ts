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
      .select("id, status, client_id, type, amount, metadata")
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
      .select("id, status, client_id, type, amount, metadata")
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
      .select("id, status, client_id, type, amount, metadata")
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

  // --- Fire Sharelink purchase event (if referee was attributed) ---------
  // Mirrors the logic that lives in store-core/src/lib/sharelink/fire-purchase-event.ts
  // — but inlined here because the gateway routes Xendit callbacks to THIS
  // edge function, not to /api/webhooks/xendit. Without this firing, no
  // referrer reward is ever created when a referee pays.
  //
  // Best-effort: any failure is logged but doesn't block the response. Invoice
  // is already marked paid, that's the critical state mutation. Sharelink
  // dedupes on (code, referee_id, event_type), so retries are safe.
  if (invoice.client_id && invoice.type === "setup") {
    const sharelinkBase = Deno.env.get("SHARELINK_BASE_URL");
    const sharelinkKey = Deno.env.get("SHARELINK_SECRET_KEY");

    if (!sharelinkBase || !sharelinkKey) {
      console.warn(
        "[storo-payment-confirm] Sharelink env vars missing (SHARELINK_BASE_URL / SHARELINK_SECRET_KEY) — purchase event skipped",
      );
    } else {
      try {
        // Lookup referee's attribution + their auth user (for refereeEmail)
        const { data: refereeClient } = await supabase
          .from("clients")
          .select("user_id, full_name, referred_by_code")
          .eq("id", invoice.client_id as string)
          .maybeSingle();

        if (!refereeClient?.referred_by_code) {
          console.log(
            "[storo-payment-confirm] No referrer attribution — purchase event skipped",
          );
        } else {
          const refereeUserId = refereeClient.user_id as string | null;
          let refereeEmail: string | undefined;
          if (refereeUserId) {
            const { data: refereeAuth } = await supabase.auth.admin.getUserById(
              refereeUserId,
            );
            refereeEmail = refereeAuth?.user?.email ?? undefined;
          }

          // Use invoice metadata for plan if set (from /api/dashboard/stores or
          // /api/onboarding/checkout); fallback to latest onboarding_request
          const meta = (invoice.metadata ?? {}) as Record<string, unknown>;
          let invoicePlan: string | null = (meta.plan as string | undefined) ?? null;
          if (!invoicePlan) {
            const { data: req } = await supabase
              .from("onboarding_requests")
              .select("plan")
              .eq("client_id", invoice.client_id as string)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            invoicePlan = (req?.plan as string | undefined) ?? null;
          }

          const eventRes = await fetch(
            `${sharelinkBase.replace(/\/+$/, "")}/api/v1/events`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${sharelinkKey}`,
              },
              body: JSON.stringify({
                referralCode: refereeClient.referred_by_code,
                eventType: "purchase",
                eventName: `gateway_inv_${invoice.id}`,
                refereeId: refereeUserId ?? (invoice.client_id as string),
                refereeEmail,
                refereeName: refereeClient.full_name ?? undefined,
                metadata: {
                  source: "storo_payment_confirm_edge",
                  invoice_id: invoice.id,
                  amount_paid: amount,
                  plan: invoicePlan,
                  referral_code: refereeClient.referred_by_code,
                },
              }),
              signal: AbortSignal.timeout(10_000),
            },
          );

          const respBody = await eventRes.json().catch(() => ({}));
          if (!eventRes.ok) {
            const msg =
              ((respBody as Record<string, unknown>).message as string) ??
              `HTTP ${eventRes.status}`;
            // Duplicate event = idempotent retry, expected — not a real failure
            if (!msg.includes("Duplicate event")) {
              console.warn(
                "[storo-payment-confirm] Sharelink purchase event failed:",
                msg,
              );
            } else {
              console.log("[storo-payment-confirm] Purchase event already recorded (dedupe)");
            }
          } else {
            const rewards =
              ((respBody as Record<string, unknown>).data as Record<string, unknown> | undefined)
                ?.rewards;
            console.log(
              "[storo-payment-confirm] Sharelink purchase event fired, rewards:",
              Array.isArray(rewards) ? rewards.length : 0,
            );
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("[storo-payment-confirm] Sharelink purchase event exception:", msg);
      }
    }
  }

  return json({ ok: true, invoice_id: invoice.id });
});
