"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ManageStoreLink({ storeId }: { storeId: string }) {
  return (
    <Link
      href={`/dashboard/${storeId}`}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-full transition cursor-pointer"
    >
      Kelola Toko
      <ArrowRight className="w-3.5 h-3.5" />
    </Link>
  );
}
