import Link from "next/link";
import { Store } from "lucide-react";

interface StoreBadgeProps {
  storeId: string;
  name: string;
  slug?: string | null;
  /** Render as link ke dashboard toko itu. Default true. */
  asLink?: boolean;
}

// Badge mini menampilkan nama toko per data row di halaman Komunikasi
// cross-store (Pesan, Notifikasi, Leads).
export default function StoreBadge({
  storeId,
  name,
  slug,
  asLink = true,
}: StoreBadgeProps) {
  const content = (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EEF2FA] text-[#0F172A] border border-[#E5E8EF]">
      <Store className="size-3" />
      <span className="truncate max-w-[140px]">{name || slug || "Toko"}</span>
    </span>
  );

  if (!asLink) return content;
  return (
    <Link
      href={`/dashboard/manage-store/${storeId}`}
      className="hover:opacity-80 transition cursor-pointer"
      title={`Buka dashboard ${name}`}
    >
      {content}
    </Link>
  );
}
