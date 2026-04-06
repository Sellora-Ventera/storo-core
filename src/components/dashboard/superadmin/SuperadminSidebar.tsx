"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Store,
  Users,
  Receipt,
  Banknote,
  Tag,
  Layers,
  Settings,
  LogOut,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/superadmin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/superadmin/onboarding", label: "Onboarding Queue", icon: ClipboardList },
  { href: "/superadmin/stores", label: "Semua Store", icon: Store },
  { href: "/superadmin/users", label: "Semua User", icon: Users },
  { href: "/superadmin/billing", label: "Tagihan", icon: Receipt },
  { href: "/superadmin/disbursements", label: "Disbursement", icon: Banknote },
  { href: "/superadmin/pricing", label: "Pricing & Plans", icon: Tag },
  { href: "/superadmin/templates", label: "Template Gallery", icon: Layers },
  { href: "/superadmin/settings", label: "Pengaturan", icon: Settings },
];

export default function SuperadminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  return (
    <aside className="flex flex-col bg-slate-900 w-56 min-h-screen flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center h-14 px-5 border-b border-slate-800 flex-shrink-0">
        <span className="text-white font-bold text-base tracking-tight">⚙ Storo Admin</span>
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
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-2 pb-4 border-t border-slate-800 pt-3">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors w-full cursor-pointer"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
