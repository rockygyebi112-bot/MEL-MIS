import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64 transition-all duration-300">
        <Topbar />
        <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 max-w-[1440px] mx-auto">{children}</main>
      </div>
    </div>
  );
}
