import { createSupabaseServiceClient } from "@/lib/supabase/server";

export type SalesLedgerType = "sale" | "withdrawal" | "refund" | "adjustment";

export interface SalesLedgerEntry {
  id: string;
  store_id: string;
  type: SalesLedgerType;
  amount: number;
  order_id: string | null;
  disbursement_id: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  created_by: string | null;
}

export interface SalesBalanceSummary {
  store_id: string;
  total_sales: number;
  total_withdrawn: number;
  total_refunded: number;
  total_adjustment: number;
  available_balance: number;
}

const EMPTY_SUMMARY = (storeId: string): SalesBalanceSummary => ({
  store_id: storeId,
  total_sales: 0,
  total_withdrawn: 0,
  total_refunded: 0,
  total_adjustment: 0,
  available_balance: 0,
});

export async function getSalesBalance(storeId: string): Promise<SalesBalanceSummary> {
  const supabase = await createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("sales_balance_summary")
    .select("*")
    .eq("store_id", storeId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return EMPTY_SUMMARY(storeId);
  return data as SalesBalanceSummary;
}

export interface GetEntriesOptions {
  from?: string;
  to?: string;
  types?: SalesLedgerType[];
  page?: number;
  pageSize?: number;
}

export async function getSalesLedgerEntries(
  storeId: string,
  options: GetEntriesOptions = {}
): Promise<{ entries: SalesLedgerEntry[]; total: number }> {
  const supabase = await createSupabaseServiceClient();
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, options.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("sales_ledger_entries")
    .select("*", { count: "exact" })
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (options.from) query = query.gte("created_at", options.from);
  if (options.to) query = query.lte("created_at", options.to);
  if (options.types && options.types.length > 0) query = query.in("type", options.types);

  const { data, error, count } = await query;
  if (error) throw error;
  return { entries: (data ?? []) as SalesLedgerEntry[], total: count ?? 0 };
}

export async function getRecentEntries(
  storeId: string,
  limit = 20
): Promise<SalesLedgerEntry[]> {
  const supabase = await createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("sales_ledger_entries")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as SalesLedgerEntry[];
}

interface InsertEntryInput {
  storeId: string;
  type: SalesLedgerType;
  amount: number;
  orderId?: string | null;
  disbursementId?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown>;
  createdBy?: string | null;
}

async function insertEntry(input: InsertEntryInput): Promise<SalesLedgerEntry | null> {
  const supabase = await createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("sales_ledger_entries")
    .insert({
      store_id: input.storeId,
      type: input.type,
      amount: input.amount,
      order_id: input.orderId ?? null,
      disbursement_id: input.disbursementId ?? null,
      description: input.description ?? null,
      metadata: input.metadata ?? {},
      created_by: input.createdBy ?? null,
    })
    .select()
    .single();

  if (error) {
    // Unique constraint violation (idempotent re-run) — return null
    if (error.code === "23505") return null;
    throw error;
  }
  return data as SalesLedgerEntry;
}

export async function recordSale(
  storeId: string,
  orderId: string,
  netAmount: number,
  description?: string
): Promise<SalesLedgerEntry | null> {
  if (netAmount <= 0) throw new Error("Sale amount must be positive");
  return insertEntry({
    storeId,
    type: "sale",
    amount: netAmount,
    orderId,
    description: description ?? `Penjualan order ${orderId.slice(0, 8)}`,
  });
}

export async function recordWithdrawal(
  storeId: string,
  disbursementId: string,
  amount: number,
  description?: string
): Promise<SalesLedgerEntry | null> {
  if (amount <= 0) throw new Error("Withdrawal amount must be positive");
  return insertEntry({
    storeId,
    type: "withdrawal",
    amount: -Math.abs(amount),
    disbursementId,
    description: description ?? `Penarikan saldo ${disbursementId.slice(0, 8)}`,
  });
}

export async function recordRefund(
  storeId: string,
  orderId: string,
  amount: number,
  description?: string
): Promise<SalesLedgerEntry | null> {
  if (amount <= 0) throw new Error("Refund amount must be positive");
  return insertEntry({
    storeId,
    type: "refund",
    amount: -Math.abs(amount),
    orderId,
    description: description ?? `Refund order ${orderId.slice(0, 8)}`,
  });
}

export async function recordAdjustment(
  storeId: string,
  amount: number,
  description: string,
  createdBy?: string,
  metadata?: Record<string, unknown>
): Promise<SalesLedgerEntry | null> {
  if (amount === 0) throw new Error("Adjustment amount cannot be zero");
  return insertEntry({
    storeId,
    type: "adjustment",
    amount,
    description,
    createdBy,
    metadata,
  });
}

export const SALES_PLATFORM_FEE_RATE = 0.05;

export function calculateSaleNet(orderTotal: number): number {
  return Math.floor(orderTotal * (1 - SALES_PLATFORM_FEE_RATE));
}
