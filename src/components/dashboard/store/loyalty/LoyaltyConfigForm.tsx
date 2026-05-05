"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { StoreCard } from "@/components/dashboard/store/ui";

export type LoyaltyConfigInitial = {
  is_enabled: boolean;
  earn_rate: number;
  point_value: number;
  min_redeem: number;
  max_redeem_pct: number;
};

const inputCls =
  "w-full rounded-xl border border-[#E5E8EF] bg-white px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition";

export default function LoyaltyConfigForm({
  storeId,
  initial,
}: {
  storeId: string;
  initial: LoyaltyConfigInitial;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initial.is_enabled);
  const [earnRate, setEarnRate] = useState<number>(Number(initial.earn_rate));
  const [pointValue, setPointValue] = useState<number>(Number(initial.point_value));
  const [minRedeem, setMinRedeem] = useState<number>(Number(initial.min_redeem));
  const [maxRedeemPct, setMaxRedeemPct] = useState<number>(Number(initial.max_redeem_pct));
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(`/api/store/${storeId}/loyalty`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_enabled: enabled,
          earn_rate: earnRate,
          point_value: pointValue,
          min_redeem: minRedeem,
          max_redeem_pct: maxRedeemPct,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal menyimpan");
        return;
      }
      toast.success("Konfigurasi loyalitas disimpan");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2 max-w-3xl">
      <StoreCard>
        <h2 className="text-sm font-semibold text-[#0F172A] mb-4">Earn Rate</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span>
              <span className="block text-sm font-medium text-[#0F172A]">
                Aktifkan program loyalitas
              </span>
              <span className="block text-xs text-[#64748B]">
                Saat aktif, pelanggan dapat poin tiap order paid.
              </span>
            </span>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="size-5 cursor-pointer accent-primary"
            />
          </label>
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
              Earn Rate (0-1)
            </label>
            <input
              type="number"
              min={0}
              max={1}
              step={0.0001}
              value={earnRate}
              onChange={(e) => setEarnRate(Number(e.target.value) || 0)}
              className={inputCls}
            />
            <p className="text-xs text-[#94A3B8] mt-1">
              0.01 = 1% subtotal jadi poin (Rp 100.000 → 1.000 poin earn × 0.01).
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
              Nilai 1 Poin (Rp)
            </label>
            <input
              type="number"
              min={1}
              value={pointValue}
              onChange={(e) => setPointValue(Number(e.target.value) || 1)}
              className={inputCls}
            />
            <p className="text-xs text-[#94A3B8] mt-1">10 = 1 poin = Rp 10.</p>
          </div>
        </div>
      </StoreCard>

      <StoreCard>
        <h2 className="text-sm font-semibold text-[#0F172A] mb-4">Redemption</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
              Min. Poin untuk Redeem
            </label>
            <input
              type="number"
              min={0}
              value={minRedeem}
              onChange={(e) => setMinRedeem(Number(e.target.value) || 0)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
              Maks. % Total Order Bayar Pakai Poin
            </label>
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={maxRedeemPct}
              onChange={(e) => setMaxRedeemPct(Number(e.target.value) || 0)}
              className={inputCls}
            />
            <p className="text-xs text-[#94A3B8] mt-1">0.1 = 10% dari total order.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="mt-6 inline-flex items-center justify-center gap-2 bg-primary text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 cursor-pointer w-full"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Menyimpan…
            </>
          ) : (
            "Simpan Konfigurasi"
          )}
        </button>
      </StoreCard>
    </div>
  );
}
