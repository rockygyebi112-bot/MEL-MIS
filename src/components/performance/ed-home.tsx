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

  const { departments, trendDeltaPct, orgWeeklyTrend, loading, error } = usePerformanceEd(
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

  if (loading) {
    return (
      <div className="text-foreground space-y-4 lg:space-y-0 lg:grid lg:grid-cols-[300px_1fr] lg:gap-8 lg:items-start">
        <div className="space-y-4">
          <div className="h-8 w-40 rounded-lg bg-muted animate-pulse" />
          <div className="h-40 rounded-3xl bg-muted animate-pulse" />
          <div className="h-6 rounded-full bg-muted animate-pulse" />
          <div className="hidden lg:flex lg:flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        </div>
        <div className="space-y-2 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-[72px] lg:h-36 rounded-2xl bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="text-foreground space-y-5 lg:space-y-0 lg:grid lg:grid-cols-[300px_1fr] lg:gap-8 lg:items-start">

      {/* ── Left sidebar ── */}
      <div className="space-y-5 lg:sticky lg:top-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground">{formatDate(now)}</div>
            <h1 className="text-2xl font-bold tracking-tight mt-0.5">Performance</h1>
          </div>
          <QuarterChip
            year={year}
            quarter={quarter}
            onYearChange={setYear}
            onQuarterChange={setQuarter}
          />
        </div>

        <PerformanceHeroTile
          pct={pct}
          onTrackCount={onTrack}
          totalDepts={departments.length}
          doneActivities={doneActivities}
          totalActivities={totalActivities}
          trendDeltaPct={trendDeltaPct}
          status={overallStatus}
          weeklyTrend={orgWeeklyTrend}
        />

        <StatusSegmentedBar onTrack={onTrack} atRisk={atRisk} behind={behind} />

        {/* KPI chips — desktop only */}
        <div className="hidden lg:flex lg:flex-col gap-2">
          {(
            [
              { value: departments.length, label: "Departments" },
              { value: totalActivities, label: "Total Activities" },
              { value: onTrack, label: "On Track" },
            ] as const
          ).map(({ value, label }) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3"
            >
              <span className="text-2xl font-extrabold text-foreground">{value}</span>
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: department grid ── */}
      <div>
        {departments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            No departments found for this quarter.
          </div>
        ) : (
          <>
            {/* Mobile: row cards */}
            <div className="lg:hidden space-y-2.5">
              {departments.map((dept) => (
                <DepartmentRowCard key={dept.id} dept={dept} />
              ))}
            </div>

            {/* Desktop: panel cards */}
            <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {departments.map((dept) => (
                <DepartmentRowCard key={dept.id} dept={dept} variant="panel" />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
