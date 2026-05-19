import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import { getSalesBalance, recordWithdrawal } from "@/lib/sales-ledger";

type DisbursementStatus = "pending" | "approved" | "paid";

const VALID_STATUSES: DisbursementStatus[] = ["pending", "approved", "paid"];

async function authSuperadmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const service = await createSupabaseServiceClient();
  const { data: adminUser } = await service
    .from("superadmin_users")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!adminUser) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { user, service };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await authSuperadmin();
  if ("error" in auth) return auth.error;
  const { service } = auth;

  let body: { status?: unknown; payment_ref?: unknown; notes?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const nextStatus = body.status as DisbursementStatus | undefined;
  if (nextStatus && !VALID_STATUSES.includes(nextStatus)) {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }

  const { data: existing, error: fetchErr } = await service
    .from("disbursements")
    .select("id, store_id, gross_amount, status, kind")
    .eq("id", id)
    .single();
  if (fetchErr || !existing) {
    return NextResponse.json({ error: "Disbursement tidak ditemukan" }, { status: 404 });
  }

  const isTransitionToPaid =
    nextStatus === "paid" && existing.status !== "paid";
  const isSalesWithdrawal = existing.kind === "sales_withdrawal";

  // Validasi saldo cukup sebelum debit (defense-in-depth)
  if (isTransitionToPaid && isSalesWithdrawal) {
    const balance = await getSalesBalance(existing.store_id);
    if (Number(existing.gross_amount) > balance.available_balance) {
      return NextResponse.json(
        {
          error:
            "Saldo penjualan tidak cukup untuk mengesahkan penarikan ini. Mungkin ada refund antara request dan approval.",
          available_balance: balance.available_balance,
          requested: Number(existing.gross_amount),
        },
        { status: 409 }
      );
    }
  }

  // Update disbursement
  const updatePayload: Record<string, unknown> = {};
  if (nextStatus) {
    updatePayload.status = nextStatus;
    if (nextStatus === "paid") updatePayload.paid_at = new Date().toISOString();
  }
  if (typeof body.payment_ref === "string") updatePayload.payment_ref = body.payment_ref;
  if (typeof body.notes === "string") updatePayload.notes = body.notes;

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: "Tidak ada perubahan" }, { status: 400 });
  }

  const { error: updateErr } = await service
    .from("disbursements")
    .update(updatePayload)
    .eq("id", id);
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Debit ledger saat transisi ke 'paid' untuk sales_withdrawal
  if (isTransitionToPaid && isSalesWithdrawal) {
    try {
      const ledgerEntry = await recordWithdrawal(
        existing.store_id,
        existing.id,
        Number(existing.gross_amount),
        `Penarikan saldo penjualan ${id.slice(0, 8)}`
      );
      if (ledgerEntry === null) {
        // Idempotency: entry sudah ada (jarang terjadi untuk withdrawal,
        // tidak ada unique index — biarkan).
        console.warn(
          `[disbursement-approve] recordWithdrawal returned null for ${id}`
        );
      }
    } catch (err) {
      // Rollback status jika debit gagal
      await service
        .from("disbursements")
        .update({ status: existing.status, paid_at: null })
        .eq("id", id);
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { error: `Gagal mencatat debit ledger: ${message}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: true });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await authSuperadmin();
  if ("error" in auth) return auth.error;
  const { service } = auth;

  const { data, error } = await service
    .from("disbursements")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
