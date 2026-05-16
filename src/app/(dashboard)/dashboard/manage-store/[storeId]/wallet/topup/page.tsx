"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpCircle, Loader2 } from "lucide-react";
import { StoreCard, StorePageHeader } from "@/components/dashboard/store/ui";

const PRESET_AMOUNTS = [500_000, 1_000_000, 2_000_000, 5_000_000];
const MIN_TOPUP = 500_000;

function formatIDRDisplay(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function WalletTopupPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = use(params);
  const router = useRouter();

  const [rawAmount, setRawAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericAmount = parseInt(rawAmount.replace(/\D/g, ""), 10) || 0;
  const isValid = numericAmount >= MIN_TOPUP;

  function handlePreset(amount: number) {
    setRawAmount(String(amount));
    setError(null);
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cleaned = e.target.value.replace(/\D/g, "");
    setRawAmount(cleaned);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) {
      setError(`Minimum top up ${formatIDRDisplay(MIN_TOPUP)}.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/store/${storeId}/wallet/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numericAmount }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Gagal membuat invoice pembayaran.");
        setLoading(false);
        return;
      }

      if (data.invoice_url) {
        // Redirect to Xendit payment page
        router.push(data.invoice_url);
      } else {
        setError("Invoice URL tidak tersedia. Hubungi tim Storo.");
        setLoading(false);
      }
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-4">
        <Link
          href={`/dashboard/manage-store/${storeId}/wallet`}
          className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] transition cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Wallet
        </Link>
      </div>

      <StorePageHeader
        title="Top Up Wallet"
        description="Tambah saldo wallet untuk menutupi biaya operasional transaksi toko."
      />

      <StoreCard>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Preset amounts */}
          <div>
            <p className="text-sm font-medium text-[#0F172A] mb-2">Pilih jumlah</p>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePreset(preset)}
                  className={`text-sm font-medium px-4 py-2.5 rounded-xl border transition cursor-pointer ${
                    numericAmount === preset
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-[#E5E8EF] text-[#0F172A] hover:border-primary/40 hover:bg-[#F8FAFC]"
                  }`}
                >
                  {formatIDRDisplay(preset)}
                </button>
              ))}
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
                placeholder="500.000"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#E5E8EF] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">
              Minimum top up {formatIDRDisplay(MIN_TOPUP)}
            </p>
          </div>

          {/* Summary */}
          {isValid ? (
            <div className="rounded-xl bg-[#F8FAFC] border border-[#E5E8EF] px-4 py-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Jumlah top up</span>
                <span className="font-semibold text-[#0F172A]">
                  {formatIDRDisplay(numericAmount)}
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-1.5">
                Saldo akan ditambahkan otomatis setelah pembayaran berhasil dikonfirmasi.
              </p>
            </div>
          ) : null}

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
              <ArrowUpCircle className="size-4" />
            )}
            {loading ? "Memproses..." : "Bayar Sekarang"}
          </button>
        </form>
      </StoreCard>
    </div>
  );
}
