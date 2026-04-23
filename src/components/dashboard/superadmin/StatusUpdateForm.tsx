"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, CheckCircle2, AlertCircle } from "lucide-react";

type Status = "pending" | "reviewing" | "in_progress" | "live" | "rejected";

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "reviewing", label: "Reviewing" },
  { value: "in_progress", label: "In Progress" },
  { value: "live", label: "Live" },
  { value: "rejected", label: "Rejected" },
];

interface StatusUpdateFormProps {
  storeId: string;
  currentStatus: string;
  currentStatusNote: string;
  currentAssignedEngineer: string;
  currentStoreUrl: string;
}

export default function StatusUpdateForm({
  storeId,
  currentStatus,
  currentStatusNote,
  currentAssignedEngineer,
  currentStoreUrl,
}: StatusUpdateFormProps) {
  const [status, setStatus] = useState<Status>((currentStatus as Status) || "pending");
  const [statusNote, setStatusNote] = useState(currentStatusNote || "");
  const [assignedEngineer, setAssignedEngineer] = useState(currentAssignedEngineer || "");
  const [storeUrl, setStoreUrl] = useState(currentStoreUrl || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  const requiresStoreUrl = status === "live";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/superadmin/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          status_note: statusNote,
          assigned_engineer: assignedEngineer,
          store_url: storeUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan perubahan");
      }

      setMessage({ type: "success", text: "Perubahan berhasil disimpan." });
      router.refresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
            Engineer Ditugaskan
          </label>
          <input
            type="text"
            value={assignedEngineer}
            onChange={(e) => setAssignedEngineer(e.target.value)}
            placeholder="Nama engineer (opsional)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
          URL Toko Live{" "}
          {requiresStoreUrl && <span className="text-red-500 normal-case">*</span>}
        </label>
        <input
          type="url"
          value={storeUrl}
          onChange={(e) => setStoreUrl(e.target.value)}
          placeholder="https://namatoko.storo.id"
          required={requiresStoreUrl}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {requiresStoreUrl && !storeUrl && (
          <p className="text-xs text-red-500 mt-1">
            URL wajib diisi saat status = Live (akan dikirim ke notifikasi klien).
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
          Catatan untuk Klien
        </label>
        <textarea
          value={statusNote}
          onChange={(e) => setStatusNote(e.target.value)}
          rows={4}
          placeholder="Catatan yang akan dilihat klien di dashboard mereka..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">
          Status Rejected? Tuliskan detail data yang perlu diperbaiki di sini.
        </p>
      </div>

      {message && (
        <div
          className={`text-sm px-3 py-2.5 rounded-lg flex items-start gap-2 ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Menyimpan...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Simpan Perubahan
          </>
        )}
      </button>
    </form>
  );
}
