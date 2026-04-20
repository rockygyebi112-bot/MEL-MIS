"use client";

import { useState } from "react";
import { PerformanceHeroTile } from "./performance-hero-tile";
import { StatusSegmentedBar } from "./status-segmented-bar";
import { DepartmentRowCard } from "./department-row-card";
import { QuarterChip } from "./quarter-chip";
import { usePerformanceEd } from "@/hooks/use-performance-ed";

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function EdHome() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [quarter, setQuarter] = useState(Math.ceil((now.getMonth() + 1) / 3));

  const { departments, trendDeltaPct, loading, error } = usePerformanceEd(
    year,
    quarter
  );

  if (error) {
    return (
      <div className="rounded-2xl bg-destructive/10 border border-destructive/40 p-5 text-sm text-destructive">
        Failed to load performance data: {error}
      </div>
    );
  }

  const onTrack = departments.filter((d) => d.status === "on_track").length;
  const atRisk = departments.filter((d) => d.status === "at_risk").length;
  const behind = departments.filter((d) => d.status === "behind").length;

  const totalActivities = departments.reduce(
    (s, d) => s + d.done_count + d.pending_count + d.overdue_count,
    0
  );
  const doneActivities = departments.reduce((s, d) => s + d.done_count, 0);
  const pct =
    totalActivities === 0
      ? 0
      : Math.round((doneActivities / totalActivities) * 100);

  const overallStatus: "on_track" | "at_risk" | "behind" =
    behind > 0 ? "behind" : atRisk > 0 ? "at_risk" : "on_track";

  return (
    <div className="space-y-5 text-foreground">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">{formatDate(now)}</div>
          <h1 className="text-2xl font-bold tracking-tight mt-0.5">
            Performance
          </h1>
        </div>
        <QuarterChip
          year={year}
          quarter={quarter}
          onYearChange={setYear}
          onQuarterChange={setQuarter}
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-40 rounded-3xl bg-muted animate-pulse" />
          <div className="h-6 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-[72px] rounded-2xl bg-muted animate-pulse"
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          <PerformanceHeroTile
            pct={pct}
            onTrackCount={onTrack}
            totalDepts={departments.length}
            doneActivities={doneActivities}
            totalActivities={totalActivities}
            trendDeltaPct={trendDeltaPct}
            status={overallStatus}
          />

          <StatusSegmentedBar
            onTrack={onTrack}
            atRisk={atRisk}
            behind={behind}
          />

          <div className="space-y-2.5 md:space-y-0 md:grid md:grid-cols-2 md:gap-3 lg:grid-cols-3">
            {departments.map((dept) => (
              <DepartmentRowCard key={dept.id} dept={dept} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
