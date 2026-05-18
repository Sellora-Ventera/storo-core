"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Globe,
  Receipt,
  User,
  HelpCircle,
  LogOut,
  Gift,
  ChevronsUpDown,
  Settings,
  Menu,
  X,
  ShoppingBag,
  MessageCircle,
  Bell,
  Mail,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import storoLogo from "@/assets/storo-logo.png";

type NavItem = {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Akun Saya",
    items: [
      { title: "Beranda", href: "/dashboard", icon: LayoutDashboard, exact: true },
      { title: "Toko Saya", href: "/dashboard/stores", icon: Store },
      { title: "Pesanan", href: "/dashboard/orders", icon: ShoppingBag },
      { title: "Tagihan", href: "/dashboard/billing", icon: Receipt },
      { title: "Domain", href: "/dashboard/domains", icon: Globe },
    ],
  },
  {
    // Cross-store: agregasi semua toko milik client. Tiap item di halaman
    // tujuan ditandai badge nama toko per data row.
    label: "Komunikasi",
    items: [
      { title: "Pesan", href: "/dashboard/messages", icon: MessageCircle },
      { title: "Notifikasi", href: "/dashboard/notifications", icon: Bell },
      { title: "Leads", href: "/dashboard/leads", icon: Mail },
    ],
  },
  {
    label: "Profil & Lainnya",
    items: [
      { title: "Profil", href: "/dashboard/profile", icon: User },
      { title: "Referral", href: "/dashboard/referral", icon: Gift },
      { title: "Bantuan", href: "/dashboard/help", icon: HelpCircle },
    ],
  },
];

function NavLink({
  href,
  exact,
  icon: Icon,
  title,
  pathname,
  onClick,
}: NavItem & { pathname: string; onClick?: () => void }) {
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-full text-sm transition cursor-pointer ${
        active
          ? "bg-primary text-white font-medium shadow-sm shadow-primary/20"
          : "text-[#64748B] hover:bg-[#EEF2FA] hover:text-[#0F172A]"
      }`}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{title}</span>
    </Link>
  );
}

function SidebarBody({
  pathname,
  onItemClick,
  userEmail,
  userName,
  onLogout,
}: {
  pathname: string;
  onItemClick?: () => void;
  userEmail: string | null;
  userName: string | null;
  onLogout: () => void;
}) {
  const initials = (userName ?? userEmail ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-5 py-5 border-b border-[#E5E8EF]">
        <Link href="/dashboard" onClick={onItemClick} className="inline-flex">
          <Image
            src={storoLogo}
            alt="Storo.id"
            height={36}
            width={120}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#94A3B8] font-semibold mb-1.5 px-3">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <NavLink {...item} pathname={pathname} onClick={onItemClick} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-[#E5E8EF]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-full hover:bg-[#EEF2FA] transition text-sm cursor-pointer">
              <span className="size-8 rounded-full bg-gradient-to-br from-primary to-secondary ring-2 ring-white grid place-items-center text-white text-xs font-semibold shrink-0">
                {initials}
              </span>
              <span className="flex-1 text-left min-w-0 leading-tight">
                <span className="block font-medium text-[#0F172A] truncate">
                  {userName ?? userEmail?.split("@")[0] ?? "Seller"}
                </span>
                <span className="block text-[10px] text-[#64748B] truncate">
                  {userEmail ?? "seller@storo.id"}
                </span>
              </span>
              <ChevronsUpDown className="size-4 text-[#94A3B8] shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="cursor-pointer">
                <Settings className="mr-2 size-4" />
                Pengaturan Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onLogout}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 size-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? null);
        setUserName(user.user_metadata?.full_name ?? null);
      }
    });
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <>
      <aside className="hidden lg:block fixed top-0 left-0 h-screen w-64 border-r border-[#E5E8EF] z-30">
        <SidebarBody
          pathname={pathname}
          userEmail={userEmail}
          userName={userName}
          onLogout={handleLogout}
        />
      </aside>

      <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-[#E5E8EF]">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="size-11 rounded-full bg-[#EEF2FA] grid place-items-center cursor-pointer"
            aria-label="Buka menu"
          >
            <Menu className="size-4 text-[#0F172A]" />
          </button>
          <Link href="/dashboard" aria-label="Dashboard" className="flex-1 flex justify-center">
            <Image
              src={storoLogo}
              alt="Storo.id"
              height={32}
              width={100}
              className="h-8 w-auto object-contain"
            />
          </Link>
          <Link
            href="/dashboard/profile"
            aria-label="Profil"
            className="size-11 rounded-full grid place-items-center cursor-pointer"
          >
            <span className="size-9 rounded-full bg-gradient-to-br from-primary to-secondary grid place-items-center text-white text-xs font-semibold">
              {(userName ?? userEmail ?? "U").slice(0, 2).toUpperCase()}
            </span>
          </Link>
        </div>
      </div>

      {mobileOpen ? (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-[#0F172A]/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 size-11 rounded-full bg-[#EEF2FA] grid place-items-center z-10 cursor-pointer"
              aria-label="Tutup menu"
            >
              <X className="size-4 text-[#0F172A]" />
            </button>
            <SidebarBody
              pathname={pathname}
              userEmail={userEmail}
              userName={userName}
              onLogout={handleLogout}
              onItemClick={() => setMobileOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
