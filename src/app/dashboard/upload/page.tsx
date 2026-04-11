"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle2, FileSpreadsheet, Store } from "lucide-react";
import { toast } from "sonner";

const SHOPEE_FILES = [
  "Mass Update Basic Info",
  "Mass Update Sales Info",
  "Mass Update Shipping Info",
  "Mass Update Media Info",
  "Mass Update DTS Info",
  "Mass Republish Items",
];

type OnboardingRequest = {
  id: string;
  requested_slug: string;
  status: string;
  files_uploaded: Array<{ name: string; uploaded_at: string }>;
};

export default function UploadPage() {
  const [stores, setStores] = useState<OnboardingRequest[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: client } = await supabase.from("clients").select("id").eq("user_id", user.id).single();
      if (!client) return;
      setClientId(client.id);
      const { data: req } = await supabase
        .from("onboarding_requests")
        .select("id, requested_slug, status, files_uploaded")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false });
      if (req) {
        setStores(req as OnboardingRequest[]);
        if (req.length > 0) setSelectedStore(req[0].id);
      }
    })();
  }, []);

  const handleUpload = async () => {
    if (!clientId || !selectedStore || files.length === 0) return;
    setUploading(true);
    const supabase = createClient();

    const uploaded = [];
    for (const file of files) {
      const path = `shopee-uploads/${clientId}/${Date.now()}/${file.name}`;
      const { error } = await supabase.storage.from("shopee-uploads").upload(path, file);
      if (!error) uploaded.push({ name: file.name, storage_path: path, uploaded_at: new Date().toISOString() });
    }

    const store = stores.find((s) => s.id === selectedStore);
    const allFiles = [...(store?.files_uploaded ?? []), ...uploaded];

    const { error } = await supabase.from("onboarding_requests")
      .update({ files_uploaded: allFiles }).eq("id", selectedStore);

    if (error) { toast.error("Gagal upload file"); }
    else {
      toast.success(`${uploaded.length} file berhasil diupload!`);
      setFiles([]);
      const { data: req } = await supabase
        .from("onboarding_requests")
        .select("id, requested_slug, status, files_uploaded")
        .eq("client_id", clientId).order("created_at", { ascending: false });
      if (req) setStores(req as OnboardingRequest[]);
    }
    setUploading(false);
  };

  const currentStore = stores.find((s) => s.id === selectedStore);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Upload File Shopee</h1>
        <p className="text-muted-foreground text-sm">Upload file Excel dari Shopee Seller Center untuk import atau update produk.</p>
      </div>

      {stores.length > 1 && (
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-sm font-medium mb-2">Pilih toko:</p>
          <div className="flex flex-wrap gap-2">
            {stores.map((s) => (
              <button key={s.id} onClick={() => setSelectedStore(s.id)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors flex items-center gap-2
                  ${selectedStore === s.id ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50"}`}>
                <Store size={14} /> {s.requested_slug}.storo.id
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-border p-6 space-y-4">
        <h2 className="font-semibold">Upload File Baru</h2>
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <input type="file" multiple accept=".xlsx,.xls,.csv"
            onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 6))}
            className="hidden" id="file-upload" />
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-3">
            <Upload size={32} className="text-muted-foreground" />
            <div>
              <p className="font-medium">Drag & drop atau klik untuk pilih file</p>
              <p className="text-sm text-muted-foreground">Mendukung .xlsx, .xls, .csv (max 6 file)</p>
            </div>
          </label>
        </div>

        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-green-700">
                <FileSpreadsheet size={16} /> {f.name}
                <span className="text-xs text-muted-foreground ml-auto">{(f.size / 1024).toFixed(1)} KB</span>
              </li>
            ))}
          </ul>
        )}

        <div className="bg-muted rounded-lg p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">6 file yang diperlukan dari Shopee:</p>
          <ul className="space-y-0.5">
            {SHOPEE_FILES.map((f) => (
              <li key={f} className="text-xs flex items-center gap-1.5 text-muted-foreground"><span>○</span> {f}</li>
            ))}
          </ul>
        </div>

        <Button onClick={handleUpload} disabled={uploading || files.length === 0} className="btn-hero w-full">
          {uploading ? "Mengupload..." : `Upload ${files.length || ""} File`}
        </Button>
      </div>

      {currentStore && currentStore.files_uploaded.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-6 space-y-3">
          <h2 className="font-semibold">Riwayat Upload</h2>
          <ul className="space-y-2">
            {currentStore.files_uploaded.map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                <span className="flex-1 truncate">{f.name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(f.uploaded_at).toLocaleDateString("id-ID", { dateStyle: "short" })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
