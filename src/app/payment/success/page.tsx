"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { CheckCircle2, ArrowRight, Home, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

interface Invoice {
  id: string;
  amount: number;
  status: string;
  paid_at: string | null;
  metadata: Record<string, unknown> | null;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const invoiceId = searchParams.get("invoice_id");
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    (async () => {
      const [{ data: invoiceData }, { data: sessionData }] = await Promise.all([
        invoiceId
          ? supabase.from("invoices").select("*").eq("id", invoiceId).single()
          : Promise.resolve({ data: null }),
        supabase.auth.getSession(),
      ]);
      if (invoiceData) setInvoice(invoiceData as Invoice);
      const isAuthed = Boolean(sessionData?.session?.user);
      setAuthed(isAuthed);
      if (isAuthed) {
        router.replace("/dashboard");
        return;
      }
      setLoading(false);
    })();
  }, [invoiceId, router]);

  if (loading || authed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-primary/5 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 size={48} className="text-green-600" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground">Pembayaran Berhasil!</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Terima kasih! Pembayaran Anda telah kami terima dan sedang diproses.
          </p>
        </div>

        {invoice && (
          <div className="bg-muted rounded-xl p-4 space-y-2 text-sm text-left">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Dibayar</span>
              <span className="font-bold text-primary">{fmt(invoice.amount)}</span>
            </div>
            {invoice.paid_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Waktu Pembayaran</span>
                <span className="font-medium">
                  {new Date(invoice.paid_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                </span>
              </div>
            )}
            {(() => {
              const method = invoice.metadata?.xendit_payment_method as string | undefined;
              const channel = invoice.metadata?.xendit_payment_channel as string | undefined;
              if (method || channel) return (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metode</span>
                  <span className="font-medium">{method} {channel ? `· ${channel}` : ""}</span>
                </div>
              );
            })()}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 text-left">
          Tim Storo.id akan segera memproses setup toko Anda. Estimasi: <strong>3–5 hari kerja</strong>.
          Kami akan menghubungi Anda via WhatsApp.
        </div>

        <div className="flex flex-col gap-2">
          <Link href="/sign-in">
            <Button className="w-full btn-hero gap-2">
              <Home size={16} /> Login ke Dashboard <ArrowRight size={16} />
            </Button>
          </Link>
          {invoice && (
            <Link href={`/dashboard/billing/${invoice.id}`}>
              <Button variant="outline" className="w-full gap-2">
                Lihat Invoice
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 size={32} className="animate-spin text-muted-foreground" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
