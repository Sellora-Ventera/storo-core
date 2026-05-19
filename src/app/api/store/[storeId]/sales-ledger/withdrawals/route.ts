import { NextResponse } from "next/server";
import { authorizeStoreApi } from "@/lib/store/context";
import { getSalesBalance } from "@/lib/sales-ledger";

const MIN_WITHDRAWAL = 100_000;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params;
  const ctx = await authorizeStoreApi(storeId);
  if (ctx instanceof NextResponse) return ctx;
  const { service, userId, clientId } = ctx;

  let body: { amount?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Jumlah penarikan tidak valid" }, { status: 400 });
  }
  if (amount < MIN_WITHDRAWAL) {
    return NextResponse.json(
      { error: `Minimum penarikan Rp ${MIN_WITHDRAWAL.toLocaleString("id-ID")}` },
      { status: 400 }
    );
  }

  // Validasi billing_model
  const { data: store } = await service
    .from("stores")
    .select("billing_model")
    .eq("id", storeId)
    .single();
  if (store?.billing_model !== "storo_gateway") {
    return NextResponse.json(
      { error: "Penarikan saldo hanya untuk toko mode Storo Gateway" },
      { status: 403 }
    );
  }

  // Saldo tersedia
  const balance = await getSalesBalance(storeId);
  if (amount > balance.available_balance) {
    return NextResponse.json(
      {
        error: "Jumlah penarikan melebihi saldo tersedia",
        available_balance: balance.available_balance,
      },
      { status: 400 }
    );
  }

  // Rekening seller
  const { data: client } = await service
    .from("clients")
    .select("bank_name, bank_account_name, bank_account_number")
    .eq("id", clientId)
    .single();
  if (!client?.bank_account_number) {
    return NextResponse.json(
      {
        error:
          "Rekening bank belum diisi. Lengkapi data rekening di halaman profil terlebih dahulu.",
      },
      { status: 400 }
    );
  }

  const periodLabel = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const { data: inserted, error: insertErr } = await service
    .from("disbursements")
    .insert({
      store_id: storeId,
      kind: "sales_withdrawal",
      requested_by: userId,
      period_label: `Penarikan ${periodLabel}`,
      gross_amount: amount,
      pg_fee: 0,
      ops_fee: 0,
      net_amount: amount,
      status: "pending",
      bank_snapshot: {
        bank_name: client.bank_name,
        bank_account_name: client.bank_account_name,
        bank_account_number: client.bank_account_number,
      },
    })
    .select("id, status, gross_amount, net_amount, created_at")
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, disbursement: inserted }, { status: 201 });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params;
  const ctx = await authorizeStoreApi(storeId);
  if (ctx instanceof NextResponse) return ctx;
  const { service } = ctx;

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  const { data, count, error } = await service
    .from("disbursements")
    .select("id, gross_amount, net_amount, status, period_label, bank_snapshot, paid_at, created_at", {
      count: "exact",
    })
    .eq("store_id", storeId)
    .eq("kind", "sales_withdrawal")
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    withdrawals: data ?? [],
    total: count ?? 0,
    page,
    page_size: pageSize,
  });
}
