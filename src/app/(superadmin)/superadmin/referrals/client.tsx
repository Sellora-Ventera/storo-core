"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Pencil,
  ThumbsUp,
  Send,
  Undo2,
} from "lucide-react";

interface CodeRow {
  id: string;
  code: string;
  referrer_id: string | null;
  referrer_email: string | null;
  referrer_name: string | null;
  current_uses: number;
  status: string;
  reward_amount: number | null;
  created_at: string;
}

interface RewardRow {
  id: string;
  recipient_id: string;
  amount: number | null;
  currency: string;
  status: string;
  created_at: string;
  hold_until: string | null;
}

interface Props {
  initialCodes: CodeRow[];
  initialRewards: RewardRow[];
  fetchError: string | null;
}

function formatIDR(amount: number | null) {
  if (amount === null) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function ReferralsAdminClient({ initialCodes, initialRewards, fetchError }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"codes" | "rewards">("codes");
  const [editing, setEditing] = useState<{ code: string; value: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  async function postAction(body: Record<string, unknown>): Promise<boolean> {
    setBusy(JSON.stringify(body).slice(0, 50));
    setToast(null);
    try {
      const res = await fetch("/api/superadmin/referrals/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setToast({ type: "err", msg: json.error ?? `HTTP ${res.status}` });
        return false;
      }
      setToast({ type: "ok", msg: "Berhasil — refresh data..." });
      router.refresh();
      return true;
    } catch (err) {
      setToast({
        type: "err",
        msg: err instanceof Error ? err.message : "Network error",
      });
      return false;
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Referral Program</h1>
        <p className="text-gray-500 text-sm mt-1">
          Kelola kode referral merchant + approve/distribute reward.
        </p>
      </div>

      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">
            <p className="font-semibold mb-1">Gagal load data Sharelink</p>
            <p>{fetchError}</p>
            <p className="mt-1 text-xs">
              Cek env var SHARELINK_BASE_URL / SHARELINK_SECRET_KEY (harus pakai key
              tenant Ventera AI / rafli-t1tan di Sharelink).
            </p>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`rounded-xl p-3 flex items-center gap-2 text-sm ${
            toast.type === "ok"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {toast.type === "ok" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {toast.msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab("codes")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "codes"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          Kode ({initialCodes.length})
        </button>
        <button
          onClick={() => setTab("rewards")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "rewards"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          Reward ({initialRewards.length})
        </button>
      </div>

      {tab === "codes" && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Kode</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Referrer</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Uses</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Reward / Referee</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {initialCodes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    Belum ada kode referral.
                  </td>
                </tr>
              )}
              {initialCodes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono text-primary font-bold">{c.code}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {c.referrer_name ?? c.referrer_email ?? c.referrer_id ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">{c.current_uses}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {editing?.code === c.code ? (
                      <div className="flex items-center gap-2 justify-end">
                        <Input
                          type="number"
                          value={editing.value}
                          onChange={(e) =>
                            setEditing({ code: c.code, value: e.target.value })
                          }
                          className="w-32 h-8 text-right"
                          min={0}
                        />
                        <Button
                          size="sm"
                          variant="default"
                          disabled={busy !== null}
                          onClick={async () => {
                            const amount = Number(editing.value);
                            if (!Number.isFinite(amount) || amount < 0) {
                              setToast({ type: "err", msg: "Angka tidak valid" });
                              return;
                            }
                            const ok = await postAction({
                              action: "update_reward_amount",
                              code: c.code,
                              amountIDR: amount,
                            });
                            if (ok) setEditing(null);
                          }}
                        >
                          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : "OK"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditing(null)}
                          disabled={busy !== null}
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 justify-end">
                        <span>{formatIDR(c.reward_amount)}</span>
                        <button
                          onClick={() =>
                            setEditing({
                              code: c.code,
                              value: String(c.reward_amount ?? 100000),
                            })
                          }
                          className="text-gray-400 hover:text-primary cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-gray-400">
                    {new Date(c.created_at).toLocaleDateString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "rewards" && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Tanggal</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Recipient ID</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Amount</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {initialRewards.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    Belum ada reward.
                  </td>
                </tr>
              )}
              {initialRewards.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(r.created_at).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{r.recipient_id}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    {formatIDR(r.amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass(r.status)}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      {r.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy !== null}
                          onClick={() =>
                            postAction({ action: "approve_reward", rewardId: r.id })
                          }
                        >
                          <ThumbsUp className="w-3 h-3 mr-1" /> Approve
                        </Button>
                      )}
                      {r.status === "approved" && (
                        <Button
                          size="sm"
                          variant="default"
                          disabled={busy !== null}
                          onClick={() =>
                            postAction({ action: "distribute_reward", rewardId: r.id })
                          }
                        >
                          <Send className="w-3 h-3 mr-1" /> Distribute
                        </Button>
                      )}
                      {(r.status === "approved" || r.status === "distributed") && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy !== null}
                          onClick={() =>
                            postAction({
                              action: "clawback_reward",
                              rewardId: r.id,
                              reason: "Manual clawback by superadmin",
                            })
                          }
                        >
                          <Undo2 className="w-3 h-3 mr-1" /> Clawback
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function statusClass(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "held":
      return "bg-orange-100 text-orange-700";
    case "approved":
      return "bg-blue-100 text-blue-700";
    case "distributed":
      return "bg-green-100 text-green-700";
    case "clawed_back":
    case "failed":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}
