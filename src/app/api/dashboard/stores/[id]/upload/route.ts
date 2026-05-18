import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BUCKET = "shopee-uploads";
const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB — matches bucket config
const MAX_FILES = 6;
const ALLOWED_EXT = ["xlsx", "xls", "csv"];

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

type StoredFile = {
  name: string;
  size: number;
  storage_path: string;
  uploaded_at: string;
  uploaded_by: string;
};

async function resolveRequest(serviceClient: ReturnType<typeof getServiceClient>, id: string, clientId: string) {
  const { data } = await serviceClient
    .from("onboarding_requests")
    .select("id, client_id, files_uploaded")
    .or(`id.eq.${id},store_id.eq.${id}`)
    .eq("client_id", clientId)
    .maybeSingle();
  return data;
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  const auth = await createSupabaseServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = getServiceClient();
  const { data: client } = await service
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!client) return NextResponse.json({ error: "Client tidak ditemukan" }, { status: 403 });

  const request_row = await resolveRequest(service, id, client.id);
  if (!request_row) return NextResponse.json({ error: "Toko tidak ditemukan" }, { status: 404 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Body harus multipart/form-data" }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ error: "Tidak ada file" }, { status: 400 });
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Maksimal ${MAX_FILES} file per upload` }, { status: 400 });
  }

  const errors: { name: string; error: string }[] = [];
  const uploaded: StoredFile[] = [];

  for (const file of files) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXT.includes(ext)) {
      errors.push({ name: file.name, error: `Ekstensi .${ext} tidak diizinkan` });
      continue;
    }
    if (file.size === 0) {
      errors.push({ name: file.name, error: "File kosong" });
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      errors.push({ name: file.name, error: `File > ${MAX_FILE_BYTES / 1024 / 1024} MB` });
      continue;
    }

    const safeName = sanitize(file.name);
    const path = `${client.id}/${request_row.id}/${Date.now()}-${safeName}`;

    const buffer = await file.arrayBuffer();
    const { error: upErr } = await service.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (upErr) {
      console.error("[upload] storage error", file.name, upErr);
      errors.push({ name: file.name, error: upErr.message });
      continue;
    }

    uploaded.push({
      name: file.name,
      size: file.size,
      storage_path: path,
      uploaded_at: new Date().toISOString(),
      uploaded_by: user.id,
    });
  }

  if (uploaded.length === 0) {
    return NextResponse.json(
      { error: "Semua file gagal di-upload", errors },
      { status: 400 },
    );
  }

  const existing = Array.isArray(request_row.files_uploaded)
    ? (request_row.files_uploaded as StoredFile[])
    : [];

  const next = [...existing, ...uploaded];

  const { error: updateErr } = await service
    .from("onboarding_requests")
    .update({ files_uploaded: next, upload_method: "platform" })
    .eq("id", request_row.id);

  if (updateErr) {
    console.error("[upload] DB update error", updateErr);
    // Best-effort cleanup: remove just-uploaded files so list stays consistent
    await service.storage.from(BUCKET).remove(uploaded.map((u) => u.storage_path));
    return NextResponse.json({ error: "Gagal simpan metadata" }, { status: 500 });
  }

  return NextResponse.json({ uploaded, errors });
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });

  const auth = await createSupabaseServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = getServiceClient();
  const { data: client } = await service
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!client) return NextResponse.json({ error: "Client tidak ditemukan" }, { status: 403 });

  const request_row = await resolveRequest(service, id, client.id);
  if (!request_row) return NextResponse.json({ error: "Toko tidak ditemukan" }, { status: 404 });

  // Enforce path belongs to this client+request (defense-in-depth)
  if (!path.startsWith(`${client.id}/${request_row.id}/`)) {
    return NextResponse.json({ error: "Path bukan milik toko ini" }, { status: 403 });
  }

  const existing = Array.isArray(request_row.files_uploaded)
    ? (request_row.files_uploaded as StoredFile[])
    : [];
  const next = existing.filter((f) => f.storage_path !== path);

  const { error: rmErr } = await service.storage.from(BUCKET).remove([path]);
  if (rmErr) console.warn("[upload] storage remove warning:", rmErr.message);

  const { error: updateErr } = await service
    .from("onboarding_requests")
    .update({ files_uploaded: next })
    .eq("id", request_row.id);

  if (updateErr) return NextResponse.json({ error: "Gagal update metadata" }, { status: 500 });

  return NextResponse.json({ ok: true, remaining: next.length });
}
