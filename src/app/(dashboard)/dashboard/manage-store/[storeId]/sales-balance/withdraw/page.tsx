import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import {
  getStoreForUser,
  requireUserAndClient,
} from "@/lib/store/context";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getSalesBalance } from "@/lib/sales-ledger";
import {
  StorePageHeader,
  StoreCard,
} from "@/components/dashboard/store/ui";
import WithdrawForm from "./WithdrawForm";

export const dynamic = "force-dynamic";

export default async function WithdrawPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const { store } = await getStoreForUser(storeId);

  if (store.billing_model !== "storo_gateway") {
    redirect(`/dashboard/manage-store/${storeId}/wallet`);
  }

  const { client } = await requireUserAndClient();
  const service = await createSupabaseServiceClient();
  const { data: bankRow } = await service
    .from("clients")
    .select("bank_name, bank_account_name, bank_account_number")
    .eq("id", client.id)
    .single();

  const balance = await getSalesBalance(storeId);
  const hasBankAccount = Boolean(bankRow?.bank_account_number);

  return (
    <div className="max-w-lg">
      <div className="mb-4">
        <Link
          href={`/dashboard/manage-store/${storeId}/sales-balance`}
          className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] transition cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Saldo Penjualan
        </Link>
      </div>

      <StorePageHeader
        title="Tarik Saldo"
        description="Ajukan penarikan saldo penjualan ke rekening bank terdaftar."
      />

      {!hasBankAccount ? (
        <StoreCard className="mb-4">
          <div className="flex items-start gap-3">
            <Info className="size-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#0F172A] mb-1">
                Rekening bank belum diatur
              </p>
              <p className="text-sm text-[#64748B] mb-3">
                Anda harus mengisi data rekening bank di profil sebelum bisa mengajukan
                penarikan saldo.
              </p>
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-full bg-primary text-white hover:bg-primary/90 transition cursor-pointer"
              >
                Lengkapi Profil
              </Link>
            </div>
          </div>
        </StoreCard>
      ) : (
        <WithdrawForm
          storeId={storeId}
          availableBalance={balance.available_balance}
          bankName={bankRow?.bank_name ?? null}
          bankAccountName={bankRow?.bank_account_name ?? null}
          bankAccountNumber={bankRow?.bank_account_number ?? null}
        />
      )}
    </div>
  );
}
