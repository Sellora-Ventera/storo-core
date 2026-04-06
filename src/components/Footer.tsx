import Image from "next/image";
import Link from "next/link";
import storoLogo from "@/assets/storo-logo.png";

const productLinks = [
  { label: "Fitur", href: "/#features" },
  { label: "Harga", href: "/pricing" },
  { label: "Template", href: "/templates" },
  { label: "Cara Kerja", href: "/#how-it-works" },
];

const helpLinks = [
  { label: "FAQ", href: "/#faq", external: false },
  { label: "Kontak", href: "https://wa.me/6285157406969", external: true },
  { label: "Dokumentasi", href: "/docs", external: false },
];

const legalLinks = [
  { label: "Kebijakan Privasi", href: "/privacy" },
  { label: "Syarat & Ketentuan", href: "/terms" },
  { label: "Kebijakan Cookie", href: "/cookies" },
];

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 font-inter">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Column 1 — Brand */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <Image
                src={storoLogo}
                alt="Storo.id"
                height={32}
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed mb-5 max-w-xs">
              Bantu penjual Shopee buka webstore sendiri.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              {/* Facebook */}
              <a
                href="https://facebook.com/storo.id"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-primary/10 text-gray-500 hover:text-primary transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              {/* Instagram */}
              <a
                href="https://instagram.com/storo.id"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-primary/10 text-gray-500 hover:text-primary transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
                </svg>
              </a>
              {/* X / Twitter */}
              <a
                href="https://x.com/storoid"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter)"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-primary/10 text-gray-500 hover:text-primary transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2 — Produk */}
          <div>
            <h3 className="text-gray-800 font-semibold text-sm mb-4">Produk</h3>
            <ul className="space-y-2.5">
              {productLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-gray-500 hover:text-primary text-sm transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Bantuan */}
          <div>
            <h3 className="text-gray-800 font-semibold text-sm mb-4">Bantuan</h3>
            <ul className="space-y-2.5">
              {helpLinks.map(({ label, href, external }) => (
                <li key={label}>
                  {external ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-primary text-sm transition-colors"
                    >
                      {label}
                    </a>
                  ) : (
                    <Link
                      href={href}
                      className="text-gray-500 hover:text-primary text-sm transition-colors"
                    >
                      {label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Legal */}
          <div>
            <h3 className="text-gray-800 font-semibold text-sm mb-4">Legal</h3>
            <ul className="space-y-2.5">
              {legalLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-gray-500 hover:text-primary text-sm transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-400 text-xs text-center sm:text-left">
            © 2025 Storo.id — PT Ventera Inovasi Digital. All rights reserved.
          </p>
          <p className="text-gray-400 text-xs">
            Powered by{" "}
            <a
              href="https://ventera.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              VenteraAI
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
