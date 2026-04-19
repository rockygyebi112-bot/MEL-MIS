"use client";

import type { GoalWithActivities } from "@/lib/types";

interface GoalProgressCardProps {
  goal: GoalWithActivities;
}

const ACCENT: Record<GoalWithActivities["status"], string> = {
  on_track: "text-[#4ADE80] bg-[#22C55E]",
  at_risk: "text-[#FBBF24] bg-[#F59E0B]",
  behind: "text-[#FCA5A5] bg-[#DC2626]",
};

export function GoalProgressCard({ goal }: GoalProgressCardProps) {
  const [textClass, barClass] = ACCENT[goal.status].split(" ");
  const borderClass =
    goal.status === "on_track"
      ? ""
      : goal.status === "at_risk"
      ? "border border-[#F59E0B33]"
      : "border border-[#DC262633]";

  return (
    <div className={`rounded-2xl bg-[#151B27] p-3.5 ${borderClass}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[13px] font-semibold text-white truncate">
          {goal.title}
        </div>
        <div className={`text-xs font-bold ${textClass}`}>
          {goal.progress_pct}%
        </div>
      </div>
      <div className="mt-2 h-1 rounded-full bg-[#0B0F17] overflow-hidden">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${goal.progress_pct}%` }}
        />
      </div>
    </div>
  );
}
