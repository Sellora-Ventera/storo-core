"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { StoreCard } from "@/components/dashboard/store/ui";

export type ShippingSettingsInitial = {
  origin_address: string;
  origin_city: string;
  origin_province: string;
  origin_postal_code: string;
  allowed_couriers: string[];
};

const COURIERS = [
  { code: "jne", label: "JNE" },
  { code: "jnt", label: "J&T" },
  { code: "sicepat", label: "SiCepat" },
  { code: "ide", label: "ID Express" },
  { code: "anteraja", label: "AnterAja" },
  { code: "ninja", label: "Ninja" },
  { code: "pos", label: "Pos Indonesia" },
  { code: "tiki", label: "TIKI" },
  { code: "lion", label: "Lion Parcel" },
  { code: "wahana", label: "Wahana" },
  { code: "rpx", label: "RPX" },
];

const inputCls =
  "w-full rounded-xl border border-[#E5E8EF] bg-white px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition";

export default function ShippingSettingsForm({
  storeId,
  initial,
}: {
  storeId: string;
  initial: ShippingSettingsInitial;
}) {
  const router = useRouter();
  const [originAddress, setOriginAddress] = useState(initial.origin_address);
  const [originCity, setOriginCity] = useState(initial.origin_city);
  const [originProvince, setOriginProvince] = useState(initial.origin_province);
  const [originPostalCode, setOriginPostalCode] = useState(initial.origin_postal_code);
  const [allowed, setAllowed] = useState<string[]>(initial.allowed_couriers ?? []);
  const [busy, setBusy] = useState(false);

  function toggleCourier(code: string) {
    setAllowed((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(`/api/store/${storeId}/settings/shipping`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin_address: originAddress,
          origin_city: originCity,
          origin_province: originProvince,
          origin_postal_code: originPostalCode,
          allowed_couriers: allowed,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal menyimpan");
        return;
      }
      toast.success("Pengaturan pengiriman disimpan");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <StoreCard>
        <h2 className="text-sm font-semibold text-[#0F172A] mb-3">Alamat Asal Pengiriman</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Alamat</label>
            <input
              type="text"
              value={originAddress}
              onChange={(e) => setOriginAddress(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Kota</label>
              <input
                type="text"
                value={originCity}
                onChange={(e) => setOriginCity(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Provinsi</label>
              <input
                type="text"
                value={originProvince}
                onChange={(e) => setOriginProvince(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Kode Pos</label>
            <input
              type="text"
              value={originPostalCode}
              onChange={(e) => setOriginPostalCode(e.target.value)}
              className={`${inputCls} font-mono`}
            />
          </div>
        </div>
      </StoreCard>

      <StoreCard>
        <h2 className="text-sm font-semibold text-[#0F172A] mb-3">Kurir Aktif</h2>
        <p className="text-xs text-[#64748B] mb-3">
          Pilih kurir yang akan ditampilkan di checkout. Kosong = semua kurir tersedia.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {COURIERS.map((c) => {
            const active = allowed.includes(c.code);
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => toggleCourier(c.code)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
                  active
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white border border-[#E5E8EF] text-[#64748B] hover:bg-[#F8F9FC]"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </StoreCard>

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
