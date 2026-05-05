"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { ChipButton } from "@/components/dashboard/store/ui";

type Props =
  | { storeId: string; mode: "markAll" }
  | { storeId: string; mode: "single"; id: string };

export default function NotificationActions(props: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function markOne() {
    if (props.mode !== "single") return;
    setBusy(true);
    try {
      const res = await fetch(`/api/store/${props.storeId}/notifications/${props.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: true }),
      });
      if (!res.ok) {
        toast.error("Gagal tandai");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function markAll() {
    setBusy(true);
    try {
      const res = await fetch(`/api/store/${props.storeId}/notifications/mark-all`, {
        method: "POST",
      });
      if (!res.ok) {
        toast.error("Gagal tandai semua");
        return;
      }
      toast.success("Semua notifikasi ditandai dibaca");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (props.mode === "markAll") {
    return (
      <ChipButton
        onClick={markAll}
        variant="default"
        icon={busy ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
        disabled={busy}
      >
        Tandai Semua Dibaca
      </ChipButton>
    );
  }

  return (
    <button
      type="button"
      onClick={markOne}
      disabled={busy}
      className="size-8 rounded-full hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 grid place-items-center cursor-pointer disabled:opacity-50"
      aria-label="Tandai dibaca"
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
    </button>
  );
}
