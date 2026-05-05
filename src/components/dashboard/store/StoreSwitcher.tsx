"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Check, ChevronsUpDown, Plus, ArrowLeft, Store as StoreIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type StoreSummary = {
  id: string;
  name: string;
  slug: string | null;
  is_active: boolean;
};

export default function StoreSwitcher({
  currentStoreId,
  stores,
}: {
  currentStoreId: string;
  stores: StoreSummary[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const current = stores.find((s) => s.id === currentStoreId);

  const switchTo = (newStoreId: string) => {
    if (newStoreId === currentStoreId) return;
    const newPath = pathname.replace(
      `/dashboard/${currentStoreId}`,
      `/dashboard/${newStoreId}`
    );
    router.push(newPath);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-[#F8FAFC] border border-[#E5E8EF] hover:bg-[#EEF2FA] transition cursor-pointer">
          <span className="size-9 rounded-xl bg-gradient-to-br from-primary to-secondary grid place-items-center text-white text-xs font-semibold shrink-0">
            <StoreIcon className="size-4" />
          </span>
          <span className="flex-1 text-left min-w-0 leading-tight">
            <span className="block text-[10px] uppercase tracking-[0.18em] text-[#94A3B8] font-semibold">
              Toko Aktif
            </span>
            <span className="block text-sm font-medium text-[#0F172A] truncate">
              {current?.name ?? "—"}
            </span>
          </span>
          <ChevronsUpDown className="size-4 text-[#94A3B8] shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="start"
        className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-64"
      >
        <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.18em] text-[#94A3B8]">
          Pilih Toko
        </DropdownMenuLabel>
        {stores.map((store) => {
          const isActive = store.id === currentStoreId;
          return (
            <DropdownMenuItem
              key={store.id}
              onClick={() => switchTo(store.id)}
              className="cursor-pointer flex items-center gap-2"
            >
              <StoreIcon className="size-4 text-[#64748B] shrink-0" />
              <span className="flex-1 truncate">{store.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  store.is_active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {store.is_active ? "live" : "draft"}
              </span>
              {isActive ? <Check className="size-4 text-primary" /> : null}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/dashboard/stores/new">
            <Plus className="mr-2 size-4" />
            Tambah Toko Baru
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 size-4" />
            Kembali ke Akun
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
