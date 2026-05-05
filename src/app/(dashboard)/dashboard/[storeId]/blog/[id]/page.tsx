import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getStoreForUser } from "@/lib/store/context";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { StorePageHeader, ChipButton } from "@/components/dashboard/store/ui";
import BlogPostForm, {
  type BlogPostInitial,
} from "@/components/dashboard/store/blog/BlogPostForm";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ storeId: string; id: string }>;
}) {
  const { storeId, id } = await params;
  await getStoreForUser(storeId);

  const supabase = await createSupabaseServiceClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, content, featured_image, status, meta_title, meta_description")
    .eq("id", id)
    .eq("store_id", storeId)
    .maybeSingle();

  if (!post) notFound();

  const initial: BlogPostInitial = {
    id: post.id as string,
    title: (post.title as string) ?? "",
    slug: (post.slug as string) ?? "",
    excerpt: (post.excerpt as string | null) ?? null,
    content: (post.content as string | null) ?? null,
    featured_image: (post.featured_image as string | null) ?? null,
    status: (post.status as string) ?? "draft",
    meta_title: (post.meta_title as string | null) ?? null,
    meta_description: (post.meta_description as string | null) ?? null,
  };

  return (
    <div>
      <StorePageHeader
        title="Edit Artikel"
        description={initial.title}
        actions={
          <ChipButton
            href={`/dashboard/${storeId}/blog`}
            variant="default"
            icon={<ArrowLeft className="size-3.5" />}
          >
            Kembali
          </ChipButton>
        }
      />
      <BlogPostForm storeId={storeId} mode="edit" initial={initial} />
    </div>
  );
}
