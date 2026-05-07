import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const OPS_FEE_RATE = 0.01;
export const MIN_OPS_FEE = 500; // IDR 500 minimum

export function calculateOpsFee(orderAmount: number): number {
  return Math.max(Math.floor(orderAmount * OPS_FEE_RATE), MIN_OPS_FEE);
}

export type WalletStatus = "active" | "warning" | "suspended";

export interface OpsFeeResult {
  ops_fee: number;
  new_balance: number;
  status: WalletStatus;
  status_changed: boolean;
}

export async function deductOpsFeeForOrder(
  storeId: string,
  orderAmount: number,
  orderId: string
): Promise<OpsFeeResult> {
  const ops_fee = calculateOpsFee(orderAmount);
  const supabase = await createSupabaseServiceClient();

  const { data, error } = await supabase.rpc("wallet_debit_ops_fee", {
    p_store_id: storeId,
    p_amount: ops_fee,
    p_reference_id: orderId,
    p_description: `Ops fee 1% dari pesanan #${orderId.slice(0, 8)}`,
  });

  if (error) throw error;

  const rpc = data as {
    new_balance: number;
    new_status: WalletStatus;
    prev_status: WalletStatus;
  };

  const status_changed = rpc.prev_status !== rpc.new_status;

  // Phase 2.5: notify client on status change
  if (status_changed && (rpc.new_status === "warning" || rpc.new_status === "suspended")) {
    await sendLowBalanceNotification(supabase, storeId, rpc.new_balance, rpc.new_status);
  }

  return {
    ops_fee,
    new_balance: rpc.new_balance,
    status: rpc.new_status,
    status_changed,
  };
}

async function sendLowBalanceNotification(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  storeId: string,
  newBalance: number,
  status: WalletStatus
) {
  const { data: store } = await supabase
    .from("stores")
    .select("client_id, name")
    .eq("id", storeId)
    .single();

  if (!store?.client_id) return;

  const balanceFormatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Math.max(newBalance, 0));

  const isWarning = status === "warning";

  await supabase.from("client_notifications").insert({
    client_id: store.client_id,
    title: isWarning ? "Saldo Wallet Hampir Habis" : "Wallet Ditangguhkan",
    message: isWarning
      ? `Saldo wallet toko ${store.name} mendekati batas minimum (${balanceFormatted}). Segera top up agar layanan tidak terganggu.`
      : `Saldo wallet toko ${store.name} tidak mencukupi (${balanceFormatted}). Layanan pembayaran ditangguhkan. Top up untuk mengaktifkan kembali.`,
    type: isWarning ? "warning" : "error",
    link: `/dashboard/${storeId}/wallet`,
  });
}
