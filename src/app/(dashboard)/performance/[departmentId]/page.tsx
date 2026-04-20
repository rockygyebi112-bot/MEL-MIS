"use client";

import { use } from "react";
import { useUser } from "@/hooks/use-user";
import { EdDrilldown } from "@/components/performance/ed-drilldown";
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

  if (user.role?.name === "Admin") {
    return (
      <div className="mx-auto max-w-[560px]">
        <EdDrilldown departmentId={departmentId} />
      </div>
    );
  }

  return <ManagerDashboard departmentId={departmentId} />;
}
