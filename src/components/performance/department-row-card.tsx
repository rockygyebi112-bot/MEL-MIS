"use client";

import { useRouter } from "next/navigation";
import { Sparkline } from "./sparkline";
import type { DepartmentSummary } from "@/lib/types";

interface DepartmentRowCardProps {
  dept: DepartmentSummary;
  variant?: "row" | "panel";
}

function monogram(name: string): string {
  const words = name.replace(/&/g, "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return "??";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const STATUS = {
  on_track: {
    surfacePanel:
      "bg-card border border-border",
    badgeBg: "bg-perf-surface-ontrack",
    accent: "text-perf-accent-ontrack",
    pillLabel: "ON TRACK",
    sparkColor: "text-perf-accent-ontrack",
  },
  at_risk: {
    surfacePanel:
      "bg-perf-surface-atrisk border border-perf-border-atrisk",
    badgeBg: "bg-perf-surface-atrisk",
    accent: "text-perf-accent-atrisk",
    pillLabel: "AT RISK",
    sparkColor: "text-perf-accent-atrisk",
  },
  behind: {
    surfacePanel:
      "bg-perf-surface-behind border border-perf-border-behind",
    badgeBg: "bg-perf-surface-behind",
    accent: "text-perf-accent-behind",
    pillLabel: "BEHIND",
    sparkColor: "text-perf-accent-behind",
  },
} as const;

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function DepartmentRowCard({ dept, variant = "row" }: DepartmentRowCardProps) {
  const router = useRouter();
  const s = STATUS[dept.status];
  const total = dept.done_count + dept.pending_count + dept.overdue_count;

  if (variant === "panel") {
    return (
      <button
        type="button"
        onClick={() => router.push(`/performance/${dept.id}`)}
        className={`w-full text-left rounded-2xl p-4 flex flex-col gap-2.5 h-full transition-transform active:scale-[0.99] ${s.surfacePanel}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div
            className={`size-10 rounded-xl flex items-center justify-center font-extrabold text-[14px] ${s.badgeBg} ${s.accent}`}
          >
            {monogram(dept.name)}
          </div>
          <span
            className={`text-[9px] tracking-[1px] font-bold px-2 py-0.5 rounded-full ${s.badgeBg} ${s.accent}`}
          >
            {s.pillLabel}
          </span>
        </div>

        <div className="text-[15px] font-bold text-foreground truncate">
          {dept.name}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
          {dept.manager_avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dept.manager_avatar_url}
              alt=""
              className="size-5 rounded-full object-cover"
            />
          ) : (
            <div className="size-5 rounded-full bg-muted" />
          )}
          <span className="truncate">
            {dept.manager_name ?? (
              <span className="italic text-muted-foreground/70">
                No manager assigned
              </span>
            )}
          </span>
        </div>

        {dept.weekly_trend.length >= 2 && (
          <Sparkline values={dept.weekly_trend} accentClassName={s.sparkColor} height={32} />
        )}

        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-[#5BBF3A]"
              style={{ width: `${dept.progress_pct}%` }}
            />
          </div>
          <div
            className={`text-[15px] font-extrabold tracking-tight tabular-nums ${s.accent}`}
          >
            {dept.progress_pct}%
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 min-w-0 mt-auto">
          <div className="text-[11px] text-muted-foreground truncate min-w-0">
            {dept.next_activity
              ? `Next · ${dept.next_activity.title} · ${formatShortDate(
                  dept.next_activity.due_date
                )}`
              : total === 0
              ? "No activities"
              : "Nothing upcoming"}
          </div>
          {dept.overdue_count > 0 ? (
            <span className="shrink-0 text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded-full bg-perf-surface-behind text-perf-accent-behind">
              {dept.overdue_count} OVERDUE
            </span>
          ) : (
            <span className="shrink-0 text-[10px] text-muted-foreground">
              On schedule
            </span>
          )}
        </div>
      </button>
    );
  }

  const subLine =
    dept.overdue_count > 0
      ? `${dept.done_count}/${total} done · ${dept.overdue_count} overdue`
      : `${dept.done_count} of ${total} activities complete`;

  return (
    <button
      type="button"
      onClick={() => router.push(`/performance/${dept.id}`)}
      className={`w-full text-left rounded-2xl p-4 flex items-center gap-3.5 transition-transform active:scale-[0.99] ${s.surfacePanel}`}
    >
      <div
        className={`size-11 rounded-2xl flex items-center justify-center font-extrabold text-[15px] ${s.badgeBg} ${s.accent}`}
      >
        {monogram(dept.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-bold text-foreground truncate">
          {dept.name}
        </div>
        <div className={`text-[11px] mt-0.5 ${s.accent}`}>{subLine}</div>
      </div>
      <div className="text-right shrink-0">
        <div className={`text-[20px] font-extrabold tracking-tight tabular-nums ${s.accent}`}>
          {dept.progress_pct}%
        </div>
        <div className={`text-[9px] tracking-[1px] font-bold ${s.accent}`}>
          {s.pillLabel}
        </div>
      </div>
    </button>
  );
}
