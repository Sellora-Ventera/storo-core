"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  X,
  Download,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const SHOPEE_FILES = [
  "Mass Update Basic Info",
  "Mass Update Sales Info",
  "Mass Update Shipping Info",
  "Mass Update Media Info",
  "Mass Update DTS Info",
  "Mass Republish Items",
];

const MAX_FILE_MB = 50;
const MAX_FILES = 6;

export type StoredFile = {
  name: string;
  size: number;
  storage_path: string;
  uploaded_at: string;
  uploaded_by?: string;
};

type FileWithUrl = StoredFile & { signedUrl: string | null };

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function isAllowed(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ["xlsx", "xls", "csv"].includes(ext);
}

export default function UploadShopeeFiles({
  storeRouteId,
  initialFiles,
}: {
  storeRouteId: string;
  initialFiles: FileWithUrl[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<FileWithUrl[]>(initialFiles);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function addPending(picked: FileList | File[] | null) {
    if (!picked) return;
    const list = Array.from(picked);

    const filtered: File[] = [];
    for (const f of list) {
      if (!isAllowed(f)) {
        toast.error(`${f.name}: hanya .xlsx, .xls, .csv yang diizinkan`);
        continue;
      }
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        toast.error(`${f.name}: maksimal ${MAX_FILE_MB} MB`);
        continue;
      }
      filtered.push(f);
    }

    const next = [...pending, ...filtered].slice(0, MAX_FILES);
    if (next.length < pending.length + filtered.length) {
      toast.warning(`Maksimal ${MAX_FILES} file per upload`);
    }
    setPending(next);
  }

  function removePending(idx: number) {
    setPending(pending.filter((_, i) => i !== idx));
  }

  async function handleUpload() {
    if (pending.length === 0) return;
    setUploading(true);

    const form = new FormData();
    for (const f of pending) form.append("files", f);

    try {
      const res = await fetch(`/api/dashboard/stores/${storeRouteId}/upload`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Gagal upload");
        if (Array.isArray(data.errors)) {
          for (const e of data.errors) toast.error(`${e.name}: ${e.error}`);
        }
        return;
      }

      const okCount = Array.isArray(data.uploaded) ? data.uploaded.length : 0;
      const errCount = Array.isArray(data.errors) ? data.errors.length : 0;
      if (okCount > 0) toast.success(`${okCount} file berhasil di-upload`);
      if (errCount > 0) {
        for (const e of data.errors) toast.error(`${e.name}: ${e.error}`);
      }

      setPending([]);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Tidak bisa terhubung ke server");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(path: string, name: string) {
    if (!confirm(`Hapus file "${name}"?`)) return;
    try {
      const res = await fetch(
        `/api/dashboard/stores/${storeRouteId}/upload?path=${encodeURIComponent(path)}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal hapus");
        return;
      }
      setFiles(files.filter((f) => f.storage_path !== path));
      toast.success("File dihapus");
      router.refresh();
    } catch {
      toast.error("Tidak bisa terhubung ke server");
    }
  }

  const uploadedNames = new Set(files.map((f) => f.name.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Upload File Baru
        </h2>

        <label
          htmlFor="shopee-file-input"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            addPending(e.dataTransfer.files);
          }}
          className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".xlsx,.xls,.csv"
            id="shopee-file-input"
            className="hidden"
            onChange={(e) => addPending(e.target.files)}
          />
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="font-medium text-gray-900 text-sm">
            Drag &amp; drop atau klik untuk pilih file
          </p>
          <p className="text-xs text-gray-500 mt-1">
            .xlsx, .xls, .csv · maks {MAX_FILE_MB} MB · sampai {MAX_FILES} file
          </p>
        </label>

        {pending.length > 0 && (
          <ul className="space-y-2">
            {pending.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-sm"
              >
                <FileSpreadsheet className="w-4 h-4 text-primary shrink-0" />
                <span className="flex-1 truncate font-medium text-gray-800">{f.name}</span>
                <span className="text-xs text-gray-500 shrink-0">{fmtSize(f.size)}</span>
                <button
                  type="button"
                  onClick={() => removePending(i)}
                  disabled={uploading}
                  className="p-1 rounded hover:bg-gray-200 cursor-pointer disabled:opacity-50"
                  aria-label={`Hapus ${f.name}`}
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
          <p className="text-xs font-semibold text-blue-900 mb-1.5">
            6 file yang dibutuhkan dari Shopee Seller Center:
          </p>
          <ul className="space-y-0.5">
            {SHOPEE_FILES.map((name) => {
              const done = [...uploadedNames].some((n) =>
                n.includes(name.toLowerCase()),
              );
              return (
                <li
                  key={name}
                  className={`text-xs flex items-center gap-1.5 ${
                    done ? "text-green-700" : "text-blue-800"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 inline-block rounded-full border border-blue-300 shrink-0" />
                  )}
                  {name}
                </li>
              );
            })}
          </ul>
        </div>

        <Button
          onClick={handleUpload}
          disabled={uploading || pending.length === 0}
          className="w-full btn-hero cursor-pointer disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Mengupload...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload {pending.length > 0 ? `${pending.length} file` : ""}
            </>
          )}
        </Button>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          File yang Sudah Di-upload ({files.length})
        </h2>

        {files.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            Belum ada file ter-upload untuk toko ini.
          </div>
        ) : (
          <ul className="space-y-2">
            {files.map((f) => (
              <li
                key={f.storage_path}
                className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 bg-primary/5 rounded-lg flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                  <p className="text-xs text-gray-400">
                    {fmtSize(f.size)} ·{" "}
                    {new Date(f.uploaded_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {f.signedUrl && (
                  <a
                    href={f.signedUrl}
                    download={f.name}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 cursor-pointer shrink-0 px-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(f.storage_path, f.name)}
                  className="p-1.5 rounded hover:bg-red-50 cursor-pointer shrink-0"
                  aria-label={`Hapus ${f.name}`}
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
