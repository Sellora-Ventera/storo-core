import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { store_name, custom_domain } = body as {
      store_name?: string;
      custom_domain?: string;
    };

    const supabase = getServiceClient();

    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client tidak ditemukan." }, { status: 404 });
    }

    const { data: store } = await supabase
      .from("onboarding_requests")
      .select("id")
      .eq("id", id)
      .eq("client_id", client.id)
      .single();

    if (!store) {
      return NextResponse.json({ error: "Toko tidak ditemukan." }, { status: 404 });
    }

    const updatePayload: Record<string, string | null> = {};

    if (store_name !== undefined) {
      const trimmed = store_name.trim();
      if (!trimmed) {
        return NextResponse.json({ error: "Nama toko tidak boleh kosong." }, { status: 400 });
      }
      updatePayload.store_name = trimmed;
    }

    if (custom_domain !== undefined) {
      updatePayload.custom_domain = custom_domain.trim() || null;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "Tidak ada field yang diubah." }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("onboarding_requests")
      .update(updatePayload)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
