"use client";

import { useRouter } from "next/navigation";
import { Users, ChevronRight } from "lucide-react";
import {
  GOAL_STATUS_LABEL,
  GOAL_STATUS_CLASSES,
} from "@/lib/performance-utils";
import type { DepartmentSummary } from "@/lib/types";

interface DepartmentCardProps {
  dept: DepartmentSummary;
}

export function DepartmentCard({ dept }: DepartmentCardProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/performance/${dept.id}`)}
      className="w-full text-left rounded-xl border border-border/60 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200 active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{dept.name}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Users className="size-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {dept.staff_count} staff
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              GOAL_STATUS_CLASSES[dept.status]
            }`}
          >
            {GOAL_STATUS_LABEL[dept.status]}
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Progress</span>
          <span className="font-semibold">{dept.progress_pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-[#5BBF3A] transition-all duration-500"
            style={{ width: `${dept.progress_pct}%` }}
          />
        </div>
      </div>

      <div className="flex gap-4 mt-3 text-xs">
        <span className="text-green-600 font-medium">✓ {dept.done_count} done</span>
        <span className="text-muted-foreground">· {dept.pending_count} pending</span>
        {dept.overdue_count > 0 && (
          <span className="text-red-600 font-medium">
            ⚠ {dept.overdue_count} overdue
          </span>
        )}
      </div>
    </button>
  );
}
