import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/auth/superadmin";
import { deployTemplate } from "@/lib/template-deployer";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.errorResponse;

  const { id } = await params;

  // Fire-and-forget. Errors are persisted to template row + log table.
  // UI polls /status to track progress.
  void deployTemplate(id).catch((err) => {
    console.error("[template-deploy]", id, err);
  });

  return NextResponse.json({ success: true, template_id: id, status: "deploying" });
}
