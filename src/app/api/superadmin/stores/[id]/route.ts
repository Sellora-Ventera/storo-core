import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type ProvisionResult = {
  storeId?: string;
  error?: string;
  status?: number;
};

async function provisionStorefront(
  supabase: SupabaseClient,
  onboardingId: string
): Promise<ProvisionResult> {
  const { data: req } = await supabase
    .from("onboarding_requests")
    .select(
      "client_id, requested_slug, custom_domain, store_name, template_name"
    )
    .eq("id", onboardingId)
    .maybeSingle();

  if (!req) return { error: "Onboarding request not found.", status: 404 };
  if (!req.client_id)
    return { error: "Client belum di-link ke request ini.", status: 400 };
  if (!req.requested_slug?.trim())
    return {
      error: "requested_slug kosong — tidak bisa auto-provisioning.",
      status: 400,
    };

  const { data: client } = await supabase
    .from("clients")
    .select("user_id")
    .eq("id", req.client_id)
    .maybeSingle();

  if (!client?.user_id)
    return {
      error: "clients.user_id kosong — toko tidak bisa di-link ke auth user.",
      status: 400,
    };

  const slug = slugify(req.requested_slug);
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug))
    return { error: `Slug "${slug}" tidak valid.`, status: 400 };

  const customDomain = req.custom_domain?.trim() ? req.custom_domain.trim() : null;
  const storeName = req.store_name?.trim() || slug;
  const templateVariant = req.template_name?.trim() || "modern";

  const { data: slugClash } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (slugClash)
    return { error: `Slug "${slug}" sudah dipakai store lain.`, status: 409 };

  if (customDomain) {
    const { data: domainClash } = await supabase
      .from("stores")
      .select("id")
      .eq("custom_domain", customDomain)
      .maybeSingle();
    if (domainClash)
      return {
        error: `Custom domain "${customDomain}" sudah dipakai store lain.`,
        status: 409,
      };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("stores")
    .insert({
      name: storeName,
      slug,
      custom_domain: customDomain,
      client_id: req.client_id,
      user_id: client.user_id,
      billing_model: "storo_gateway",
      template_variant: templateVariant,
      is_active: true,
    })
    .select("id")
    .single();

  if (insertError || !inserted)
    return {
      error: insertError?.message ?? "Gagal membuat stores row.",
      status: 500,
    };

  return { storeId: inserted.id as string };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authClient = await createSupabaseServerClient();

    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServiceClient();

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

    const { data: current } = await supabase
      .from("onboarding_requests")
      .select("client_id, store_url, status, store_id")
      .eq("id", id)
      .single();

    if (!current) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const updatePayload: Record<string, string | null> = {};
    if (status !== undefined) updatePayload.status = status;
    if (status_note !== undefined) updatePayload.status_note = status_note || null;
    if (assigned_engineer !== undefined)
      updatePayload.assigned_engineer = assigned_engineer || null;
    if (store_url !== undefined) updatePayload.store_url = store_url || null;

    // Auto-provisioning: kalau transisi ke 'live' tapi belum ada stores row,
    // bikin row di tabel `stores` + link balik ke onboarding_requests.store_id
    // sebagai satu operasi atomik (sebisa mungkin — rollback insert kalau update gagal).
    let provisionedStoreId: string | null = null;
    if (status === "live" && current.status !== "live" && !current.store_id) {
      const result = await provisionStorefront(supabase, id);
      if (result.error || !result.storeId) {
        return NextResponse.json(
          { error: result.error ?? "Provisioning gagal." },
          { status: result.status ?? 500 }
        );
      }
      provisionedStoreId = result.storeId;
      updatePayload.store_id = result.storeId;
    }

    if (status === "live" && current.status !== "live") {
      updatePayload.live_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("onboarding_requests")
      .update(updatePayload)
      .eq("id", id);

    if (updateError) {
      if (provisionedStoreId) {
        await supabase.from("stores").delete().eq("id", provisionedStoreId);
      }
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

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

    return NextResponse.json({
      success: true,
      ...(provisionedStoreId ? { provisioned_store_id: provisionedStoreId } : {}),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
