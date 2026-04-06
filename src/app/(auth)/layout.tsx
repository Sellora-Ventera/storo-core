import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Storo.id — Masuk ke Akun",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 flex items-center justify-center p-4">
      {children}
    </div>
  );
}
