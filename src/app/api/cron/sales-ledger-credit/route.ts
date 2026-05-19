import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { calculateSaleNet, recordSale } from "@/lib/sales-ledger";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const REFUND_WINDOW_DAYS = 7;
const BATCH_LIMIT = 500;

/**
 * Vercel Cron: daily sales ledger credit (runs at 02:00 WIB = 19:00 UTC).
 * Schedule defined in vercel.json.
 *
 * Scan order delivered umur > 7 hari (refund window) untuk store storo_gateway,
 * lalu kredit sales ledger dengan net = order.total * 0.95 (5% platform fee).
 *
 * Idempotency dijamin via unique partial index ux_sales_ledger_sale_per_order.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServiceClient();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - REFUND_WINDOW_DAYS);

  // Ambil order delivered yang sudah lewat refund window dan belum ada
  // entry sale-nya di ledger. RPC tidak ada, jadi pakai 2 query: list
  // candidate orders → filter via existence check.
  const { data: candidates, error: candidateErr } = await supabase
    .from("orders")
    .select("id, store_id, total, delivered_at, stores!inner(billing_model)")
    .eq("status", "delivered")
    .eq("stores.billing_model", "storo_gateway")
    .lt("delivered_at", cutoff.toISOString())
    .order("delivered_at", { ascending: true })
    .limit(BATCH_LIMIT);

  if (candidateErr) {
    console.error("[sales-ledger-credit] Failed to fetch candidates:", candidateErr.message);
    return NextResponse.json({ error: candidateErr.message }, { status: 500 });
  }

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, credited: 0, skipped: 0 });
  }

  // Filter out orders yang sudah punya entry sale
  const orderIds = candidates.map((o) => o.id);
  const { data: existing } = await supabase
    .from("sales_ledger_entries")
    .select("order_id")
    .eq("type", "sale")
    .in("order_id", orderIds);

  const alreadyCredited = new Set((existing ?? []).map((e) => e.order_id));
  const pending = candidates.filter((o) => !alreadyCredited.has(o.id));

  let credited = 0;
  let skipped = 0;
  const failures: { order_id: string; error: string }[] = [];

  for (const order of pending) {
    const net = calculateSaleNet(order.total);
    if (net <= 0) {
      skipped++;
      continue;
    }
    try {
      const entry = await recordSale(
        order.store_id,
        order.id,
        net,
        `Penjualan order ${order.id.slice(0, 8)} (net 95% dari total)`
      );
      if (entry === null) {
        // Race: another cron run already inserted — count as skipped
        skipped++;
      } else {
        credited++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failures.push({ order_id: order.id, error: message });
      console.error(
        `[sales-ledger-credit] Failed to credit order ${order.id}:`,
        message
      );
    }
  }

  console.log(
    `[sales-ledger-credit] Done. candidates=${candidates.length} credited=${credited} skipped=${skipped} failed=${failures.length}`
  );

  return NextResponse.json({
    ok: true,
    processed: candidates.length,
    credited,
    skipped,
    failures: failures.slice(0, 10),
  });
}
