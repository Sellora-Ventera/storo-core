"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, RotateCcw, MessageCircle, Home, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function FailedContent() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoice_id");

  const waUrl = () => {
    const msg = encodeURIComponent(
      `Halo Admin Storo.id,\n\n` +
      `Saya mengalami kendala pembayaran.\n` +
      `Invoice ID: ${invoiceId || "N/A"}\n\n` +
      `Mohon bantuannya. Terima kasih.`
    );
    return `https://wa.me/6285157406969?text=${msg}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-primary/5 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle size={48} className="text-red-500" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground">Pembayaran Gagal</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Pembayaran Anda belum berhasil. Tidak ada dana yang terdebit dari akun Anda.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 text-left">
          <p className="font-medium mb-1">Kemungkinan penyebab:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Sesi pembayaran dibatalkan atau habis waktu</li>
            <li>Metode pembayaran ditolak atau saldo tidak cukup</li>
            <li>Koneksi internet terputus saat proses</li>
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          {invoiceId && (
            <Link href={`/dashboard/billing/${invoiceId}`}>
              <Button className="w-full btn-hero gap-2">
                <RotateCcw size={16} /> Coba Bayar Lagi
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            className="w-full gap-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
            onClick={() => window.open(waUrl(), "_blank")}
          >
            <MessageCircle size={16} /> Hubungi Admin via WhatsApp
          </Button>
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full gap-2">
              <Home size={16} /> Kembali ke Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 size={32} className="animate-spin text-muted-foreground" /></div>}>
      <FailedContent />
    </Suspense>
  );
}
