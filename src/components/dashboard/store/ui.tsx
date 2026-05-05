import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function StorePageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">{title}</h1>
        {description ? (
          <p className="text-sm text-[#64748B] mt-1">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2 flex-wrap">{actions}</div> : null}
    </div>
  );
}

export function ChipButton({
  href,
  onClick,
  variant = "default",
  icon,
  children,
  type = "button",
  disabled,
}: {
  href?: string;
  onClick?: () => void;
  variant?: "default" | "primary" | "ghost";
  icon?: React.ReactNode;
  children: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const base =
    "inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-full transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    default: "bg-white border border-[#E5E8EF] text-[#0F172A] hover:bg-[#F8F9FC]",
    primary: "bg-primary text-white shadow-sm hover:bg-primary/90",
    ghost: "text-[#64748B] hover:bg-[#EEF2FA]",
  };
  const className = `${base} ${styles[variant]}`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {icon}
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={className}>
      {icon}
      {children}
    </button>
  );
}

export function StoreCard({
  children,
  padded = true,
  className = "",
}: {
  children: React.ReactNode;
  padded?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-[#E5E8EF] rounded-2xl shadow-sm ${
        padded ? "p-5" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function StatusBadge({
  tone = "neutral",
  children,
}: {
  tone?: "success" | "danger" | "warning" | "info" | "neutral";
  children: React.ReactNode;
}) {
  const styles = {
    success: "bg-emerald-50 text-emerald-700",
    danger: "bg-red-50 text-red-700",
    warning: "bg-amber-50 text-amber-700",
    info: "bg-blue-50 text-blue-700",
    neutral: "bg-slate-100 text-slate-700",
  };
  return (
    <span
      className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="size-14 rounded-2xl bg-[#F1F4FA] grid place-items-center mx-auto mb-4">
        <Icon className="size-6 text-[#94A3B8]" />
      </div>
      <h3 className="text-base font-semibold text-[#0F172A] mb-1">{title}</h3>
      {description ? (
        <p className="text-sm text-[#64748B] max-w-md mx-auto mb-4">{description}</p>
      ) : null}
      {action ? (
        <ChipButton href={action.href} variant="primary">
          {action.label}
        </ChipButton>
      ) : null}
    </div>
  );
}

export function formatIDR(amount: number | string | null | undefined): string {
  const n = typeof amount === "number" ? amount : Number(amount ?? 0);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

export function formatDate(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const d = typeof input === "string" ? new Date(input) : input;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
