"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { EdHome } from "@/components/performance/ed-home";

const Skeleton = () => (
  <div className="-mx-4 -my-4 sm:-mx-6 sm:-my-6 min-h-screen bg-[#0B0F17] px-4 py-5 sm:px-6 sm:py-6">
    <div className="mx-auto max-w-[560px] space-y-4">
      <div className="h-8 w-48 rounded bg-[#151B27] animate-pulse" />
      <div className="h-40 rounded-3xl bg-[#151B27] animate-pulse" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[72px] rounded-2xl bg-[#151B27] animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);

export default function PerformancePage() {
  const { user, loading } = useUser();
  const router = useRouter();
  // True once we've confirmed the user is Admin and should see the ED view
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (loading || !user) return;

    async function checkRole() {
      const supabase = createClient();

      // Admin stays on this page (ED view)
      if (user?.role?.name === "Admin") {
        setIsAdmin(true);
        return;
      }

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

  // Show skeleton until we know the role
  if (loading || !isAdmin) return <Skeleton />;

  return (
    <div className="-mx-4 -my-4 sm:-mx-6 sm:-my-6 min-h-screen bg-[#0B0F17] px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[560px]">
        <EdHome />
      </div>
    </div>
  );
}
