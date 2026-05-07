import { NextResponse } from "next/server";
import { authorizeStoreApi } from "@/lib/store/context";
import { getWallet, getTransactions } from "@/lib/wallet";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await context.params;

  const auth = await authorizeStoreApi(storeId);
  if (auth instanceof NextResponse) return auth;

  try {
    const [wallet, transactions] = await Promise.all([
      getWallet(storeId),
      getTransactions(storeId, 50),
    ]);

    return NextResponse.json({ wallet, transactions });
  } catch (err) {
    console.error("[wallet GET]", err);
    return NextResponse.json({ error: "Gagal mengambil data wallet." }, { status: 500 });
  }
}
