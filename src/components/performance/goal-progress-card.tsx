"use client";

import type { GoalWithActivities } from "@/lib/types";

interface GoalProgressCardProps {
  goal: GoalWithActivities;
}

const ACCENT: Record<
  GoalWithActivities["status"],
  { text: string; bar: string; border: string }
> = {
  on_track: {
    text: "text-green-700 dark:text-[#4ADE80]",
    bar: "bg-[#22C55E]",
    border: "",
  },
  at_risk: {
    text: "text-amber-700 dark:text-[#FBBF24]",
    bar: "bg-[#F59E0B]",
    border: "border border-amber-200 dark:border-[#F59E0B33]",
  },
  behind: {
    text: "text-red-700 dark:text-[#FCA5A5]",
    bar: "bg-[#DC2626]",
    border: "border border-red-200 dark:border-[#DC262633]",
  },
};

export function GoalProgressCard({ goal }: GoalProgressCardProps) {
  const a = ACCENT[goal.status];

  return (
    <div className={`rounded-2xl bg-card p-3.5 ${a.border}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[13px] font-semibold text-foreground truncate">
          {goal.title}
        </div>
        <div className={`text-xs font-bold ${a.text}`}>{goal.progress_pct}%</div>
      </div>
      <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${a.bar}`}
          style={{ width: `${goal.progress_pct}%` }}
        />
      </div>
    </div>
  );
}
