import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from("superadmin_users")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      status,
      status_note,
      assigned_engineer,
      store_url,
    } = body as {
      status?: string;
      status_note?: string;
      assigned_engineer?: string;
      store_url?: string;
    };

    // Fetch current record to get client_id and store_url for notification
    const { data: current } = await supabase
      .from("onboarding_requests")
      .select("client_id, store_url, status")
      .eq("id", id)
      .single();

    if (!current) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const updatePayload: Record<string, string | null> = {};
    if (status !== undefined) updatePayload.status = status;
    if (status_note !== undefined) updatePayload.status_note = status_note || null;
    if (assigned_engineer !== undefined) updatePayload.assigned_engineer = assigned_engineer || null;
    if (store_url !== undefined) updatePayload.store_url = store_url || null;

    // Auto-stamp live_at when transitioning to live
    if (status === "live" && current.status !== "live") {
      updatePayload.live_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("onboarding_requests")
      .update(updatePayload)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // If status changed to 'live', insert client notification
    if (status === "live" && current.status !== "live" && current.client_id) {
      const liveUrl = store_url || current.store_url;
      await supabase.from("client_notifications").insert({
        client_id: current.client_id,
        title: "Toko Anda Sudah Live!",
        message:
          "Selamat! Toko Anda telah aktif." +
          (liveUrl ? " Kunjungi: " + liveUrl : ""),
        type: "success",
        is_read: false,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
