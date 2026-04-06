"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface LiveStore {
  id: string;
  store_url: string | null;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

export default function NewDisbursementPage() {
  const router = useRouter();

  const [stores, setStores] = useState<LiveStore[]>([]);
  const [form, setForm] = useState({
    storeId: "",
    periodLabel: "",
    grossAmount: "",
    pgFeePct: "1",
    opsFeePct: "4",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase
      .from("onboarding_requests")
      .select("id, store_url")
      .eq("status", "live")
      .then(({ data }) => setStores(data ?? []));
  }, []);

  const gross = parseFloat(form.grossAmount) || 0;
  const pgFee = gross * (parseFloat(form.pgFeePct) / 100);
  const opsFee = gross * (parseFloat(form.opsFeePct) / 100);
  const net = gross - pgFee - opsFee;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/superadmin/disbursements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: form.storeId,
          period_label: form.periodLabel,
          gross_amount: gross,
          pg_fee: pgFee,
          ops_fee: opsFee,
          net_amount: net,
          status: "pending",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat disbursement");

      router.push("/superadmin/disbursements");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/superadmin/disbursements"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Disbursement
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Buat Disbursement</h1>
        <p className="text-gray-500 mt-1 text-sm">Isi detail disbursement untuk store</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Store */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store <span className="text-red-400">*</span>
            </label>
            <select
              name="storeId"
              value={form.storeId}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih store...</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.store_url ?? s.id}
                </option>
              ))}
            </select>
          </div>

          {/* Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Periode <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="periodLabel"
              value={form.periodLabel}
              onChange={handleChange}
              placeholder="cth. Maret 2025"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Gross Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gross Amount (Rp) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              name="grossAmount"
              value={form.grossAmount}
              onChange={handleChange}
              placeholder="0"
              min="0"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Fee row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PG Fee %
              </label>
              <input
                type="number"
                name="pgFeePct"
                value={form.pgFeePct}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ops Fee %
              </label>
              <input
                type="number"
                name="opsFeePct"
                value={form.opsFeePct}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Breakdown preview */}
          {gross > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Gross</span>
                <span className="font-mono text-gray-900">{formatCurrency(gross)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">
                  PG Fee ({form.pgFeePct}%)
                </span>
                <span className="font-mono text-red-500">- {formatCurrency(pgFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Ops Fee ({form.opsFeePct}%)
                </span>
                <span className="font-mono text-red-500">- {formatCurrency(opsFee)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold">
                <span className="text-gray-900">Net Amount</span>
                <span className="font-mono text-green-600">{formatCurrency(net)}</span>
              </div>
            </div>
          )}

          {/* Net Amount (read-only display) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Net Amount (otomatis)
            </label>
            <input
              type="text"
              value={formatCurrency(net)}
              readOnly
              className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600 cursor-not-allowed"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Menyimpan..." : "Buat Disbursement"}
            </button>
            <Link
              href="/superadmin/disbursements"
              className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              Batal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
