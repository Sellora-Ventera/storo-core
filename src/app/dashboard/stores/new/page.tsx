import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AddStoreWizard from "@/components/dashboard/AddStoreWizard";

export const metadata = {
  title: "Tambah Toko Baru — Storo.id",
};

export default async function NewStorePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: client } = await supabase
    .from("clients")
    .select("full_name, phone")
    .eq("user_id", user.id)
    .single();

  // No client row yet — user belum pernah onboarding. Arahkan ke flow utama
  // yang melengkapi profil + bikin invoice pertama.
  if (!client) redirect("/onboarding");

  return (
    <div className="font-inter min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-white to-secondary/5">
      <Header />
      <main className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-2">
          <Link
            href="/dashboard/stores"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Toko Saya
          </Link>
        </div>
        <AddStoreWizard
          client={{ full_name: client.full_name, phone: client.phone }}
          userEmail={user.email ?? ""}
        />
      </main>
      <Footer />
    </div>
  );
}
