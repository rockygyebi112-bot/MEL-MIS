import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <Sidebar />
      <div className="lg:ml-64 transition-all duration-300">
        <Topbar />
        <main className="px-6 py-8 max-w-[1600px] mx-auto">{children}</main>
      </div>
    </div>
  );
}
