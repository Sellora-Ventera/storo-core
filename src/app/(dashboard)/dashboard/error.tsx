"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-5xl mx-auto flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
        <AlertCircle className="w-7 h-7 text-red-500" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Terjadi Kesalahan</h2>
      <p className="text-gray-500 text-sm mb-6 max-w-sm">
        Gagal memuat halaman ini. Coba muat ulang atau hubungi tim kami jika masalah berlanjut.
      </p>
      <Button onClick={reset} className="cursor-pointer">
        Coba Lagi
      </Button>
    </div>
  );
}
