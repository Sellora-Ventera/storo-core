import { ArrowLeft } from "lucide-react";
import { getStoreForUser } from "@/lib/store/context";
import { StorePageHeader, ChipButton } from "@/components/dashboard/store/ui";
import BlogPostForm from "@/components/dashboard/store/blog/BlogPostForm";

export default async function NewBlogPostPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  await getStoreForUser(storeId);

  return (
    <div>
      <StorePageHeader
        title="Artikel Baru"
        description="Tulis artikel untuk blog storefront."
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
      <BlogPostForm storeId={storeId} mode="create" />
    </div>
  );
}
