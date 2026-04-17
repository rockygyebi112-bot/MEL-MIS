"use client";

import { useState } from "react";
import { WeekNavigator } from "./week-navigator";
import { ActivityCard } from "./activity-card";
import { usePerformanceStaff } from "@/hooks/use-performance-staff";
import { useUser } from "@/hooks/use-user";

export function StaffDashboard() {
  const { user, loading: userLoading } = useUser();
  const [weekDate, setWeekDate] = useState(new Date());

  const { department, goalTitle, deptProgressPct, activities, loading, error, reload } =
    usePerformanceStaff(user?.id ?? "", weekDate);

  if (userLoading || loading) {
    return (
      <div className="space-y-4">
        <div className="h-14 rounded-xl bg-muted animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error}
      </div>
    );
  }

  const done = activities.filter((a) => a.status === "done").length;
  const overdue = activities.filter((a) => a.status === "overdue").length;
  const pending = activities.filter((a) => a.status === "pending").length;
  const myPct =
    activities.length === 0 ? 0 : Math.round((done / activities.length) * 100);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Performance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {user?.full_name} · {department?.name ?? "No department"}
        </p>
      </div>

      {/* Personal summary strip */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { label: "Done", value: done, color: "text-green-600" },
          { label: "Pending", value: pending, color: "text-muted-foreground" },
          { label: "Overdue", value: overdue, color: "text-red-600" },
          { label: "My %", value: `${myPct}%`, color: "text-[#6B2D7B]" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border/60 bg-white py-3"
          >
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Week navigator */}
      <WeekNavigator weekDate={weekDate} onChange={setWeekDate} />

      {/* Dept goal banner */}
      {goalTitle && (
        <div className="rounded-xl border border-[#6B2D7B]/20 bg-purple-50/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#6B2D7B] mb-1">
            Department Goal
          </p>
          <p className="text-sm font-medium text-foreground">{goalTitle}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-white border border-[#6B2D7B]/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#5BBF3A]"
                style={{ width: `${deptProgressPct}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              Dept {deptProgressPct}%
            </span>
          </div>
        </div>
      )}

      {/* Activity list */}
      {activities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No activities due this week.
        </div>
      ) : (
        <div className="space-y-3">
          {/* Overdue first */}
          {activities
            .filter((a) => a.status === "overdue")
            .map((a) => (
              <ActivityCard
                key={a.id}
                activity={a}
                currentUserId={user?.id ?? ""}
                departmentId={department?.id ?? ""}
                onReload={reload}
              />
            ))}
          {/* Then pending */}
          {activities
            .filter((a) => a.status === "pending")
            .map((a) => (
              <ActivityCard
                key={a.id}
                activity={a}
                currentUserId={user?.id ?? ""}
                departmentId={department?.id ?? ""}
                onReload={reload}
              />
            ))}
          {/* Then done */}
          {activities
            .filter((a) => a.status === "done")
            .map((a) => (
              <ActivityCard
                key={a.id}
                activity={a}
                currentUserId={user?.id ?? ""}
                departmentId={department?.id ?? ""}
                onReload={reload}
              />
            ))}
        </div>
      )}
    </div>
  );
}
