"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import storoLogo from "@/assets/storo-logo.png";

const navigation = [
  { name: "Beranda", href: "/" },
  { name: "Cara Kerja", href: "/#how-it-works" },
  { name: "Template", href: "/templates" },
  { name: "Harga", href: "/#pricing" },
  { name: "Blog", href: "/blog" },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return false;
    return pathname.startsWith(href);
  };

  const handleHashNav = (href: string) => {
    setIsMenuOpen(false);
    if (!href.startsWith("/#")) return;
    const id = href.substring(2);
    if (pathname !== "/") {
      window.location.href = href;
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src={storoLogo}
              alt="Storo.id"
              className="h-9 w-auto object-contain"
              height={36}
              width={120}
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-7">
            {navigation.map((item) =>
              item.href.startsWith("/#") ? (
                <button
                  key={item.name}
                  onClick={() => handleHashNav(item.href)}
                  className={`text-sm font-medium transition-colors duration-150 cursor-pointer ${
                    isActive(item.href)
                      ? "text-primary"
                      : "text-foreground hover:text-primary"
                  }`}
                >
                  {item.name}
                </button>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-sm font-medium transition-colors duration-150 ${
                    isActive(item.href)
                      ? "text-primary"
                      : "text-foreground hover:text-primary"
                  }`}
                >
                  {item.name}
                </Link>
              )
            )}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="font-medium cursor-pointer"
            >
              <Link href="/sign-in">Masuk</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="btn-hero font-semibold cursor-pointer"
            >
              <Link href="/sign-up">Daftar Sekarang</Link>
            </Button>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-foreground hover:text-primary transition-colors cursor-pointer"
            aria-label={isMenuOpen ? "Tutup menu" : "Buka menu"}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border pb-4">
            <nav className="pt-3 space-y-1">
              {navigation.map((item) =>
                item.href.startsWith("/#") ? (
                  <button
                    key={item.name}
                    onClick={() => handleHashNav(item.href)}
                    className="block w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-foreground hover:text-primary hover:bg-muted transition-colors cursor-pointer"
                  >
                    {item.name}
                  </button>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "text-primary bg-muted"
                        : "text-foreground hover:text-primary hover:bg-muted"
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              )}
            </nav>
            <div className="mt-4 px-3 flex flex-col gap-2">
              <Button
                variant="outline"
                asChild
                className="w-full cursor-pointer"
              >
                <Link href="/sign-in">Masuk</Link>
              </Button>
              <Button asChild className="w-full btn-hero cursor-pointer">
                <Link href="/sign-up">Daftar Sekarang</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
