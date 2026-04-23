import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { requireSuperadmin } from "@/lib/auth/superadmin";
import { uploadTemplateScreenshot } from "@/lib/integrations/screenshot";

interface Candidate {
  id: string;
  slug: string;
  demo_url: string;
}

interface Result {
  id: string;
  slug: string;
  success: boolean;
  url?: string;
  error?: string;
}

export async function POST() {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.errorResponse;

  const supabase = await createSupabaseServiceClient();

  const { data: candidates, error } = await supabase
    .from("templates")
    .select("id, slug, demo_url")
    .eq("deploy_status", "live")
    .not("demo_url", "is", null)
    .is("preview_image_url", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = (candidates ?? []) as Candidate[];
  if (list.length === 0) return NextResponse.json({ results: [] });

  const results: Result[] = await Promise.all(
    list.map(async (t): Promise<Result> => {
      try {
        const url = await uploadTemplateScreenshot(supabase, t.slug, t.demo_url);
        const { error: updateError } = await supabase
          .from("templates")
          .update({ preview_image_url: url })
          .eq("id", t.id)
          .is("preview_image_url", null);
        if (updateError) throw new Error(`DB update failed: ${updateError.message}`);

        await supabase.from("template_deployment_logs").insert({
          template_id: t.id,
          action: "backfill_screenshot",
          status: "success",
          step: "screenshot",
          vercel_response: { preview_image_url: url },
        });
        return { id: t.id, slug: t.slug, success: true, url };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await supabase.from("template_deployment_logs").insert({
          template_id: t.id,
          action: "backfill_screenshot",
          status: "failed",
          step: "screenshot",
          error_message: message,
        });
        return { id: t.id, slug: t.slug, success: false, error: message };
      }
    }),
  );

  return NextResponse.json({ results });
}
