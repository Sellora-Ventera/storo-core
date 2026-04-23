"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Globe,
  Receipt,
  User,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Gift,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import storoLogo from "@/assets/storo-logo.png";

const navItems = [
  { href: "/dashboard", label: "Beranda", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/stores", label: "Toko Saya", icon: Store },
  { href: "/dashboard/domains", label: "Domain", icon: Globe },
  { href: "/dashboard/billing", label: "Tagihan", icon: Receipt },
  { href: "/dashboard/referral", label: "Referral", icon: Gift },
  { href: "/dashboard/profile", label: "Profil", icon: User },
  { href: "/dashboard/help", label: "Bantuan", icon: HelpCircle },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
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
    <aside
      className={`relative flex flex-col bg-white border-r border-gray-100 transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      } min-h-screen`}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-gray-100 flex-shrink-0">
        {!collapsed && (
          <Image
            src={storoLogo}
            alt="Storo.id"
            height={32}
            width={100}
            className="h-8 w-auto object-contain"
          />
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-5 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow cursor-pointer z-10 transition-shadow"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-gray-500" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-gray-500" />
        )}
      </button>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer group ${
                active
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
              title={collapsed ? label : undefined}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${
                  active ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                }`}
              />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-2 pb-4 border-t border-gray-100 pt-3">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full cursor-pointer"
          title={collapsed ? "Keluar" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  );
}
