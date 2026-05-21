"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Gift,
  Copy,
  CheckCircle2,
  Loader2,
  Users,
  Coins,
  MessageCircle,
  Clock,
  AlertCircle,
  PauseCircle,
} from "lucide-react";

interface ReferralReward {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  hold_until: string | null;
  level: 1 | 2;
}

interface MyDataResponse {
  ownCode: string | null;
  ownLink: string | null;
  defaultRewardIDR: number;
  rewards: ReferralReward[];
  stats: { totalReferred: number; totalEarnedIDR: number };
}

const REWARD_STATUS_CONFIG = {
  pending: { label: "Menunggu", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  held: { label: "Ditahan", color: "bg-orange-100 text-orange-700", icon: PauseCircle },
  approved: { label: "Disetujui", color: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
  distributed: { label: "Dibayarkan", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  clawed_back: { label: "Dibatalkan", color: "bg-red-100 text-red-700", icon: AlertCircle },
  failed: { label: "Gagal", color: "bg-red-100 text-red-700", icon: AlertCircle },
} as const;

function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function ReferralPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MyDataResponse | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/referral/my-data");
        if (res.status === 401) {
          window.location.href = "/sign-in";
          return;
        }
        if (!res.ok) {
          throw new Error((await res.json()).error ?? `HTTP ${res.status}`);
        }
        const json = (await res.json()) as MyDataResponse;
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Gagal memuat data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const copyToClipboard = async (text: string, type: "code" | "link") => {
    await navigator.clipboard.writeText(text);
    if (type === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const referralCode = data?.ownCode ?? null;
  const referralLink = data?.ownLink ?? null;
  const defaultReward = data?.defaultRewardIDR ?? 100000;
  const totalReferred = data?.stats.totalReferred ?? 0;
  const totalEarned = data?.stats.totalEarnedIDR ?? 0;
  const rewards = data?.rewards ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Program Referral</h1>
        <p className="text-gray-500 mt-1">Ajak teman bergabung dan dapatkan komisi.</p>
      </div>

      {/* Info banner */}
      <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <Gift className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm mb-0.5">Komisi Referral</p>
          <p className="text-gray-600 text-sm">
            Dapatkan komisi{" "}
            <span className="font-bold text-primary">{formatIDR(defaultReward)}</span>{" "}
            setiap kali teman Anda mendaftar dan membayar invoice pertama. Maksimal komisi
            per bulan = harga paket aktif Anda.
          </p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">
            <p className="font-semibold mb-1">Gagal memuat data referral</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* No referral code — provisioning failed */}
      {!loading && !error && !referralCode && (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Referral code sedang diproses
          </h2>
          <p className="text-gray-500 text-sm mb-5 max-w-sm mx-auto">
            Referral code Anda sedang diproses. Coba refresh halaman ini, atau hubungi tim
            kami untuk informasi lebih lanjut.
          </p>
          <a
            href="https://wa.me/6285148416700"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Hubungi Tim Kami
          </a>
        </div>
      )}

      {/* Referral code + link cards */}
      {referralCode && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">
              Kode Referral Anda
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 min-w-0">
                <span className="text-sm font-bold text-primary tracking-widest leading-6 truncate block">
                  {referralCode}
                </span>
              </div>
              <Button
                onClick={() => copyToClipboard(referralCode, "code")}
                variant="outline"
                size="sm"
                className="flex-shrink-0 cursor-pointer border-primary/30 text-primary hover:bg-primary hover:text-white transition-colors"
              >
                {copiedCode ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">
              Link Referral Anda
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 min-w-0">
                <span className="text-sm font-medium text-gray-700 leading-6 truncate block">
                  {referralLink}
                </span>
              </div>
              <Button
                onClick={() => copyToClipboard(referralLink!, "link")}
                variant="outline"
                size="sm"
                className="flex-shrink-0 cursor-pointer border-primary/30 text-primary hover:bg-primary hover:text-white transition-colors"
              >
                {copiedLink ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {referralCode && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs text-gray-500 font-medium">Total Referral</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalReferred}</p>
            <p className="text-xs text-gray-500 mt-1">teman yang sudah bergabung</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
                <Coins className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs text-gray-500 font-medium">Total Komisi</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatIDR(totalEarned)}</p>
            <p className="text-xs text-gray-500 mt-1">total komisi yang diperoleh</p>
          </div>
        </div>
      )}

      {/* Rewards table */}
      {referralCode && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Riwayat Komisi
            </h2>
          </div>

          {rewards.length === 0 ? (
            <div className="p-12 text-center">
              <Gift className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                Belum ada komisi. Mulai bagikan kode referral Anda!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Tanggal</th>
                    <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Jumlah</th>
                    <th className="text-center text-xs font-semibold text-gray-500 px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rewards.map((reward) => {
                    const status = (reward.status as keyof typeof REWARD_STATUS_CONFIG) ?? "pending";
                    const statusCfg = REWARD_STATUS_CONFIG[status] ?? REWARD_STATUS_CONFIG.pending;
                    const StatusIcon = statusCfg.icon;
                    return (
                      <tr key={reward.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5 text-sm text-gray-600">
                          {new Date(reward.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-5 py-3.5 text-sm font-bold text-green-700 text-right tabular-nums">
                          {formatIDR(reward.amount)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusCfg.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusCfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
