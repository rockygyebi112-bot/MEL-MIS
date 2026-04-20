"use client";

import { use } from "react";
import { useUser } from "@/hooks/use-user";
import { ManagerDashboard } from "@/components/performance/manager-dashboard";

interface Props {
  params: Promise<{ departmentId: string }>;
}

export default function DepartmentPerformancePage({ params }: Props) {
  const { departmentId } = use(params);
  const { user, loading } = useUser();

  if (loading || !user) {
    return (
      <div className="space-y-3">
        <div className="h-10 rounded-xl bg-muted animate-pulse" />
        <div className="h-40 rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  // Admins get the same full-featured manager view so they can manage any
  // department's goals, activities, and proof-of-work submissions.
  return (
    <div className="mx-auto max-w-[560px] lg:max-w-6xl">
      <ManagerDashboard departmentId={departmentId} />
    </div>
  );
}
