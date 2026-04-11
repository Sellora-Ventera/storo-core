"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Globe,
  Receipt,
  Package,
  User,
  HelpCircle,
  LogOut,
  Gift,
  Bell,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import storoLogo from "@/assets/storo-logo.png";
import type { LucideIcon } from "lucide-react";

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };

const primaryNav: NavItem[] = [
  { href: "/dashboard", label: "Beranda", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/stores", label: "Toko Saya", icon: Store },
  { href: "/dashboard/products", label: "Produk", icon: Package },
  { href: "/dashboard/domains", label: "Domain", icon: Globe },
  { href: "/dashboard/billing", label: "Tagihan", icon: Receipt },
];

const secondaryNav: NavItem[] = [
  { href: "/dashboard/referral", label: "Referral", icon: Gift },
  { href: "/dashboard/profile", label: "Profil", icon: User },
  { href: "/dashboard/help", label: "Bantuan", icon: HelpCircle },
];

export default function DashboardTopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [initials, setInitials] = useState("U");
  const [unreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const email = user.email ?? "";
        const name = user.user_metadata?.full_name ?? "";
        setUserEmail(email);
        setInitials(
          name
            ? name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()
            : email[0]?.toUpperCase() ?? "U"
        );
      }
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

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
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center flex-shrink-0">
            <Image
              src={storoLogo}
              alt="Storo.id"
              height={32}
              width={100}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 ml-8">
            {primaryNav.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/70 hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Notifications */}
            <button className="relative p-2 text-foreground/60 hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* User dropdown */}
            <div className="relative hidden md:block" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow text-white rounded-full flex items-center justify-center text-sm font-bold select-none flex-shrink-0">
                  {initials}
                </div>
                <span className="text-sm text-foreground/80 font-medium max-w-[140px] truncate hidden lg:block">
                  {userEmail}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-foreground/50 transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-background border border-border rounded-xl shadow-lg py-1.5 z-50">
                  {secondaryNav.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        isActive(href)
                          ? "text-primary bg-primary/5"
                          : "text-foreground/70 hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {label}
                    </Link>
                  ))}
                  <div className="my-1.5 border-t border-border" />
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    Keluar
                  </button>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-foreground/60 hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-4 py-3 space-y-1">
            {[...primaryNav, ...secondaryNav].map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, (exact as boolean | undefined));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/70 hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {label}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-border mt-2">
              <div className="flex items-center gap-3 px-3 py-2 mb-1">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow text-white rounded-full flex items-center justify-center text-sm font-bold select-none">
                  {initials}
                </div>
                <span className="text-sm text-foreground/70 truncate">{userEmail}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors w-full cursor-pointer"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
