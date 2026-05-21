"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Settings } from "lucide-react";

const DEFAULT_SETTINGS = {
  whatsapp_number: "6285148416700",
  ops_fee_pct: "4",
  pg_fee_pct: "1",
  disbursement_cycle: "monthly",
};

type SettingKey = keyof typeof DEFAULT_SETTINGS;

const FIELDS: {
  key: SettingKey;
  label: string;
  type: "text" | "number" | "select";
  options?: { value: string; label: string }[];
}[] = [
  { key: "whatsapp_number", label: "Nomor WhatsApp", type: "text" },
  { key: "ops_fee_pct", label: "Ops Fee %", type: "number" },
  { key: "pg_fee_pct", label: "PG Fee %", type: "number" },
  {
    key: "disbursement_cycle",
    label: "Siklus Disbursement",
    type: "select",
    options: [
      { value: "weekly", label: "Mingguan" },
      { value: "monthly", label: "Bulanan" },
      { value: "manual", label: "Manual" },
    ],
  },
];

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({ ...DEFAULT_SETTINGS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tableExists, setTableExists] = useState<boolean | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase
      .from("platform_settings")
      .select("key, value")
      .then(({ data, error }) => {
        if (error || !data) {
          setTableExists(false);
        } else {
          setTableExists(true);
          const map: Record<string, string> = { ...DEFAULT_SETTINGS };
          (data as { key: string; value: string }[]).forEach((row) => {
            map[row.key] = row.value;
          });
          setValues(map);
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!tableExists) return;
    setSaving(true);
    setMessage(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const upserts = Object.entries(values).map(([key, value]) => ({ key, value }));
      const { error } = await supabase
        .from("platform_settings")
        .upsert(upserts, { onConflict: "key" });

      if (error) throw new Error(error.message);
      setMessage({ type: "success", text: "Pengaturan berhasil disimpan." });
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal menyimpan pengaturan",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-20 text-foreground/40">Memuat pengaturan...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-foreground/60" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pengaturan</h1>
          <p className="text-foreground/60 text-sm mt-0.5">Konfigurasi platform Storo.id</p>
        </div>
      </div>

      {!tableExists && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
          Pengaturan saat ini menggunakan nilai default. Buat tabel{" "}
          <code className="font-mono bg-yellow-100 px-1 rounded">platform_settings</code> di Supabase
          dengan kolom <code className="font-mono bg-yellow-100 px-1 rounded">key</code> dan{" "}
          <code className="font-mono bg-yellow-100 px-1 rounded">value</code> untuk mengaktifkan
          pengeditan dinamis.
        </div>
      )}

      <div className="bg-background border border-border rounded-xl p-6 space-y-5">
        {FIELDS.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-foreground/70 mb-1">{field.label}</label>
            {field.type === "select" ? (
              <select
                value={values[field.key] ?? DEFAULT_SETTINGS[field.key]}
                onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                disabled={!tableExists}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted disabled:cursor-not-allowed"
              >
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                value={values[field.key] ?? DEFAULT_SETTINGS[field.key]}
                onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                disabled={!tableExists}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted disabled:cursor-not-allowed"
              />
            )}
          </div>
        ))}

        {message && (
          <div
            className={`text-sm px-3 py-2 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!tableExists || saving}
          className="bg-primary hover:bg-primary/90 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </div>
    </div>
  );
}
