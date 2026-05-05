"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ChipButton } from "@/components/dashboard/store/ui";

export default function ReviewActions({
  reviewId,
  storeId,
  status,
}: {
  reviewId: string;
  storeId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function update(newStatus: "approved" | "rejected") {
    setBusy(true);
    try {
      const res = await fetch(`/api/store/${storeId}/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Gagal mengubah status");
        return;
      }
      toast.success(newStatus === "approved" ? "Ulasan disetujui" : "Ulasan ditolak");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {status !== "approved" ? (
        <ChipButton
          onClick={() => update("approved")}
          variant="primary"
          disabled={busy}
          icon={busy ? <Loader2 className="size-3 animate-spin" /> : null}
        >
          Setujui
        </ChipButton>
      ) : null}
      {status !== "rejected" ? (
        <ChipButton
          onClick={() => update("rejected")}
          variant="ghost"
          disabled={busy}
          icon={busy ? <Loader2 className="size-3 animate-spin" /> : null}
        >
          Tolak
        </ChipButton>
      ) : null}
    </div>
  );
}
