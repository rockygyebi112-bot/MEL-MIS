"use client";

import { useRouter } from "next/navigation";
import type { DepartmentSummary } from "@/lib/types";

interface DepartmentRowCardProps {
  dept: DepartmentSummary;
}

function monogram(name: string): string {
  const words = name.replace(/&/g, "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return "??";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const STATUS_STYLE = {
  on_track: {
    surface: "bg-[#151B27]",
    badgeBg: "bg-[#052E16]",
    badgeText: "text-[#4ADE80]",
    valueText: "text-[#4ADE80]",
    subText: "text-[#8891A6]",
    pillText: "text-[#4ADE80]",
    pillLabel: "ON TRACK",
  },
  at_risk: {
    surface:
      "bg-[linear-gradient(135deg,#1F1405_0%,#151B27_80%)] border border-[#F59E0B33]",
    badgeBg: "bg-[#451A03]",
    badgeText: "text-[#FBBF24]",
    valueText: "text-[#FBBF24]",
    subText: "text-[#FBBF24]",
    pillText: "text-[#FBBF24]",
    pillLabel: "AT RISK",
  },
  behind: {
    surface:
      "bg-[linear-gradient(135deg,#1F0505_0%,#151B27_80%)] border border-[#DC262633]",
    badgeBg: "bg-[#450A0A]",
    badgeText: "text-[#FCA5A5]",
    valueText: "text-[#FCA5A5]",
    subText: "text-[#FCA5A5]",
    pillText: "text-[#FCA5A5]",
    pillLabel: "BEHIND",
  },
} as const;

export function DepartmentRowCard({ dept }: DepartmentRowCardProps) {
  const router = useRouter();
  const s = STATUS_STYLE[dept.status];
  const total = dept.done_count + dept.pending_count + dept.overdue_count;
  const subLine =
    dept.overdue_count > 0
      ? `${dept.done_count}/${total} done · ${dept.overdue_count} overdue`
      : `${dept.done_count} of ${total} activities complete`;

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
        <div className="text-[15px] font-bold text-white truncate">
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
