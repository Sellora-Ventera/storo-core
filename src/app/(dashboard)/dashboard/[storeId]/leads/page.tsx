export const dynamic = "force-dynamic";

import { Mail } from "lucide-react";
import { getStoreForUser } from "@/lib/store/context";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  StorePageHeader,
  StoreCard,
  EmptyState,
  formatDate,
} from "@/components/dashboard/store/ui";

export default async function LeadsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  await getStoreForUser(storeId);

  const supabase = await createSupabaseServiceClient();
  const { data } = await supabase
    .from("leads")
    .select("id, email, name, phone, source, metadata, created_at")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(200);

  const items = data ?? [];

  return (
    <div>
      <StorePageHeader
        title="Leads"
        description={items.length > 0 ? `${items.length} leads` : "Daftar lead dari berbagai sumber."}
      />
      {items.length === 0 ? (
        <StoreCard padded={false}>
          <EmptyState
            icon={Mail}
            title="Belum ada lead"
            description="Lead akan muncul saat ada yang berlangganan newsletter atau mengisi form lead."
          />
        </StoreCard>
      ) : (
        <StoreCard padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8F9FC] border-b border-[#F1F4FA]">
                  <th className="px-4 py-3 text-left font-medium text-[#64748B]">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-[#64748B]">Nama</th>
                  <th className="px-4 py-3 text-left font-medium text-[#64748B]">Telepon</th>
                  <th className="px-4 py-3 text-left font-medium text-[#64748B]">Sumber</th>
                  <th className="px-4 py-3 text-left font-medium text-[#64748B]">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((l) => (
                  <tr
                    key={l.id as string}
                    className="border-b border-[#F1F4FA] hover:bg-[#F8F9FC] transition"
                  >
                    <td className="px-4 py-3 text-[#0F172A] font-medium">
                      {l.email as string}
                    </td>
                    <td className="px-4 py-3 text-[#64748B]">{l.name ?? "—"}</td>
                    <td className="px-4 py-3 text-[#64748B]">{l.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-[#64748B] text-xs">
                      {l.source ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[#64748B] text-xs">
                      {formatDate(l.created_at as string)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </StoreCard>
      )}
    </div>
  );
}
