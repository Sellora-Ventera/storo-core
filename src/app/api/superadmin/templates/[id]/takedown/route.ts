import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/auth/superadmin";
import { takedownTemplate } from "@/lib/template-deployer";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperadmin();
  if (!auth.ok) return auth.errorResponse;

  const { id } = await params;

  try {
    await takedownTemplate(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Takedown failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
