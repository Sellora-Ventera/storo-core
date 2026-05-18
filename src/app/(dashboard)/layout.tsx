import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";

/**
 * Lazy-provision baris `public.clients` + attribute referral code untuk akun
 * yang baru sign-in via Google (atau email biasa) tapi belum pernah lewat
 * /onboarding wizard.
 *
 * Tanpa ini:
 *   1. Page yang query `clients WHERE user_id = auth.uid()` (mis.
 *      /dashboard/stores/new, /dashboard/profile, /api/dashboard/add-store)
 *      gagal silent karena clients row belum ada.
 *   2. Diskon referral nggak ke-apply karena `referred_by_code` kosong —
 *      Google OAuth flow nggak punya jalan untuk passthrough referral code
 *      ke user_metadata (beda dari email/password form).
 *
 * Idempotent: cuma set `referred_by_code` kalau masih null + cookie ada.
 */
async function ensureClientRow(opts: {
  userId: string;
  fullName: string | null;
  referralCode: string | null;
}) {
  const admin = await createSupabaseServiceClient();
  const { data: existing } = await admin
    .from("clients")
    .select("id, referred_by_code")
    .eq("user_id", opts.userId)
    .maybeSingle();

  if (!existing) {
    await admin.from("clients").insert({
      user_id: opts.userId,
      full_name: opts.fullName,
      referred_by_code: opts.referralCode,
    });
    return;
  }

  // Row ada — cuma isi referred_by_code kalau belum pernah di-attribute (so
  // user yang habis switch akun nggak ke-overwrite refernya).
  if (opts.referralCode && !existing.referred_by_code) {
    await admin
      .from("clients")
      .update({ referred_by_code: opts.referralCode })
      .eq("id", existing.id);
  }
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

  // Pickup referral code dari cookie (di-set oleh middleware saat user akses
  // /r/<code>). Fallback ke user_metadata.referral_code (di-set oleh form
  // email/password sign-up).
  const cookieStore = await cookies();
  const referralCode =
    cookieStore.get("storo_referral_code")?.value ??
    (user.user_metadata?.referral_code as string | undefined) ??
    null;

  // Fire-and-await — kalau gagal kita masih lanjut render; child page yang
  // butuh clients akan redirect sendiri. Tidak perlu block dashboard buat
  // satu insert idempotent.
  try {
    await ensureClientRow({ userId: user.id, fullName, referralCode });
  } catch (err) {
    console.warn("[dashboard/layout] ensureClientRow failed:", err);
  }

  return <div className="min-h-screen bg-[#F8FAFC]">{children}</div>;
}
