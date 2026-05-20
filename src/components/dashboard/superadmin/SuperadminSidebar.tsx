"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Store,
  Users,
  Receipt,
  Banknote,
  Tag,
  Layers,
  Gift,
  Settings,
  LogOut,
} from "lucide-react";
import storoLogo from "@/assets/storo-logo.png";

const navItems = [
  { href: "/superadmin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/superadmin/onboarding", label: "Onboarding Queue", icon: ClipboardList },
  { href: "/superadmin/stores", label: "Semua Store", icon: Store },
  { href: "/superadmin/users", label: "Semua User", icon: Users },
  { href: "/superadmin/billing", label: "Tagihan", icon: Receipt },
  { href: "/superadmin/disbursements", label: "Disbursement", icon: Banknote },
  { href: "/superadmin/pricing", label: "Pricing & Plans", icon: Tag },
  { href: "/superadmin/templates", label: "Template Gallery", icon: Layers },
  { href: "/superadmin/referrals", label: "Referral Program", icon: Gift },
  { href: "/superadmin/settings", label: "Pengaturan", icon: Settings },
];

export default function SuperadminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    // Full-page nav to /auth/sso/logout — clears Supabase session AND fires
    // RP-initiated logout at Ventera SSO (falls back to "/" if SSO is not
    // configured).
    window.location.href = "/auth/sso/logout";
  };

  return (
    <aside className="flex flex-col bg-background border-r border-border w-56 min-h-screen flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center h-16 px-5 border-b border-border flex-shrink-0">
        <Image
          src={storoLogo}
          alt="Storo.id"
          height={28}
          width={90}
          className="h-7 w-auto object-contain"
          priority
        />
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/70 hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-2 pb-4 border-t border-border pt-3">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/70 hover:text-red-500 hover:bg-red-50 transition-colors w-full cursor-pointer"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
