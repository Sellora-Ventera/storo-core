import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { deductOpsFeeForOrder } from "@/lib/wallet/deduct-ops-fee";
import { fireReferralPurchaseEvent } from "@/lib/sharelink/fire-purchase-event";

export const dynamic = "force-dynamic";

/**
 * Xendit callback for buyer orders (STORO-ORD-*) and seller setup invoices (STORO-INV-*).
 *
 * Token verification:
 *   STORO-ORD-*: XENDIT_WEBHOOK_TOKEN OR stores.settings.payment.xendit_callback_token
 *   STORO-INV-*: XENDIT_WEBHOOK_TOKEN (platform-level only)
 *   STORO-WALLET-* → handled by /api/webhooks/xendit-wallet
 *
 * Register in Xendit dashboard:
 *   https://www.storo.id/api/webhooks/xendit
 */
export async function POST(request: NextRequest) {
  let body: {
    external_id?: string;
    status?: string;
    amount?: number;
    id?: string;
    paid_at?: string;
    payment_method?: string;
    payment_channel?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { external_id, status, id: invoiceId, paid_at, payment_method, payment_channel } = body;

  // Setup invoice (seller pays setup fee from onboarding wizard or dashboard billing)
  if (external_id?.startsWith("STORO-INV-")) {
    return handleSetupInvoice(request, {
      external_id,
      invoiceId,
      status,
      paid_at,
      payment_method,
      payment_channel,
    });
  }

  // Only handle STORO-ORD-* below — pass through everything else silently
  if (!external_id?.startsWith("STORO-ORD-")) {
    return NextResponse.json({ received: true });
  }

  const orderId = external_id.replace("STORO-ORD-", "");
  if (!orderId || orderId.length < 10) {
    console.error("[xendit-order] Invalid external_id:", external_id);
    return NextResponse.json({ received: true });
  }

  const supabase = await createSupabaseServiceClient();

  // Fetch order first — needed for store-specific token fallback
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, store_id, customer_id, total, status, customer_name, customer_email, order_number"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    console.warn("[xendit-order] Order not found:", orderId);
    return NextResponse.json({ received: true });
  }

  // ── Token verification ──────────────────────────────────────────────────────
  const token = request.headers.get("x-callback-token");
  const platformToken = process.env.XENDIT_WEBHOOK_TOKEN;
  let tokenValid = !!platformToken && token === platformToken;

  if (!tokenValid) {
    const { data: storeRow } = await supabase
      .from("stores")
      .select("settings")
      .eq("id", order.store_id)
      .single();

    const paymentSettings = (
      (storeRow?.settings as Record<string, unknown> | null)?.payment as
        | Record<string, unknown>
        | undefined
    );
    const storeToken = paymentSettings?.xendit_callback_token as string | undefined;

    if (storeToken && token === storeToken) tokenValid = true;
  }

  if (!tokenValid) {
    console.warn("[xendit-order] Invalid token for order:", order.order_number);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Idempotency ─────────────────────────────────────────────────────────────
  if (["paid", "shipped", "delivered"].includes(order.status)) {
    return NextResponse.json({ received: true, skipped: "already processed" });
  }

  // ── Handle PAID / SETTLED ───────────────────────────────────────────────────
  if (status === "PAID" || status === "SETTLED") {
    const { error: updateErr } = await supabase
      .from("orders")
      .update({
        status: "paid",
        payment_status: "paid",
        payment_method: payment_method ?? null,
        payment_reference: invoiceId ?? null,
        paid_at: paid_at ?? new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateErr) {
      console.error("[xendit-order] Order update failed:", updateErr);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }

    // Update customer lifetime stats
    if (order.customer_id) {
      const { data: customer } = await supabase
        .from("customers")
        .select("total_orders, total_spent")
        .eq("id", order.customer_id)
        .single();

      if (customer) {
        await supabase
          .from("customers")
          .update({
            total_orders: (customer.total_orders ?? 0) + 1,
            total_spent: (customer.total_spent ?? 0) + order.total,
          })
          .eq("id", order.customer_id);
      }
    }

    // Fetch billing_model for ops fee check
    const { data: store } = await supabase
      .from("stores")
      .select("billing_model")
      .eq("id", order.store_id)
      .single();

    // Deduct 1% ops fee from wallet (own_prepaid only). For storo_gateway,
    // dana sudah di akun Storo dan ditangani via sales ledger (cron credit +
    // disbursement debit), bukan wallet.
    if (store?.billing_model === "own_prepaid") {
      try {
        await deductOpsFeeForOrder(order.store_id, order.total, order.id);
      } catch (err) {
        // Non-fatal — ops fee reconciliation cron will catch discrepancies
        console.warn("[xendit-order] Ops fee deduction failed:", err);
      }
    }

    // In-app notification for store dashboard bell
    try {
      const idr = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(order.total);

      await supabase.from("store_notifications").insert({
        store_id: order.store_id,
        type: "order_paid",
        title: `Pesanan baru: ${order.order_number}`,
        body: `${order.customer_name ?? "Pembeli"} — ${idr}`,
        metadata: {
          order_id: order.id,
          order_number: order.order_number,
          customer_name: order.customer_name,
          total: order.total,
        },
      });
    } catch (err) {
      console.warn("[xendit-order] Notification insert failed:", err);
    }

    console.log("[xendit-order] Order paid:", order.order_number);

  // ── Handle EXPIRED ──────────────────────────────────────────────────────────
  } else if (status === "EXPIRED") {
    await supabase
      .from("orders")
      .update({
        status: "cancelled",
        payment_status: "unpaid",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    // Restore stock for each item
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_id, variant_id, quantity")
      .eq("order_id", order.id);

    if (orderItems) {
      for (const item of orderItems) {
        if (item.variant_id) {
          const { data: variant } = await supabase
            .from("product_variants")
            .select("stock")
            .eq("id", item.variant_id)
            .single();
          if (variant) {
            await supabase
              .from("product_variants")
              .update({ stock: variant.stock + item.quantity })
              .eq("id", item.variant_id);
          }
        } else if (item.product_id) {
          const { data: product } = await supabase
            .from("products")
            .select("stock")
            .eq("id", item.product_id)
            .single();
          if (product) {
            await supabase
              .from("products")
              .update({ stock: product.stock + item.quantity })
              .eq("id", item.product_id);
          }
        }
      }
    }

    console.log("[xendit-order] Order expired:", order.order_number);
  }

  return NextResponse.json({ received: true });
}

async function handleSetupInvoice(
  request: NextRequest,
  body: {
    external_id: string;
    invoiceId?: string;
    status?: string;
    paid_at?: string;
    payment_method?: string;
    payment_channel?: string;
  }
) {
  const token = request.headers.get("x-callback-token");
  const platformToken = process.env.XENDIT_WEBHOOK_TOKEN;
  if (!platformToken || token !== platformToken) {
    console.warn("[xendit-inv] Invalid token for", body.external_id);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (body.status !== "PAID" && body.status !== "SETTLED") {
    return NextResponse.json({ received: true, skipped: `status ${body.status}` });
  }

  const invoiceUuid = body.external_id.replace("STORO-INV-", "");
  if (!invoiceUuid || invoiceUuid.length < 10) {
    console.error("[xendit-inv] Invalid external_id:", body.external_id);
    return NextResponse.json({ received: true });
  }

  const supabase = await createSupabaseServiceClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, status, client_id, type, amount, metadata")
    .eq("id", invoiceUuid)
    .maybeSingle();

  if (!invoice) {
    console.warn("[xendit-inv] Invoice not found:", invoiceUuid);
    return NextResponse.json({ received: true });
  }

  if (invoice.status === "paid") {
    return NextResponse.json({ received: true, skipped: "already paid" });
  }

  const existingMeta =
    typeof invoice.metadata === "object" && invoice.metadata !== null
      ? (invoice.metadata as Record<string, unknown>)
      : {};

  const { error: updateErr } = await supabase
    .from("invoices")
    .update({
      status: "paid",
      paid_at: body.paid_at ?? new Date().toISOString(),
      payment_method: body.payment_method ?? null,
      payment_channel: body.payment_channel ?? null,
      metadata: {
        ...existingMeta,
        xendit_confirmed_at: new Date().toISOString(),
        xendit_invoice_id: body.invoiceId,
        xendit_payment_method: body.payment_method ?? null,
        xendit_payment_channel: body.payment_channel ?? null,
      },
    })
    .eq("id", invoice.id);

  if (updateErr) {
    console.error("[xendit-inv] Update failed:", updateErr);
    return NextResponse.json({ error: "DB update failed" }, { status: 500 });
  }

  if (invoice.client_id) {
    await supabase.from("client_notifications").insert({
      client_id: invoice.client_id,
      title: "Pembayaran Diterima",
      message: `Pembayaran setup${body.payment_method ? ` via ${body.payment_method}` : ""} telah dikonfirmasi. Tim kami akan segera memproses.`,
      type: "success",
      link: `/dashboard/billing/${invoice.id}`,
    });
  }

  // ── Fire referral 'purchase' event to Sharelink (only on FIRST paid invoice) ──
  // Anti-fraud: we trigger reward only when the referee actually pays for their
  // first setup invoice. If they refund or never pay, no reward is created.
  if (invoice.client_id && invoice.type === "setup") {
    const { count: priorPaidCount } = await supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("client_id", invoice.client_id)
      .eq("status", "paid")
      .neq("id", invoice.id);

    if ((priorPaidCount ?? 0) === 0) {
      // Fetch refereeUser_id from clients row + plan from onboarding (best-effort)
      const { data: refereeClient } = await supabase
        .from("clients")
        .select("user_id, full_name")
        .eq("id", invoice.client_id)
        .single();

      const { data: refereeAuth } = refereeClient?.user_id
        ? await supabase.auth.admin.getUserById(refereeClient.user_id)
        : { data: { user: null } };

      // Determine plan from invoice metadata or latest onboarding_request
      let invoicePlan: string | null =
        (invoice.metadata as Record<string, unknown> | null)?.plan as string | null ?? null;
      if (!invoicePlan) {
        const { data: req } = await supabase
          .from("onboarding_requests")
          .select("plan")
          .eq("client_id", invoice.client_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        invoicePlan = req?.plan ?? null;
      }

      if (refereeClient?.user_id) {
        const result = await fireReferralPurchaseEvent(supabase, {
          refereeClientId: invoice.client_id,
          refereeUserId: refereeClient.user_id,
          refereeEmail: refereeAuth.user?.email ?? null,
          refereeName: refereeClient.full_name ?? null,
          invoiceId: invoice.id,
          invoicePlan,
          invoiceAmount: invoice.amount ?? null,
        });
        if (!result.ok) {
          console.error("[xendit-inv] referral event failed:", result.error);
        } else if (result.skipped) {
          console.log("[xendit-inv] referral event skipped:", result.skipped);
        } else {
          console.log("[xendit-inv] referral event fired, rewards:", result.reward_ids);
        }
      }
    }
  }

  console.log("[xendit-inv] Invoice paid:", invoice.id);
  return NextResponse.json({ received: true });
}
