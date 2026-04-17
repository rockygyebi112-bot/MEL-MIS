"use client";

import { useState } from "react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { QuarterSelector } from "./quarter-selector";
import { DepartmentCard } from "./department-card";
import { AlertsPanel } from "./alerts-panel";
import { usePerformanceEd } from "@/hooks/use-performance-ed";

export function EdDashboard() {
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  const [year, setYear] = useState(currentYear);
  const [quarter, setQuarter] = useState(currentQuarter);

  const { departments, loading, error } = usePerformanceEd(year, quarter);

  const onTrackCount = departments.filter((d) => d.status === "on_track").length;
  const atRiskCount = departments.filter((d) => d.status === "at_risk").length;
  const overdueCount = departments.reduce((s, d) => s + d.overdue_count, 0);
  const totalActivities = departments.reduce(
    (s, d) => s + d.done_count + d.pending_count + d.overdue_count,
    0
  );
  const doneActivities = departments.reduce((s, d) => s + d.done_count, 0);
  const overallPct =
    totalActivities === 0 ? 0 : Math.round((doneActivities / totalActivities) * 100);

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        Failed to load performance data: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Performance</h1>
        <QuarterSelector
          year={year}
          quarter={quarter}
          onYearChange={setYear}
          onQuarterChange={setQuarter}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Overall" value={`${overallPct}%`} accent="green" />
        <KpiCard label="On Track" value={onTrackCount} accent="green" />
        <KpiCard label="At Risk" value={atRiskCount} accent="amber" />
        <KpiCard label="Overdue" value={overdueCount} accent="purple" />
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <DepartmentCard key={dept.id} dept={dept} />
          ))}
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Alerts
        </h2>
        <AlertsPanel departments={departments} />
      </div>
    </div>
  );
}
