"use client";

import { Sparkline } from "./sparkline";
import type { GoalWithActivities } from "@/lib/types";

interface GoalProgressCardProps {
  goal: GoalWithActivities;
}

const STATUS = {
  on_track: {
    accent: "text-perf-accent-ontrack",
    surface: "bg-card border border-border",
    spark: "text-perf-accent-ontrack",
  },
  at_risk: {
    accent: "text-perf-accent-atrisk",
    surface: "bg-perf-surface-atrisk border border-perf-border-atrisk",
    spark: "text-perf-accent-atrisk",
  },
  behind: {
    accent: "text-perf-accent-behind",
    surface: "bg-perf-surface-behind border border-perf-border-behind",
    spark: "text-perf-accent-behind",
  },
} as const;

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function GoalProgressCard({ goal }: GoalProgressCardProps) {
  const s = STATUS[goal.status];
  const total = goal.activities.length;
  const done = goal.activities.filter((a) => a.status === "done").length;
  const overdue = goal.activities.filter((a) => a.status === "overdue").length;

  return (
    <div className={`rounded-2xl p-4 flex flex-col gap-2.5 ${s.surface}`}>
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="text-[14px] font-semibold text-foreground truncate">
          {goal.title}
        </div>
        <div className={`text-sm font-bold tabular-nums ${s.accent}`}>
          {goal.progress_pct}%
        </div>
      </div>

      {goal.weekly_trend.length >= 2 && (
        <Sparkline values={goal.weekly_trend} accentClassName={s.spark} height={28} />
      )}

      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-[#5BBF3A]"
          style={{ width: `${goal.progress_pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px] min-w-0">
        <div className="text-muted-foreground truncate min-w-0">
          {goal.next_activity
            ? `Next · ${goal.next_activity.title} · ${formatShortDate(
                goal.next_activity.due_date
              )}`
            : total === 0
            ? "No activities"
            : "Nothing upcoming"}
        </div>
        {overdue > 0 ? (
          <span className="shrink-0 text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded-full bg-perf-surface-behind text-perf-accent-behind">
            {overdue} OVERDUE
          </span>
        ) : (
          <span className="shrink-0 text-muted-foreground tabular-nums">
            {done}/{total} done
          </span>
        )}
      </div>
    </div>
  );
}
