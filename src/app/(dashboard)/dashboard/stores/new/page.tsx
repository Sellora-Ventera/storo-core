import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import AddStoreWizard from "@/components/dashboard/AddStoreWizard";

export const metadata = { title: "Tambah Toko Baru — Storo.id" };

export default async function AddStorePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: client } = await supabase
    .from("clients")
    .select("full_name, phone")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!client) redirect("/dashboard");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/stores"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800 transition-colors cursor-pointer mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Kembali ke Toko Saya
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Tambah Toko Baru</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Pesanan toko baru akan diproses oleh tim VenteraAI setelah pembayaran dikonfirmasi.
        </p>
      </div>

      <AddStoreWizard
        client={{ full_name: client.full_name ?? "", phone: client.phone ?? "" }}
        userEmail={user.email ?? ""}
      />
    </div>
  );
}
