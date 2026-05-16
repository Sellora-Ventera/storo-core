export const dynamic = "force-dynamic";

import { ArrowLeft } from "lucide-react";
import { getStoreForUser } from "@/lib/store/context";
import {
  StorePageHeader,
  ChipButton,
} from "@/components/dashboard/store/ui";
import PaymentSettingsForm from "@/components/dashboard/store/settings/PaymentSettingsForm";

export default async function PaymentSettingsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const { store } = await getStoreForUser(storeId);

  const settings =
    typeof store.settings === "object" && store.settings !== null
      ? (store.settings as Record<string, unknown>)
      : {};
  const payment =
    typeof settings.payment === "object" && settings.payment !== null
      ? (settings.payment as Record<string, unknown>)
      : {};

  return (
    <div>
      <StorePageHeader
        title="Pengaturan Pembayaran"
        description="Konfigurasi gateway dan biaya transaksi."
        actions={
          <ChipButton
            href={`/dashboard/manage-store/${storeId}/settings`}
            variant="default"
            icon={<ArrowLeft className="size-3.5" />}
          >
            Kembali ke Pengaturan
          </ChipButton>
        }
      />
      <PaymentSettingsForm
        storeId={storeId}
        initial={{
          billing_model: store.billing_model,
          xendit_secret_key: (payment.xendit_secret_key as string) ?? "",
          xendit_public_key: (payment.xendit_public_key as string) ?? "",
          xendit_callback_token: (payment.xendit_callback_token as string) ?? "",
          midtrans_server_key: (payment.midtrans_server_key as string) ?? "",
          midtrans_client_key: (payment.midtrans_client_key as string) ?? "",
        }}
      />
    </div>
  );
}
