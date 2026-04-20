"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell } from "lucide-react";
import { QuarterChip } from "./quarter-chip";
import { PerformanceHeroTile } from "./performance-hero-tile";
import { StatusSegmentedBar } from "./status-segmented-bar";
import { GoalsActivitiesTab } from "./goals-activities-tab";
import { StaffProgressTab } from "./staff-progress-tab";
import { AlertsPanel } from "./alerts-panel";
import { AddGoalModal } from "./add-goal-modal";
import { usePerformanceManager } from "@/hooks/use-performance-manager";
import { useUser } from "@/hooks/use-user";
import type { DepartmentSummary } from "@/lib/types";

const TABS = ["Goals & Activities", "Staff", "Alerts"] as const;
type Tab = (typeof TABS)[number];

interface ManagerDashboardProps {
  departmentId: string;
}

export function ManagerDashboard({ departmentId }: ManagerDashboardProps) {
  const { user } = useUser();
  const router = useRouter();

  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  const [year, setYear] = useState(currentYear);
  const [quarter, setQuarter] = useState(currentQuarter);
  const [activeTab, setActiveTab] = useState<Tab>("Goals & Activities");
  const [addGoalOpen, setAddGoalOpen] = useState(false);

  const { department, goals, staff, loading, error, reload } =
    usePerformanceManager(departmentId, year, quarter);

  const allActivities = goals.flatMap((g) => g.activities);
  const overdueCount = allActivities.filter((a) => a.status === "overdue").length;
  const doneCount = allActivities.filter((a) => a.status === "done").length;
  const pendingCount = allActivities.filter((a) => a.status === "pending").length;
  const totalCount = allActivities.length;
  const pct = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  const goalsOnTrack = goals.filter((g) => g.status === "on_track").length;
  const goalsAtRisk = goals.filter((g) => g.status === "at_risk").length;
  const goalsBehind = goals.filter((g) => g.status === "behind").length;

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
        {error}
      </div>
    );
  }

  const deptStatus: DepartmentSummary["status"] = goals.some((g) => g.status === "behind")
    ? "behind"
    : goals.some((g) => g.status === "at_risk")
    ? "at_risk"
    : "on_track";

  const deptSummary: DepartmentSummary | null = department
    ? {
        ...department,
        goals,
        progress_pct: pct,
        status: deptStatus,
        staff_count: staff.length,
        done_count: doneCount,
        pending_count: pendingCount,
        overdue_count: overdueCount,
      }
    : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/performance")}
          className="size-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold tracking-[2px] text-[#6B2D7B] uppercase">
            Manager
          </p>
          <h1 className="text-xl font-bold truncate mt-0.5">
            {loading ? "Loading…" : (department?.name ?? "Department")}
          </h1>
        </div>
        <div className="relative">
          <Bell className="size-5 text-muted-foreground" />
          {overdueCount > 0 && (
            <span className="absolute -top-1 -right-1 size-2 rounded-full bg-red-500" />
          )}
        </div>
      </div>

      {/* Hero tile + bar + tabs + content - single loading ternary */}
      {loading ? (
        <div className="space-y-3">
          <div className="h-32 rounded-3xl bg-muted animate-pulse" />
          <div className="h-4 rounded-full bg-muted animate-pulse" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <PerformanceHeroTile
            pct={pct}
            onTrackCount={goalsOnTrack}
            totalDepts={goals.length}
            doneActivities={doneCount}
            totalActivities={totalCount}
            trendDeltaPct={null}
            status={deptStatus}
            eyebrow="DEPARTMENT HEALTH"
            subline={`${goalsOnTrack} of ${goals.length} goals on track · ${doneCount} of ${totalCount} activities done this quarter`}
          />
          <StatusSegmentedBar
            onTrack={goalsOnTrack}
            atRisk={goalsAtRisk}
            behind={goalsBehind}
          />
          <div className="flex justify-end">
            <QuarterChip
              year={year}
              quarter={quarter}
              onYearChange={setYear}
              onQuarterChange={setQuarter}
            />
          </div>
          <div className="flex border-b border-border">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                  activeTab === tab
                    ? "text-[#5BBF3A]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
                {tab === "Alerts" && overdueCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center size-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {overdueCount}
                  </span>
                )}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5BBF3A]" />
                )}
              </button>
            ))}
          </div>
          {activeTab === "Goals & Activities" && user && (
            <GoalsActivitiesTab
              goals={goals}
              staff={staff}
              currentUserId={user.id}
              departmentId={departmentId}
              onAddGoal={() => setAddGoalOpen(true)}
              onReload={reload}
            />
          )}
          {activeTab === "Staff" && (
            <StaffProgressTab
              staff={staff}
              departmentId={departmentId}
              onReload={reload}
            />
          )}
          {activeTab === "Alerts" && deptSummary && (
            <AlertsPanel departments={[deptSummary]} />
          )}
        </>
      )}

      {user && (
        <AddGoalModal
          open={addGoalOpen}
          onClose={() => setAddGoalOpen(false)}
          onCreated={reload}
          departmentId={departmentId}
          year={year}
          quarter={quarter}
          createdBy={user.id}
        />
      )}
    </div>
  );
}
