"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { StatusSegmentedBar } from "./status-segmented-bar";
import { GoalProgressCard } from "./goal-progress-card";
import { OverdueActivityRow } from "./overdue-activity-row";
import { usePerformanceEdDepartment } from "@/hooks/use-performance-ed-department";

interface EdDrilldownProps {
  departmentId: string;
}

const STATUS_META = {
  on_track: {
    label: "ON TRACK",
    accent: "text-[#4ADE80]",
    gradient: "bg-[linear-gradient(135deg,#14532D_0%,#151B27_100%)]",
    border: "border border-[#22C55E33]",
  },
  at_risk: {
    label: "AT RISK",
    accent: "text-[#FBBF24]",
    gradient: "bg-[linear-gradient(135deg,#1F1405_0%,#151B27_100%)]",
    border: "border border-[#F59E0B33]",
  },
  behind: {
    label: "BEHIND",
    accent: "text-[#FCA5A5]",
    gradient: "bg-[linear-gradient(135deg,#1F0505_0%,#151B27_100%)]",
    border: "border border-[#DC262633]",
  },
} as const;

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

export function EdDrilldown({ departmentId }: EdDrilldownProps) {
  const router = useRouter();
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [quarter] = useState(Math.ceil((now.getMonth() + 1) / 3));

  const { view, loading, error } = usePerformanceEdDepartment(
    departmentId,
    year,
    quarter
  );

  if (error) {
    return (
      <div className="rounded-2xl bg-red-900/40 border border-red-700 p-5 text-sm text-red-100">
        {error}
      </div>
    );
  }

  if (loading || !view) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-40 rounded-xl bg-[#151B27] animate-pulse" />
        <div className="h-40 rounded-3xl bg-[#151B27] animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[72px] rounded-2xl bg-[#151B27] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const meta = STATUS_META[view.status];

  return (
    <div className="space-y-5 text-white">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="size-9 rounded-xl bg-[#1A2030] flex items-center justify-center text-[#8891A6] hover:text-white"
          aria-label="Back"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-[#8891A6]">
            Q{quarter} · {year}
          </div>
          <h1 className="text-xl font-bold tracking-tight truncate">
            {view.department.name}
          </h1>
        </div>
      </div>

      <div className={`rounded-3xl p-5 ${meta.gradient} ${meta.border}`}>
        <div className="flex items-start justify-between">
          <div>
            <div className={`text-[10px] tracking-[2px] font-bold ${meta.accent}`}>
              {meta.label}
            </div>
            <div className="mt-1.5 text-5xl font-extrabold tracking-tight">
              {view.progressPct}
              <span className={`text-[22px] ${meta.accent}`}>%</span>
            </div>
            <div className="mt-1 text-[12px] text-white/80">
              {view.doneCount} of{" "}
              {view.doneCount + view.pendingCount + view.overdueCount} activities
              done
            </div>
          </div>
          {view.managerName && (
            <div className="text-right">
              <div className="text-[11px] text-[#8891A6]">Led by</div>
              <div className="text-[13px] font-semibold mt-0.5">
                {view.managerName}
              </div>
            </div>
          )}
        </div>
        <div className="mt-4">
          <StatusSegmentedBar
            onTrack={view.doneCount}
            atRisk={view.pendingCount}
            behind={view.overdueCount}
            showLabels={false}
          />
          <div className="mt-1.5 flex justify-between text-[10px] tracking-wider text-[#8891A6]">
            <span>{view.doneCount} DONE</span>
            <span>{view.pendingCount} PENDING</span>
            <span>{view.overdueCount} OVERDUE</span>
          </div>
        </div>
      </div>

      {view.goals.length > 0 && (
        <div>
          <div className="text-[10px] tracking-[2px] font-bold text-[#8891A6]">
            GOALS · Q{quarter}
          </div>
          <div className="mt-3 space-y-2">
            {view.goals.map((goal) => (
              <GoalProgressCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      )}

      {view.overdue.length > 0 && (
        <div>
          <div className="text-[10px] tracking-[2px] font-bold text-[#FCA5A5]">
            OVERDUE · {view.overdue.length} ITEM
            {view.overdue.length === 1 ? "" : "S"}
          </div>
          <div className="mt-3 space-y-2">
            {view.overdue.map((a) => (
              <OverdueActivityRow key={a.id} activity={a} />
            ))}
          </div>
        </div>
      )}

      {view.lastSubmission && (
        <div>
          <div className="text-[10px] tracking-[2px] font-bold text-[#8891A6]">
            LAST SUBMISSION
          </div>
          <div className="mt-3 rounded-2xl bg-[#151B27] p-3.5">
            <div className="text-[13px] font-semibold">
              {view.lastSubmission.activityTitle}
            </div>
            <div className="mt-1 text-[11px] text-[#8891A6]">
              {view.lastSubmission.submittedByName} ·{" "}
              {timeAgo(view.lastSubmission.submittedAt)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
