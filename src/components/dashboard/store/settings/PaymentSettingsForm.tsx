"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wallet, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { StoreCard } from "@/components/dashboard/store/ui";
import type { BillingModel } from "@/lib/store/context";

export type PaymentSettingsInitial = {
  billing_model: BillingModel;
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
  const [billingModel, setBillingModel] = useState<BillingModel>(initial.billing_model);
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
          billing_model: billingModel,
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

  const showOwnGatewayKeys = billingModel === "own_prepaid";

  return (
    <div className="space-y-5 max-w-2xl">
      <StoreCard>
        <h2 className="text-sm font-semibold text-[#0F172A] mb-3">Model Billing</h2>
        <p className="text-xs text-[#64748B] mb-4">
          Pilih bagaimana pembayaran buyer diproses dan bagaimana Storo mengambil ops fee.
        </p>

        <div className="space-y-3">
          {/* Storo Gateway option */}
          <label
            className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 transition ${
              billingModel === "storo_gateway"
                ? "border-primary bg-primary/5"
                : "border-[#E5E8EF] hover:border-primary/30"
            }`}
          >
            <input
              type="radio"
              name="billing_model"
              value="storo_gateway"
              checked={billingModel === "storo_gateway"}
              onChange={() => setBillingModel("storo_gateway")}
              className="size-4 mt-0.5 cursor-pointer accent-primary"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                <span className="text-sm font-semibold text-[#0F172A]">
                  Storo Gateway (Direkomendasikan)
                </span>
              </div>
              <span className="block text-xs text-[#64748B] mt-1.5">
                Buyer bayar via akun Xendit/Midtrans Storo. Storo potong 5% (1% ops + 4% PG)
                otomatis sebelum disburse net amount ke rekening Anda. Tidak perlu setup PG sendiri.
              </span>
            </div>
          </label>

          {/* Own Prepaid option */}
          <label
            className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 transition ${
              billingModel === "own_prepaid"
                ? "border-primary bg-primary/5"
                : "border-[#E5E8EF] hover:border-primary/30"
            }`}
          >
            <input
              type="radio"
              name="billing_model"
              value="own_prepaid"
              checked={billingModel === "own_prepaid"}
              onChange={() => setBillingModel("own_prepaid")}
              className="size-4 mt-0.5 cursor-pointer accent-primary"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Wallet className="size-4 text-[#64748B]" />
                <span className="text-sm font-semibold text-[#0F172A]">
                  Own Gateway + Prepaid Wallet
                </span>
              </div>
              <span className="block text-xs text-[#64748B] mt-1.5">
                Buyer bayar via akun Xendit/Midtrans Anda sendiri (uang langsung masuk rekening Anda).
                Storo potong 1% ops fee dari saldo wallet prabayar.
              </span>
            </div>
          </label>
        </div>
      </StoreCard>

      {showOwnGatewayKeys ? (
        <>
          <StoreCard>
            <h2 className="text-sm font-semibold text-[#0F172A] mb-3">Xendit (akun Anda)</h2>
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
            <h2 className="text-sm font-semibold text-[#0F172A] mb-3">Midtrans (akun Anda)</h2>
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
