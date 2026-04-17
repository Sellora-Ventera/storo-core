import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/auth/superadmin";
import { redeployTemplate } from "@/lib/template-deployer";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.errorResponse;

  const { id } = await params;

  let body: { branch?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* optional body */
  }

  void redeployTemplate(id, body.branch).catch((err) => {
    console.error("[template-redeploy]", id, err);
  });

  return NextResponse.json({ success: true, template_id: id, status: "deploying" });
}
