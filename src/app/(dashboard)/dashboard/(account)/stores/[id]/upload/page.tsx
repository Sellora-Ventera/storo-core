import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import UploadShopeeFiles, { type StoredFile } from "@/components/dashboard/UploadShopeeFiles";

export const metadata = { title: "Upload File Shopee — Storo.id" };
export const dynamic = "force-dynamic";

const BUCKET = "shopee-uploads";
const SIGNED_URL_TTL = 60 * 60 * 24; // 24h

export default async function StoreUploadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: client } = await supabase
    .from("clients")
    .select("id, full_name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!client) redirect("/dashboard");

  const { data: request_row } = await supabase
    .from("onboarding_requests")
    .select("id, store_name, requested_slug, status, files_uploaded")
    .or(`id.eq.${id},store_id.eq.${id}`)
    .eq("client_id", client.id)
    .maybeSingle();
  if (!request_row) notFound();

  const filesRaw = (request_row.files_uploaded ?? []) as unknown;
  const files: StoredFile[] = Array.isArray(filesRaw) ? (filesRaw as StoredFile[]) : [];

  // Generate signed URLs server-side so client doesn't need direct storage access
  const service = await createSupabaseServiceClient();
  const filesWithUrls = await Promise.all(
    files.map(async (f) => {
      if (!f.storage_path) return { ...f, signedUrl: null };
      const { data } = await service.storage
        .from(BUCKET)
        .createSignedUrl(f.storage_path, SIGNED_URL_TTL);
      return { ...f, signedUrl: data?.signedUrl ?? null };
    }),
  );

  const storeLabel =
    request_row.store_name ?? request_row.requested_slug ?? "Toko";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href={`/dashboard/stores/${request_row.id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800 transition-colors cursor-pointer mb-3"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kembali ke {storeLabel}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 capitalize">
          Upload File Shopee
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Untuk toko <span className="font-semibold text-gray-700">{storeLabel}</span>.
          Upload 6 file Excel dari Shopee Seller Center supaya tim VenteraAI bisa import produk Anda.
        </p>
      </div>

      <UploadShopeeFiles
        storeRouteId={id}
        initialFiles={filesWithUrls}
      />
    </div>
  );
}
