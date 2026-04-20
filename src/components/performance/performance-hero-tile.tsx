"use client";

import { Sparkline } from "./sparkline";

interface PerformanceHeroTileProps {
  pct: number;
  onTrackCount: number;
  totalDepts: number;
  doneActivities: number;
  totalActivities: number;
  trendDeltaPct: number | null;
  status: "on_track" | "at_risk" | "behind";
  subline?: string;
  eyebrow?: string;
  weeklyTrend?: number[];
}

const SURFACE: Record<PerformanceHeroTileProps["status"], string> = {
  on_track:
    "bg-[linear-gradient(135deg,#3D9922_0%,#2F7319_100%)] dark:bg-[linear-gradient(135deg,#14532D_0%,#1A2030_100%)]",
  at_risk:
    "bg-[linear-gradient(135deg,#C77A0A_0%,#8A4F08_100%)] dark:bg-[linear-gradient(135deg,#422006_0%,#1A2030_100%)]",
  behind:
    "bg-[linear-gradient(135deg,#BE3434_0%,#7F1D1D_100%)] dark:bg-[linear-gradient(135deg,#450A0A_0%,#1A2030_100%)]",
};

export function PerformanceHeroTile({
  pct,
  onTrackCount,
  totalDepts,
  doneActivities,
  totalActivities,
  trendDeltaPct,
  status,
  subline,
  eyebrow = "ORG HEALTH",
  weeklyTrend = [],
}: PerformanceHeroTileProps) {
  const trendText =
    trendDeltaPct === null
      ? null
      : `${trendDeltaPct >= 0 ? "▲" : "▼"} ${Math.abs(trendDeltaPct)}% vs last quarter`;

  return (
    <div className={`rounded-3xl p-4 lg:p-5 text-white ${SURFACE[status]}`}>
      <div className="text-[11px] font-bold tracking-[2px] text-white/85">
        {eyebrow}
      </div>
      <div className="mt-1.5 flex items-end gap-2.5">
        <div className="text-[48px] lg:text-[64px] font-extrabold leading-none tracking-tight tabular-nums">
          {pct}
          <span className="text-[22px] lg:text-[28px] text-white/85">%</span>
        </div>
        {trendText && (
          <div className="pb-1.5 text-xs text-white/85">{trendText}</div>
        )}
      </div>
      <div className="mt-2 text-[13px] text-white/80 tabular-nums">
        {subline ??
          `${onTrackCount} of ${totalDepts} departments on track · ${doneActivities} of ${totalActivities} activities done this quarter`}
      </div>
      {weeklyTrend.length >= 2 && (
        <div className="mt-3 text-white/70">
          <Sparkline values={weeklyTrend} accentClassName="text-white" height={28} />
        </div>
      )}
    </div>
  );
}
