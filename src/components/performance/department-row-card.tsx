"use client";

import { useRouter } from "next/navigation";
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

const STATUS_STYLE = {
  on_track: {
    surface: "bg-card border border-border",
    badgeBg: "bg-green-100 dark:bg-[#052E16]",
    badgeText: "text-green-700 dark:text-[#4ADE80]",
    valueText: "text-green-700 dark:text-[#4ADE80]",
    subText: "text-muted-foreground",
    pillText: "text-green-700 dark:text-[#4ADE80]",
    pillLabel: "ON TRACK",
  },
  at_risk: {
    surface:
      "bg-amber-50 border border-amber-200 dark:bg-[linear-gradient(135deg,#1F1405_0%,#151B27_80%)] dark:border-[#F59E0B33]",
    badgeBg: "bg-amber-100 dark:bg-[#451A03]",
    badgeText: "text-amber-700 dark:text-[#FBBF24]",
    valueText: "text-amber-700 dark:text-[#FBBF24]",
    subText: "text-amber-700 dark:text-[#FBBF24]",
    pillText: "text-amber-700 dark:text-[#FBBF24]",
    pillLabel: "AT RISK",
  },
  behind: {
    surface:
      "bg-red-50 border border-red-200 dark:bg-[linear-gradient(135deg,#1F0505_0%,#151B27_80%)] dark:border-[#DC262633]",
    badgeBg: "bg-red-100 dark:bg-[#450A0A]",
    badgeText: "text-red-700 dark:text-[#FCA5A5]",
    valueText: "text-red-700 dark:text-[#FCA5A5]",
    subText: "text-red-700 dark:text-[#FCA5A5]",
    pillText: "text-red-700 dark:text-[#FCA5A5]",
    pillLabel: "BEHIND",
  },
} as const;

export function DepartmentRowCard({ dept, variant = "row" }: DepartmentRowCardProps) {
  const router = useRouter();
  const s = STATUS_STYLE[dept.status];
  const total = dept.done_count + dept.pending_count + dept.overdue_count;
  const subLine =
    dept.overdue_count > 0
      ? `${dept.done_count}/${total} done · ${dept.overdue_count} overdue`
      : `${dept.done_count} of ${total} activities complete`;

  if (variant === "panel") {
    return (
      <button
        type="button"
        onClick={() => router.push(`/performance/${dept.id}`)}
        className={`w-full text-left rounded-2xl p-4 flex flex-col gap-3 h-full transition-transform active:scale-[0.99] ${s.surface}`}
      >
        {/* Top row: monogram + status badge */}
        <div className="flex items-center justify-between">
          <div
            className={`size-11 rounded-2xl flex items-center justify-center font-extrabold text-[15px] ${s.badgeBg} ${s.badgeText}`}
          >
            {monogram(dept.name)}
          </div>
          <span
            className={`text-[9px] tracking-[1px] font-bold px-2 py-0.5 rounded-full ${s.badgeBg} ${s.pillText}`}
          >
            {s.pillLabel}
          </span>
        </div>

        {/* Department name — no truncate */}
        <div className="text-[15px] font-bold text-foreground">{dept.name}</div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-[#5BBF3A]"
            style={{ width: `${dept.progress_pct}%` }}
          />
        </div>

        {/* Bottom row: subline + pct */}
        <div className="flex items-center justify-between mt-auto">
          <div className={`text-[11px] ${s.subText}`}>{subLine}</div>
          <div className={`text-[20px] font-extrabold tracking-tight ${s.valueText}`}>
            {dept.progress_pct}%
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => router.push(`/performance/${dept.id}`)}
      className={`w-full text-left rounded-2xl p-4 flex items-center gap-3.5 transition-transform active:scale-[0.99] ${s.surface}`}
    >
      <div
        className={`size-11 rounded-2xl flex items-center justify-center font-extrabold text-[15px] ${s.badgeBg} ${s.badgeText}`}
      >
        {monogram(dept.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-bold text-foreground truncate">
          {dept.name}
        </div>
        <div className={`text-[11px] mt-0.5 ${s.subText}`}>{subLine}</div>
      </div>
      <div className="text-right shrink-0">
        <div className={`text-[20px] font-extrabold tracking-tight ${s.valueText}`}>
          {dept.progress_pct}%
        </div>
        <div className={`text-[9px] tracking-[1px] font-bold ${s.pillText}`}>
          {s.pillLabel}
        </div>
      </div>
    </button>
  );
}
