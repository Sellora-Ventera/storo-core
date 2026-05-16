import AccountSidebar from "@/components/dashboard/account/AccountSidebar";

export default function AccountDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AccountSidebar />
      <main className="lg:pl-64">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
