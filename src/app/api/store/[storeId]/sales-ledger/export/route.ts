import { NextResponse } from "next/server";
import { authorizeStoreApi } from "@/lib/store/context";
import type { SalesLedgerType, SalesLedgerEntry } from "@/lib/sales-ledger";
import { buildCSVHeader, buildCSVRow } from "@/lib/sales-ledger/csv";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const VALID_TYPES: SalesLedgerType[] = ["sale", "withdrawal", "refund", "adjustment"];
const PAGE_SIZE = 500;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params;
  const ctx = await authorizeStoreApi(storeId);
  if (ctx instanceof NextResponse) return ctx;
  const { service } = ctx;

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const typeParam = url.searchParams.get("type");
  const types = typeParam
    ? typeParam
        .split(",")
        .map((t) => t.trim())
        .filter((t): t is SalesLedgerType => VALID_TYPES.includes(t as SalesLedgerType))
    : null;

  // Stream CSV chunks via ReadableStream
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // BOM + header
        controller.enqueue(encoder.encode("﻿" + buildCSVHeader() + "\r\n"));

        let offset = 0;
        for (;;) {
          let query = service
            .from("sales_ledger_entries")
            .select("*")
            .eq("store_id", storeId)
            .order("created_at", { ascending: false })
            .range(offset, offset + PAGE_SIZE - 1);

          if (from) query = query.gte("created_at", from);
          if (to) query = query.lte("created_at", to);
          if (types && types.length > 0) query = query.in("type", types);

          const { data, error } = await query;
          if (error) throw error;
          if (!data || data.length === 0) break;

          for (const entry of data as SalesLedgerEntry[]) {
            controller.enqueue(encoder.encode(buildCSVRow(entry) + "\r\n"));
          }

          if (data.length < PAGE_SIZE) break;
          offset += PAGE_SIZE;
        }

        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`\r\n[ERROR] ${message}\r\n`));
        controller.close();
      }
    },
  });

  const filename = `sales-ledger-${storeId.slice(0, 8)}-${Date.now()}.csv`;
  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
