import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { requireSuperadmin } from "@/lib/auth/superadmin";
import { pollDeploymentStatus } from "@/lib/template-deployer";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.errorResponse;

  const { id } = await params;

  // Refresh from Vercel if currently deploying
  await pollDeploymentStatus(id);

  const supabase = await createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("templates")
    .select(
      "id, slug, name, deploy_status, deploy_error, demo_url, deployed_at, vercel_project_id, vercel_deployment_id",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch most recent log entries
  const { data: logs } = await supabase
    .from("template_deployment_logs")
    .select("action, status, step, error_message, created_at")
    .eq("template_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({ template: data, logs: logs ?? [] });
}
