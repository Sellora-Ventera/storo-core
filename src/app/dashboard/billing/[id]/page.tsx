"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, Loader2,
  CreditCard, MessageCircle, Copy, Building2, ExternalLink,
} from "lucide-react";

// 2-digit unique code from invoice UUID (consistent per invoice)
const uniqueCode = (id: string): number => {
  const hex = id.replace(/-/g, "").slice(-4);
  return (parseInt(hex, 16) % 90) + 10; // 10–99
};

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("id-ID", { dateStyle: "long" });

const STATUS_CFG = {
  unpaid:    { label: "Menunggu Pembayaran", color: "amber",  Icon: Clock },
  paid:      { label: "Lunas ✅",            color: "green",  Icon: CheckCircle2 },
  overdue:   { label: "Jatuh Tempo",         color: "red",    Icon: XCircle },
  cancelled: { label: "Dibatalkan",          color: "gray",   Icon: XCircle },
} as const;

interface Invoice {
  id: string;
  client_id: string;
  store_id: string | null;
  type: string;
  description: string | null;
  amount: number;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  invoice_url: string | null;
  provider: string | null;
  provider_ref: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface Client {
  full_name: string;
  shopee_store_name: string | null;
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const load = async () => {
    const supabase = createClient();
    const { data: inv } = await supabase
      .from("invoices").select("*").eq("id", id).single();
    if (!inv) { router.push("/dashboard/billing"); return; }
    setInvoice(inv as Invoice);

    const { data: cl } = await supabase
      .from("clients").select("full_name, shopee_store_name").eq("id", inv.client_id).single();
    if (cl) setClient(cl);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handlePayOnline = async () => {
    if (!invoice) return;
    if (invoice.provider === "xendit") {
      const url = invoice.metadata?.xendit_invoice_url as string | undefined;
      if (url) { window.open(url, "_blank"); return; }
    }
    setPaying(true);
    const supabase = createClient();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("xendit-create-invoice", {
        body: { invoice_id: invoice.id },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error || !res.data?.success) throw new Error(res.data?.error || "Gagal membuat pembayaran");
      window.open(res.data.xendit_invoice_url, "_blank");
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setPaying(false);
    }
  };

  const waConfirmUrl = () => {
    if (!invoice) return "#";
    const code = uniqueCode(invoice.id);
    const total = invoice.amount + code;
    const msg = encodeURIComponent(
      `Halo Admin Storo.id,\n\n` +
      `Saya ingin konfirmasi pembayaran webstore:\n\n` +
      `*Nama:* ${client?.full_name || "-"}\n` +
      `*Toko:* ${client?.shopee_store_name || "-"}\n` +
      `*No. Invoice:* ${invoice.provider_ref || invoice.id.slice(0, 8).toUpperCase()}\n` +
      `*Jenis:* ${invoice.description || invoice.type}\n` +
      `*Nominal Transfer:* ${fmt(total)}\n` +
      `*2 Digit Kode Unik:* ${code}\n\n` +
      `Mohon diverifikasi. Terima kasih!`
    );
    return `https://wa.me/6285148416700?text=${msg}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!invoice) return null;

  const code = uniqueCode(invoice.id);
  const totalWithCode = invoice.amount + code;
  const status = STATUS_CFG[invoice.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.unpaid;
  const xenditUrl = invoice.metadata?.xendit_invoice_url as string | undefined;
  const isUnpaid = invoice.status === "unpaid";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/dashboard/billing" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> Kembali ke Tagihan
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-mono">#{invoice.id.slice(0, 8).toUpperCase()}</p>
            <h1 className="text-xl font-bold mt-1">{invoice.description || `Invoice ${invoice.type}`}</h1>
            <p className="text-sm text-muted-foreground mt-1">Dibuat {fmtDate(invoice.created_at)}</p>
          </div>
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
            ${invoice.status === "paid" ? "bg-green-100 text-green-700" :
              invoice.status === "overdue" ? "bg-red-100 text-red-700" :
              invoice.status === "cancelled" ? "bg-gray-100 text-gray-600" :
              "bg-amber-100 text-amber-700"}`}>
            <status.Icon size={12} /> {status.label}
          </span>
        </div>

        <div className="mt-5 pt-5 border-t border-border grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Total Tagihan</p>
            <p className="text-2xl font-bold text-primary mt-0.5">{fmt(invoice.amount)}</p>
          </div>
          {invoice.due_date && (
            <div>
              <p className="text-muted-foreground text-xs">Jatuh Tempo</p>
              <p className="font-medium mt-0.5">{fmtDate(invoice.due_date)}</p>
            </div>
          )}
          {invoice.paid_at && (
            <div>
              <p className="text-muted-foreground text-xs">Dibayar</p>
              <p className="font-medium mt-0.5">{fmtDate(invoice.paid_at)}</p>
            </div>
          )}
          {invoice.provider && (
            <div>
              <p className="text-muted-foreground text-xs">Metode</p>
              <p className="font-medium capitalize mt-0.5">
                {invoice.provider === "xendit" ? "Xendit (Online)" : "Transfer Manual"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Paid confirmation */}
      {invoice.status === "paid" && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-3">
          <CheckCircle2 size={24} className="text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800">Pembayaran Terverifikasi</p>
            <p className="text-sm text-green-700 mt-0.5">
              {invoice.metadata?.xendit_payment_method
                ? `Dibayar via ${invoice.metadata.xendit_payment_method} - ${invoice.metadata.xendit_payment_channel || ""}`
                : "Pembayaran telah dikonfirmasi oleh admin."}
            </p>
            <p className="text-sm text-green-700 mt-1">Tim Storo.id sedang memproses setup toko Anda.</p>
          </div>
        </div>
      )}

      {/* Payment options — only for unpaid */}
      {isUnpaid && (
        <>
          {/* Option A: Xendit */}
          <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-blue-600" />
              <h2 className="font-semibold">Bayar Online via Xendit</h2>
              <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Rekomendasi</span>
            </div>
            <p className="text-sm text-muted-foreground">
              VA Bank, QRIS, E-Wallet (OVO, DANA, ShopeePay), atau Kartu Kredit. Langsung terkonfirmasi otomatis.
            </p>
            {xenditUrl ? (
              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => window.open(xenditUrl, "_blank")}>
                <ExternalLink size={16} className="mr-2" /> Lanjutkan Pembayaran Xendit
              </Button>
            ) : (
              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handlePayOnline} disabled={paying}>
                {paying ? <><Loader2 size={16} className="animate-spin mr-2" /> Memproses...</> : <><CreditCard size={16} className="mr-2" /> Bayar Online via Xendit</>}
              </Button>
            )}
          </div>

          {/* Option B: Manual Transfer */}
          <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-foreground" />
              <h2 className="font-semibold">Transfer Bank Manual</h2>
            </div>

            <div className="bg-muted rounded-xl p-4 space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Nama Bank</p>
                <p className="font-semibold">Bank Mandiri</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Atas Nama</p>
                <p className="font-semibold">PT Ventera Intellix Group</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Nomor Rekening</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="font-mono font-bold text-lg">138002787773</p>
                  <button onClick={() => copy("138002787773", "rekening")}
                    className="p-1 hover:bg-white rounded">
                    <Copy size={14} className={copied === "rekening" ? "text-green-500" : "text-muted-foreground"} />
                  </button>
                  {copied === "rekening" && <span className="text-xs text-green-600">Disalin!</span>}
                </div>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">Nominal Transfer <span className="text-amber-600 font-medium">(wajib sesuai persis)</span></p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xl font-bold text-primary">{fmt(totalWithCode)}</p>
                  <button onClick={() => copy(String(totalWithCode), "nominal")}
                    className="p-1 hover:bg-white rounded">
                    <Copy size={14} className={copied === "nominal" ? "text-green-500" : "text-muted-foreground"} />
                  </button>
                  {copied === "nominal" && <span className="text-xs text-green-600">Disalin!</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tagihan {fmt(invoice.amount)} + kode unik <span className="font-mono font-bold text-foreground">{code}</span>
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              Pastikan nominal transfer <strong>tepat sama</strong> termasuk 2 digit kode unik di akhir agar pembayaran Anda bisa diidentifikasi otomatis.
            </div>

            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => window.open(waConfirmUrl(), "_blank")}
            >
              <MessageCircle size={16} className="mr-2" /> Konfirmasi Pembayaran via WhatsApp
            </Button>
          </div>
        </>
      )}

      {/* Expired / cancelled */}
      {(invoice.status === "overdue" || invoice.status === "cancelled") && (
        <div className="bg-white rounded-2xl border border-border p-6 text-center space-y-3">
          <XCircle size={40} className="text-muted-foreground mx-auto" />
          <p className="font-medium">
            {invoice.status === "overdue" ? "Invoice ini telah jatuh tempo." : "Invoice ini dibatalkan."}
          </p>
          <p className="text-sm text-muted-foreground">Hubungi tim kami jika Anda masih ingin melanjutkan.</p>
          <a href={`https://wa.me/6285148416700?text=${encodeURIComponent("Halo Admin Storo.id, saya ingin melanjutkan pembayaran invoice #" + invoice.id.slice(0,8).toUpperCase())}`}
            target="_blank" rel="noreferrer">
            <Button variant="outline" className="gap-2">
              <MessageCircle size={16} /> Hubungi Admin
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}
