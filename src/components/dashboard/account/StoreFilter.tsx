"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Store, ChevronDown } from "lucide-react";

interface StoreFilterProps {
  stores: Array<{ id: string; name: string; slug?: string | null }>;
  /** Param name di URL. Default: "store". */
  paramName?: string;
}

// Dropdown filter toko untuk halaman cross-store (Pesan, Notifikasi, Leads).
// Update URL ?store={id} → page server component re-render dengan filter baru.
// Default "Semua Toko" (param tidak ada / kosong).
export default function StoreFilter({ stores, paramName = "store" }: StoreFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get(paramName) ?? "";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(paramName, value);
    } else {
      params.delete(paramName);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="relative inline-block">
      <Store className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#64748B] pointer-events-none" />
      <select
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        className="appearance-none pl-9 pr-9 py-2 rounded-full text-sm font-medium bg-white border border-[#E5E8EF] text-[#0F172A] hover:bg-[#F8F9FC] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <option value="">Semua Toko</option>
        {stores.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name || s.slug || "(toko tanpa nama)"}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[#64748B] pointer-events-none" />
    </div>
  );
}
