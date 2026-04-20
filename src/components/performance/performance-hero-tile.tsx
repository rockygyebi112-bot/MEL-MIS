"use client";

interface PerformanceHeroTileProps {
  pct: number;
  onTrackCount: number;
  totalDepts: number;
  doneActivities: number;
  totalActivities: number;
  trendDeltaPct: number | null;
  status: "on_track" | "at_risk" | "behind";
}

const GRADIENTS: Record<PerformanceHeroTileProps["status"], string> = {
  on_track:
    "bg-[linear-gradient(135deg,#22C55E_0%,#15803D_60%,#166534_100%)] dark:bg-[linear-gradient(135deg,#14532D_0%,#166534_60%,#1A2030_100%)]",
  at_risk:
    "bg-[linear-gradient(135deg,#F59E0B_0%,#B45309_60%,#78350F_100%)] dark:bg-[linear-gradient(135deg,#422006_0%,#78350F_60%,#1A2030_100%)]",
  behind:
    "bg-[linear-gradient(135deg,#EF4444_0%,#B91C1C_60%,#7F1D1D_100%)] dark:bg-[linear-gradient(135deg,#450A0A_0%,#7F1D1D_60%,#1A2030_100%)]",
};

const ACCENT: Record<PerformanceHeroTileProps["status"], string> = {
  on_track: "text-white/90 dark:text-[#86EFAC]",
  at_risk: "text-white/90 dark:text-[#FCD34D]",
  behind: "text-white/90 dark:text-[#FCA5A5]",
};

export function PerformanceHeroTile({
  pct,
  onTrackCount,
  totalDepts,
  doneActivities,
  totalActivities,
  trendDeltaPct,
  status,
}: PerformanceHeroTileProps) {
  const trendText =
    trendDeltaPct === null
      ? null
      : `${trendDeltaPct >= 0 ? "▲" : "▼"} ${Math.abs(trendDeltaPct)}% vs last quarter`;

  return (
    <div className={`rounded-3xl p-5 text-white ${GRADIENTS[status]}`}>
      <div className={`text-[11px] font-bold tracking-[2px] ${ACCENT[status]}`}>
        ORG HEALTH
      </div>
      <div className="mt-2 flex items-end gap-3">
        <div className="text-[64px] font-extrabold leading-none tracking-tight">
          {pct}
          <span className={`text-[28px] ${ACCENT[status]}`}>%</span>
        </div>
        {trendText && (
          <div className={`pb-2 text-xs ${ACCENT[status]}`}>{trendText}</div>
        )}
      </div>
      <div className="mt-3 text-[13px] text-white/80">
        {onTrackCount} of {totalDepts} departments on track · {doneActivities} of{" "}
        {totalActivities} activities done this quarter
      </div>
    </div>
  );
}
