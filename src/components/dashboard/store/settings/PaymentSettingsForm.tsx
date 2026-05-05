"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { StoreCard } from "@/components/dashboard/store/ui";

export type PaymentSettingsInitial = {
  use_storo_gateway: boolean;
  xendit_secret_key: string;
  xendit_public_key: string;
  midtrans_server_key: string;
  midtrans_client_key: string;
};

const inputCls =
  "w-full rounded-xl border border-[#E5E8EF] bg-white px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition";

export default function PaymentSettingsForm({
  storeId,
  initial,
}: {
  storeId: string;
  initial: PaymentSettingsInitial;
}) {
  const router = useRouter();
  const [useStoroGateway, setUseStoroGateway] = useState(initial.use_storo_gateway);
  const [xenditSecret, setXenditSecret] = useState(initial.xendit_secret_key);
  const [xenditPublic, setXenditPublic] = useState(initial.xendit_public_key);
  const [midtransServer, setMidtransServer] = useState(initial.midtrans_server_key);
  const [midtransClient, setMidtransClient] = useState(initial.midtrans_client_key);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(`/api/store/${storeId}/settings/payment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          use_storo_gateway: useStoroGateway,
          xendit_secret_key: xenditSecret,
          xendit_public_key: xenditPublic,
          midtrans_server_key: midtransServer,
          midtrans_client_key: midtransClient,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal menyimpan");
        return;
      }
      toast.success("Pengaturan pembayaran disimpan");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <StoreCard>
        <h2 className="text-sm font-semibold text-[#0F172A] mb-3">Gateway</h2>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={useStoroGateway}
            onChange={(e) => setUseStoroGateway(e.target.checked)}
            className="size-4 mt-1 cursor-pointer accent-primary"
          />
          <span>
            <span className="block text-sm font-medium text-[#0F172A]">
              Pakai Payment Gateway Storo (default)
            </span>
            <span className="block text-xs text-[#64748B] mt-0.5">
              Semua transaksi masuk ke akun Xendit VenteraAI. Fee: 1% ops + 4% PG = 5% total. Disbursement
              manual ke Anda. Matikan jika Anda mau pakai API key Xendit/Midtrans sendiri (fee 1% ops saja).
            </span>
          </span>
        </label>
      </StoreCard>

      {!useStoroGateway ? (
        <>
          <StoreCard>
            <h2 className="text-sm font-semibold text-[#0F172A] mb-3">Xendit (custom)</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                  Secret Key
                </label>
                <input
                  type="password"
                  value={xenditSecret}
                  onChange={(e) => setXenditSecret(e.target.value)}
                  placeholder="xnd_…"
                  className={`${inputCls} font-mono`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                  Public Key
                </label>
                <input
                  type="text"
                  value={xenditPublic}
                  onChange={(e) => setXenditPublic(e.target.value)}
                  className={`${inputCls} font-mono`}
                />
              </div>
            </div>
          </StoreCard>

          <StoreCard>
            <h2 className="text-sm font-semibold text-[#0F172A] mb-3">Midtrans (custom)</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                  Server Key
                </label>
                <input
                  type="password"
                  value={midtransServer}
                  onChange={(e) => setMidtransServer(e.target.value)}
                  className={`${inputCls} font-mono`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
                  Client Key
                </label>
                <input
                  type="text"
                  value={midtransClient}
                  onChange={(e) => setMidtransClient(e.target.value)}
                  className={`${inputCls} font-mono`}
                />
              </div>
            </div>
          </StoreCard>
        </>
      ) : null}

      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 bg-primary text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 cursor-pointer"
      >
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Menyimpan…
          </>
        ) : (
          "Simpan Pengaturan"
        )}
      </button>
    </div>
  );
}
