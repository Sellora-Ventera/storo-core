import { createSupabaseServiceClient } from "@/lib/supabase/server";

export async function getWallet(storeId: string) {
  const supabase = await createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("store_wallets")
    .select("*")
    .eq("store_id", storeId)
    .single();
  if (error && error.code === "PGRST116") return null; // not found
  if (error) throw error;
  return data;
}

export async function ensureWallet(storeId: string) {
  const supabase = await createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("store_wallets")
    .upsert({ store_id: storeId }, { onConflict: "store_id", ignoreDuplicates: true })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getTransactions(storeId: string, limit = 50) {
  const supabase = await createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function creditWallet(
  storeId: string,
  amount: number,
  type: "topup" | "refund" | "adjustment",
  opts: { description?: string; referenceId?: string } = {}
) {
  const supabase = await createSupabaseServiceClient();
  const { data, error } = await supabase.rpc("wallet_credit", {
    p_store_id: storeId,
    p_amount: amount,
    p_type: type,
    p_description: opts.description ?? null,
    p_reference_id: opts.referenceId ?? null,
  });
  if (error) throw error;
  return data;
}

export async function debitWallet(
  storeId: string,
  amount: number,
  type: "ops_fee" | "adjustment",
  opts: { description?: string; referenceId?: string } = {}
) {
  const supabase = await createSupabaseServiceClient();
  const { data, error } = await supabase.rpc("wallet_debit", {
    p_store_id: storeId,
    p_amount: amount,
    p_type: type,
    p_description: opts.description ?? null,
    p_reference_id: opts.referenceId ?? null,
  });
  if (error) throw error;
  return data;
}

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
