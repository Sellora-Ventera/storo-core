export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, FileText, Pencil } from "lucide-react";
import { getStoreForUser } from "@/lib/store/context";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  StorePageHeader,
  StoreCard,
  EmptyState,
  ChipButton,
  StatusBadge,
  formatDate,
} from "@/components/dashboard/store/ui";

export default async function BlogPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  await getStoreForUser(storeId);

  const supabase = await createSupabaseServiceClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, status, featured_image, published_at, created_at")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  const posts = data ?? [];
  const basePath = `/dashboard/manage-store/${storeId}/blog`;

  return (
    <div>
      <StorePageHeader
        title="Blog"
        description={posts.length > 0 ? `${posts.length} artikel` : "Konten blog storefront."}
        actions={
          <ChipButton href={`${basePath}/new`} variant="primary" icon={<Plus className="size-3.5" />}>
            Artikel Baru
          </ChipButton>
        }
      />
      {posts.length === 0 ? (
        <StoreCard padded={false}>
          <EmptyState
            icon={FileText}
            title="Belum ada artikel"
            description="Tulis artikel pertama untuk konten blog storefront Anda."
            action={{ label: "Tulis Artikel", href: `${basePath}/new` }}
          />
        </StoreCard>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <StoreCard key={p.id as string} padded={false} className="overflow-hidden">
              {p.featured_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.featured_image as string}
                  alt=""
                  className="h-32 w-full object-cover bg-[#F1F4FA]"
                />
              ) : (
                <div className="h-32 w-full bg-[#F1F4FA] grid place-items-center">
                  <FileText className="size-6 text-[#94A3B8]" />
                </div>
              )}
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#0F172A] line-clamp-1">
                    {p.title as string}
                  </p>
                  <StatusBadge tone={p.status === "published" ? "success" : "neutral"}>
                    {p.status === "published" ? "Publish" : "Draft"}
                  </StatusBadge>
                </div>
                {p.excerpt ? (
                  <p className="text-xs text-[#64748B] line-clamp-2">{p.excerpt as string}</p>
                ) : null}
                <p className="text-[11px] text-[#94A3B8]">
                  {p.published_at
                    ? `Published ${formatDate(p.published_at as string)}`
                    : `Dibuat ${formatDate(p.created_at as string)}`}
                </p>
                <div>
                  <Link
                    href={`${basePath}/${p.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 cursor-pointer"
                  >
                    <Pencil className="size-3" />
                    Edit
                  </Link>
                </div>
              </div>
            </StoreCard>
          ))}
        </div>
      )}
    </div>
  );
}
