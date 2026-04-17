"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { EdDashboard } from "@/components/performance/ed-dashboard";

export default function PerformancePage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;

    async function checkRole() {
      const supabase = createClient();

      // Admin stays on this page (ED view)
      if (user?.role?.name === "Admin") return;

      // Check if user is a department manager
      const { data: ud } = await supabase
        .from("user_departments")
        .select("department_id, is_manager")
        .eq("user_id", user!.id)
        .single();

      if (ud?.is_manager) {
        router.replace(`/performance/${ud.department_id}`);
      } else {
        router.replace("/performance/me");
      }
    }

    checkRole();
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (user?.role?.name !== "Admin") return null;

  return <EdDashboard />;
}
