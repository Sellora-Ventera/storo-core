export const dynamic = "force-dynamic";

import Link from "next/link";
import { Star } from "lucide-react";
import { getStoreForUser } from "@/lib/store/context";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  StorePageHeader,
  StoreCard,
  EmptyState,
  StatusBadge,
  formatDate,
} from "@/components/dashboard/store/ui";
import ReviewActions from "@/components/dashboard/store/reviews/ReviewActions";

const STATUS_TABS = [
  { value: "", label: "Semua" },
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
];

export default async function ReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { storeId } = await params;
  const sp = await searchParams;
  await getStoreForUser(storeId);

  const status = sp.status ?? "";
  const supabase = await createSupabaseServiceClient();
  let query = supabase
    .from("product_reviews")
    .select(
      "id, product_id, customer_name, rating, comment, status, created_at, products!inner(name)"
    )
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data } = await query;
  const reviews = data ?? [];
  const basePath = `/dashboard/manage-store/${storeId}/reviews`;

  return (
    <div>
      <StorePageHeader
        title="Ulasan Produk"
        description={
          reviews.length > 0 ? `${reviews.length} ulasan` : "Moderasi ulasan dari pelanggan."
        }
      />
      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        {STATUS_TABS.map((tab) => {
          const isActive = status === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value ? `${basePath}?status=${tab.value}` : basePath}
              className={`inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full transition cursor-pointer ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white border border-[#E5E8EF] text-[#64748B] hover:bg-[#F8F9FC]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {reviews.length === 0 ? (
        <StoreCard padded={false}>
          <EmptyState
            icon={Star}
            title="Belum ada ulasan"
            description="Ulasan akan muncul setelah pelanggan menyelesaikan pesanan."
          />
        </StoreCard>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => {
            const product = (r.products as unknown as { name: string } | null) ?? null;
            return (
              <StoreCard key={r.id as string}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`size-3.5 ${
                              i < (r.rating as number) ? "fill-current" : "opacity-30"
                            }`}
                          />
                        ))}
                      </span>
                      <span className="text-sm font-medium text-[#0F172A]">
                        {r.customer_name ?? "Anonim"}
                      </span>
                      <StatusBadge
                        tone={
                          r.status === "approved"
                            ? "success"
                            : r.status === "rejected"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {String(r.status)}
                      </StatusBadge>
                    </div>
                    <p className="text-xs text-[#64748B]">
                      Untuk produk:{" "}
                      <span className="font-medium text-[#0F172A]">{product?.name ?? "—"}</span>{" "}
                      • {formatDate(r.created_at as string)}
                    </p>
                    {r.comment ? (
                      <p className="mt-2 text-sm text-[#0F172A] whitespace-pre-wrap">
                        {r.comment as string}
                      </p>
                    ) : null}
                  </div>
                  <ReviewActions
                    reviewId={r.id as string}
                    storeId={storeId}
                    status={r.status as string}
                  />
                </div>
              </StoreCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
