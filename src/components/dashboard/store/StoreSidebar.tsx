"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FolderTree,
  Users,
  Image as ImageIcon,
  Ticket,
  Truck,
  FileText,
  Settings,
  Gift,
  Crown,
  Star,
  ExternalLink,
  Menu,
  X,
  ChevronsUpDown,
  LogOut,
  Receipt,
  Globe,
  User,
  HelpCircle,
  Wallet,
  ChevronDown,
  ArrowLeft,
  Coins,
} from "lucide-react";
import type { BillingModel } from "@/lib/store/context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import StoreSwitcher, { type StoreSummary } from "./StoreSwitcher";

type NavItem = {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

function getNavGroups(
  basePath: string,
  billingModel: BillingModel
): { label: string; items: NavItem[] }[] {
  const balanceItem: NavItem =
    billingModel === "storo_gateway"
      ? {
          title: "Saldo Penjualan",
          href: `${basePath}/sales-balance`,
          icon: Coins,
        }
      : { title: "Wallet", href: `${basePath}/wallet`, icon: Wallet };

  return [
    {
      label: "Menu Utama",
      items: [
        { title: "Dashboard", href: basePath, icon: LayoutDashboard, exact: true },
        { title: "Produk", href: `${basePath}/products`, icon: Package },
        { title: "Pesanan", href: `${basePath}/orders`, icon: ShoppingCart },
        { title: "Kategori", href: `${basePath}/categories`, icon: FolderTree },
        { title: "Pelanggan", href: `${basePath}/customers`, icon: Users },
      ],
    },
    {
      label: "Konten & Promosi",
      items: [
        { title: "Banner", href: `${basePath}/banners`, icon: ImageIcon },
        { title: "Promo", href: `${basePath}/promos`, icon: Ticket },
        { title: "Loyalitas", href: `${basePath}/loyalty`, icon: Gift },
        { title: "Membership", href: `${basePath}/membership`, icon: Crown },
        { title: "Ulasan", href: `${basePath}/reviews`, icon: Star },
        { title: "Gratis Ongkir", href: `${basePath}/free-shipping`, icon: Truck },
        { title: "Blog", href: `${basePath}/blog`, icon: FileText },
      ],
    },
    {
      label: "Lainnya",
      items: [
        balanceItem,
        { title: "Pengaturan", href: `${basePath}/settings`, icon: Settings },
      ],
    },
    {
      label: "Akun",
      items: [
        { title: "Tagihan", href: "/dashboard/billing", icon: Receipt },
        { title: "Domain", href: "/dashboard/domains", icon: Globe },
        { title: "Profil", href: "/dashboard/profile", icon: User },
        { title: "Referral", href: "/dashboard/referral", icon: Gift },
        { title: "Bantuan", href: "/dashboard/help", icon: HelpCircle },
      ],
    },
  ];
}

function NavLink({
  href,
  exact,
  icon: Icon,
  title,
  pathname,
  onClick,
}: NavItem & { pathname: string; onClick?: () => void }) {
  const hrefBase = href.split("?")[0];
  const active = exact
    ? pathname === hrefBase
    : pathname === hrefBase || pathname.startsWith(hrefBase + "/");
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
  storeId,
  stores,
  storefrontUrl,
  userEmail,
  userName,
  onLogout,
  billingModel,
}: {
  pathname: string;
  onItemClick?: () => void;
  storeId: string;
  stores: StoreSummary[];
  storefrontUrl: string | null;
  userEmail: string | null;
  userName: string | null;
  onLogout: () => void;
  billingModel: BillingModel;
}) {
  const basePath = `/dashboard/manage-store/${storeId}`;
  const navGroups = getNavGroups(basePath, billingModel);
  const initials = (userName ?? userEmail ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isItemActive = (item: NavItem) => {
    const base = item.href.split("?")[0];
    return item.exact
      ? pathname === base
      : pathname === base || pathname.startsWith(base + "/");
  };

  // Auto-open the group that contains the active route
  const [openGroup, setOpenGroup] = useState<string>(() => {
    const active = navGroups.find((g) => g.items.some(isItemActive));
    return active?.label ?? navGroups[0].label;
  });

  // Re-sync when pathname changes (e.g. programmatic navigation)
  useEffect(() => {
    const active = navGroups.find((g) => g.items.some(isItemActive));
    if (active) setOpenGroup(active.label);
  // navGroups is derived from basePath which is stable per render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-3 pt-4 pb-3 border-b border-[#E5E8EF]">
        <StoreSwitcher currentStoreId={storeId} stores={stores} />
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {navGroups.map((group) => {
          const isOpen = openGroup === group.label;
          return (
            <div key={group.label}>
              <button
                type="button"
                onClick={() => setOpenGroup(isOpen ? "" : group.label)}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-[#F8FAFC] transition cursor-pointer group"
              >
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#94A3B8] font-semibold group-hover:text-[#64748B] transition">
                  {group.label}
                </span>
                <ChevronDown
                  className={`size-3.5 text-[#94A3B8] transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
                />
              </button>
              {isOpen && (
                <ul className="space-y-0.5 mt-0.5 mb-1">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <NavLink {...item} pathname={pathname} onClick={onItemClick} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}

        <div className="pt-3 border-t border-[#E5E8EF] mx-0 space-y-0.5">
          <Link
            href="/dashboard"
            onClick={onItemClick}
            className="flex items-center gap-2.5 px-3 py-2 rounded-full text-sm text-[#64748B] hover:bg-[#EEF2FA] hover:text-[#0F172A] transition cursor-pointer"
          >
            <ArrowLeft className="size-4 shrink-0" />
            <span className="flex-1 truncate">Kembali ke Dashboard Utama</span>
          </Link>
          {storefrontUrl ? (
            <a
              href={storefrontUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onItemClick}
              className="flex items-center gap-2.5 px-3 py-2 rounded-full text-sm text-[#64748B] hover:bg-[#FDEBD7] hover:text-[#A55A0E] transition cursor-pointer"
            >
              <ExternalLink className="size-4 shrink-0" />
              <span className="flex-1 truncate">Lihat Storefront</span>
            </a>
          ) : null}
        </div>
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
              <Link href={`${basePath}/settings`} className="cursor-pointer">
                <Settings className="mr-2 size-4" />
                Pengaturan Toko
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="cursor-pointer">
                <Settings className="mr-2 size-4" />
                Profil Akun
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

export default function StoreSidebar({
  storeId,
  stores,
  storefrontUrl,
  billingModel,
}: {
  storeId: string;
  stores: StoreSummary[];
  storefrontUrl?: string | null;
  billingModel: BillingModel;
}) {
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

  const currentStore = stores.find((s) => s.id === storeId);

  return (
    <>
      <aside className="hidden lg:block fixed top-0 left-0 h-screen w-64 border-r border-[#E5E8EF] z-30 bg-white">
        <SidebarBody
          pathname={pathname}
          storeId={storeId}
          stores={stores}
          storefrontUrl={storefrontUrl ?? null}
          userEmail={userEmail}
          userName={userName}
          onLogout={handleLogout}
          billingModel={billingModel}
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
          <span className="flex-1 text-center text-sm font-medium text-[#0F172A] truncate">
            {currentStore?.name ?? "Toko"}
          </span>
          <Link
            href={`/dashboard/manage-store/${storeId}/settings`}
            aria-label="Pengaturan"
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
              storeId={storeId}
              stores={stores}
              storefrontUrl={storefrontUrl ?? null}
              userEmail={userEmail}
              userName={userName}
              onLogout={handleLogout}
              billingModel={billingModel}
              onItemClick={() => setMobileOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
