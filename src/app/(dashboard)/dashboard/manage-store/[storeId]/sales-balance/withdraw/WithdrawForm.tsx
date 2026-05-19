"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownCircle, Loader2, Building2 } from "lucide-react";
import { StoreCard } from "@/components/dashboard/store/ui";

const MIN_WITHDRAWAL = 100_000;
const PRESETS = [500_000, 1_000_000, 5_000_000];

function formatIDRDisplay(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function WithdrawForm({
  storeId,
  availableBalance,
  bankName,
  bankAccountName,
  bankAccountNumber,
}: {
  storeId: string;
  availableBalance: number;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
}) {
  const router = useRouter();
  const [rawAmount, setRawAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericAmount = parseInt(rawAmount.replace(/\D/g, ""), 10) || 0;
  const isValid =
    numericAmount >= MIN_WITHDRAWAL && numericAmount <= availableBalance;

  function handlePreset(amount: number) {
    setRawAmount(String(Math.min(amount, availableBalance)));
    setError(null);
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setRawAmount(e.target.value.replace(/\D/g, ""));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) {
      if (numericAmount < MIN_WITHDRAWAL) {
        setError(`Minimum penarikan ${formatIDRDisplay(MIN_WITHDRAWAL)}.`);
      } else {
        setError("Jumlah melebihi saldo tersedia.");
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/store/${storeId}/sales-ledger/withdrawals`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: numericAmount }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mengajukan penarikan.");
        setLoading(false);
        return;
      }
      router.push(`/dashboard/manage-store/${storeId}/sales-balance?withdrawal=submitted`);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
      setLoading(false);
    }
  }

  const maskedAccountNumber = bankAccountNumber
    ? `${bankAccountNumber.slice(0, 3)}${"•".repeat(Math.max(bankAccountNumber.length - 6, 2))}${bankAccountNumber.slice(-3)}`
    : "-";

  return (
    <StoreCard>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Available balance */}
        <div className="rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">
            Saldo tersedia
          </p>
          <p className="text-2xl font-bold text-primary mt-1">
            {formatIDRDisplay(availableBalance)}
          </p>
        </div>

        {/* Bank details */}
        <div className="rounded-xl bg-[#F8FAFC] border border-[#E5E8EF] px-4 py-3">
          <div className="flex items-start gap-3">
            <Building2 className="size-5 text-[#64748B] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                Rekening Tujuan
              </p>
              <p className="text-sm font-semibold text-[#0F172A] mt-1">
                {bankName ?? "—"}
              </p>
              <p className="text-sm text-[#64748B]">{bankAccountName ?? "—"}</p>
              <p className="text-sm font-mono text-[#0F172A] mt-0.5">
                {maskedAccountNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Preset chips */}
        <div>
          <p className="text-sm font-medium text-[#0F172A] mb-2">Pilih jumlah</p>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((preset) => {
              const exceedsBalance = preset > availableBalance;
              return (
                <button
                  key={preset}
                  type="button"
                  disabled={exceedsBalance}
                  onClick={() => handlePreset(preset)}
                  className={`text-xs sm:text-sm font-medium px-3 py-2.5 rounded-xl border transition cursor-pointer ${
                    numericAmount === preset
                      ? "border-primary bg-primary/5 text-primary"
                      : exceedsBalance
                      ? "border-[#E5E8EF] text-[#CBD5E1] cursor-not-allowed"
                      : "border-[#E5E8EF] text-[#0F172A] hover:border-primary/40 hover:bg-[#F8FAFC]"
                  }`}
                >
                  {formatIDRDisplay(preset)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom amount */}
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-[#0F172A] mb-1.5"
          >
            Atau masukkan jumlah lain
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#64748B]">
              Rp
            </span>
            <input
              id="amount"
              type="text"
              inputMode="numeric"
              value={
                rawAmount
                  ? new Intl.NumberFormat("id-ID").format(numericAmount)
                  : ""
              }
              onChange={handleAmountChange}
              placeholder="100.000"
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#E5E8EF] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Minimum {formatIDRDisplay(MIN_WITHDRAWAL)} · Maksimum{" "}
            {formatIDRDisplay(availableBalance)}
          </p>
        </div>

        {/* Info banner */}
        <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-900 leading-relaxed">
          Penarikan diproses manual oleh tim Storo dalam <strong>1–3 hari kerja</strong>.
          Anda akan menerima notifikasi saat dana sudah ditransfer.
        </div>

        {error ? (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading || !isValid}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white font-medium text-sm py-2.5 rounded-full transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowDownCircle className="size-4" />
          )}
          {loading ? "Mengajukan..." : "Ajukan Penarikan"}
        </button>
      </form>
    </StoreCard>
  );
}
