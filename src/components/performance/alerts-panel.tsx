"use client";

import { AlertTriangle, Clock } from "lucide-react";
import type { DepartmentSummary, ActivityWithStatus } from "@/lib/types";

interface AlertItem {
  type: "overdue_activity" | "behind_department";
  label: string;
  sub: string;
}

interface AlertsPanelProps {
  departments: DepartmentSummary[];
}

function buildAlerts(departments: DepartmentSummary[]): AlertItem[] {
  const alerts: AlertItem[] = [];

  departments.forEach((dept) => {
    dept.goals.forEach((goal) => {
      goal.activities
        .filter((a) => a.status === "overdue")
        .forEach((a: ActivityWithStatus) => {
          alerts.push({
            type: "overdue_activity",
            label: a.title,
            sub: `${dept.name} · Due ${new Date(a.due_date).toLocaleDateString("en-GB")} · ${a.assignee.full_name}`,
          });
        });
    });

    if (dept.status === "behind") {
      alerts.push({
        type: "behind_department",
        label: `${dept.name} is behind`,
        sub: `${dept.progress_pct}% complete`,
      });
    }
  });

  return alerts;
}

export function AlertsPanel({ departments }: AlertsPanelProps) {
  const alerts = buildAlerts(departments);

  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-white p-5 text-center text-sm text-muted-foreground">
        No active alerts — all departments are on track.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-white divide-y divide-border/40">
      {alerts.map((alert, i) => (
        <div key={i} className="flex items-start gap-3 p-4">
          <div
            className={`mt-0.5 shrink-0 rounded-full p-1 ${
              alert.type === "overdue_activity"
                ? "bg-red-100 text-red-600"
                : "bg-amber-100 text-amber-600"
            }`}
          >
            {alert.type === "overdue_activity" ? (
              <Clock className="size-3.5" />
            ) : (
              <AlertTriangle className="size-3.5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {alert.label}
            </p>
            <p className="text-xs text-muted-foreground">{alert.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
