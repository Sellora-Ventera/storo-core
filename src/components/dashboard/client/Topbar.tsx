"use client";

import { useState, useEffect } from "react";
import { Bell, Menu } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface TopbarProps {
  onMobileMenuToggle?: () => void;
}

export default function Topbar({ onMobileMenuToggle }: TopbarProps) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [initials, setInitials] = useState("U");
  const [unreadCount] = useState(0); // TODO: fetch from client_notifications

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const email = user.email ?? "";
        const name = user.user_metadata?.full_name ?? "";
        setUserEmail(email);
        setInitials(
          name
            ? name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
            : email[0]?.toUpperCase() ?? "U"
        );
      }
    });
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      {/* Mobile menu toggle */}
      <button
        onClick={onMobileMenuToggle}
        className="md:hidden p-2 text-gray-500 hover:text-gray-900 cursor-pointer"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow text-white rounded-full flex items-center justify-center text-sm font-bold select-none">
            {initials}
          </div>
          <span className="hidden md:block text-sm text-gray-700 font-medium max-w-[160px] truncate">
            {userEmail}
          </span>
        </div>
      </div>
    </header>
  );
}
