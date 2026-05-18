import { redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";

/**
 * Lazy-provision baris `public.clients` untuk akun yang baru sign-in via
 * Google (atau email biasa) tapi belum pernah lewat /onboarding wizard.
 *
 * Tanpa ini: page yang query `clients WHERE user_id = auth.uid()` (mis.
 * /dashboard/stores/new, /dashboard/profile, /api/dashboard/add-store) gagal
 * silent (redirect ke /dashboard atau return 404) karena clients row belum
 * ada. Onboarding wizard biasanya yang bikin row, tapi user yang sign-up
 * langsung lewat Google sign-in tidak lewat sana.
 *
 * Idempotent — pakai upsert on user_id (UNIQUE).
 */
async function ensureClientRow(userId: string, fullName: string | null) {
  const admin = await createSupabaseServiceClient();
  await admin
    .from("clients")
    .upsert(
      { user_id: userId, full_name: fullName },
      { onConflict: "user_id", ignoreDuplicates: true },
    );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    null;

  // Fire-and-await — kalau gagal kita masih lanjut render; child page yang
  // butuh clients akan redirect sendiri. Tidak perlu block dashboard buat
  // satu insert idempotent.
  try {
    await ensureClientRow(user.id, fullName);
  } catch (err) {
    console.warn("[dashboard/layout] ensureClientRow failed:", err);
  }

  return <div className="min-h-screen bg-[#F8FAFC]">{children}</div>;
}
