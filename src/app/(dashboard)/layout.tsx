import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SidebarProvider } from "@/lib/sidebar-context";

// Dashboard pages are all auth-gated and user-specific — skip static
// prerendering so the build doesn't try to instantiate the Supabase
// client without runtime env vars.
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="lg:ml-64 transition-all duration-300">
          <Topbar />
          <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 max-w-[1440px] mx-auto pb-20 lg:pb-10">
            {children}
          </main>
        </div>
        <BottomNav />
      </div>
    </SidebarProvider>
  );
}
