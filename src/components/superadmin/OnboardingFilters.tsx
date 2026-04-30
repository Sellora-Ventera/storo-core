"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface Props {
  q: string;
  status: string;
  pageSize: number;
  pageSizeOptions: readonly number[];
  defaultPageSize: number;
}

export default function OnboardingFilters({
  q,
  status,
  pageSize,
  pageSizeOptions,
  defaultPageSize,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState(q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildHref = (next: {
    q?: string;
    status?: string;
    pageSize?: number;
    page?: number;
  }) => {
    const sp = new URLSearchParams();
    const nextQ = next.q ?? query;
    if (nextQ) sp.set("q", nextQ);
    const nextStatus = next.status ?? status;
    if (nextStatus && nextStatus !== "all") sp.set("status", nextStatus);
    const nextPageSize = next.pageSize ?? pageSize;
    if (nextPageSize !== defaultPageSize) sp.set("pageSize", String(nextPageSize));
    const nextPage = next.page ?? 1;
    if (nextPage !== 1) sp.set("page", String(nextPage));
    const qs = sp.toString();
    return qs ? `/superadmin/onboarding?${qs}` : "/superadmin/onboarding";
  };

  const navigate = (overrides: { q?: string; pageSize?: number }) => {
    startTransition(() => router.push(buildHref({ ...overrides, page: 1 })));
  };

  // Sync if URL changes externally
  useEffect(() => {
    setQuery(q);
  }, [q]);

  const onQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigate({ q: value }), 300);
  };

  return (
    <>
      {/* Search */}
      <div className="relative ml-auto w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Cari nama, email, WA, domain…"
          className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        />
      </div>

      {/* Page size */}
      <div className="flex items-center gap-2">
        <label className="text-foreground/60 text-xs whitespace-nowrap">Per halaman</label>
        <select
          value={pageSize}
          onChange={(e) => navigate({ pageSize: Number(e.target.value) })}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
