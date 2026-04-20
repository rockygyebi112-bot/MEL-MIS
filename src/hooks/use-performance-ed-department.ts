"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  buildWeeklyTrend,
  computeActivityStatus,
  computeGoalStatus,
  getExpectedProgress,
} from "@/lib/performance-utils";
import type {
  Department,
  GoalWithActivities,
  ActivityWithStatus,
  PerformanceGoal,
  PerformanceActivity,
  ActivitySubmission,
  ActivityAttachment,
} from "@/lib/types";

export interface EdDepartmentView {
  department: Department;
  managerName: string | null;
  goals: GoalWithActivities[];
  overdue: ActivityWithStatus[];
  lastSubmission: {
    activityTitle: string;
    submittedByName: string;
    submittedAt: string;
  } | null;
  status: "on_track" | "at_risk" | "behind";
  progressPct: number;
  doneCount: number;
  pendingCount: number;
  overdueCount: number;
}

export function usePerformanceEdDepartment(
  departmentId: string,
  year: number,
  quarter: number
) {
  const [view, setView] = useState<EdDepartmentView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data: dept, error: deptErr } = await supabase
      .from("departments")
      .select("*")
      .eq("id", departmentId)
      .single();

    if (deptErr || !dept) {
      setError(deptErr?.message ?? "Department not found");
      setLoading(false);
      return;
    }

    const { data: managerRow } = await supabase
      .from("user_departments")
      .select("user:user_profiles!user_id ( full_name )")
      .eq("department_id", departmentId)
      .eq("is_manager", true)
      .maybeSingle();

    const managerName =
      (managerRow as { user?: { full_name?: string } } | null)?.user
        ?.full_name ?? null;

    const { data: goals, error: goalsErr } = await supabase
      .from("performance_goals")
      .select(`
        *,
        activities:performance_activities (
          *,
          assignee:user_profiles!assigned_to ( full_name, email ),
          submission:activity_submissions (
            *,
            attachments:activity_attachments ( * ),
            submittedBy:user_profiles!submitted_by ( full_name )
          )
        )
      `)
      .eq("department_id", departmentId)
      .eq("year", year)
      .eq("quarter", quarter);

    if (goalsErr) {
      setError(goalsErr.message);
      setLoading(false);
      return;
    }

    const expectedPct = getExpectedProgress(quarter, year);

    type RawSub = ActivitySubmission & {
      attachments: ActivityAttachment[];
      submittedBy?: { full_name?: string };
    };
    type RawAct = PerformanceActivity & {
      assignee: { full_name: string; email: string };
      submission: RawSub | RawSub[] | null;
    };

    const enrichedGoals: GoalWithActivities[] = (goals ?? []).map(
      (g: PerformanceGoal & { activities?: RawAct[] }) => {
        const activities: ActivityWithStatus[] = (g.activities ?? []).map(
          (act) => {
            const rawSub = act.submission;
            const sub = Array.isArray(rawSub) ? rawSub[0] ?? null : rawSub;
            return {
              ...act,
              status: computeActivityStatus(
                act,
                sub
                  ? {
                      id: sub.id,
                      activity_id: sub.activity_id,
                      submitted_by: sub.submitted_by,
                      description: sub.description,
                      submitted_at: sub.submitted_at,
                      updated_at: sub.updated_at,
                    }
                  : null
              ),
              submission: sub
                ? {
                    id: sub.id,
                    activity_id: sub.activity_id,
                    submitted_by: sub.submitted_by,
                    description: sub.description,
                    submitted_at: sub.submitted_at,
                    updated_at: sub.updated_at,
                  }
                : null,
              attachments: sub?.attachments ?? [],
              assignee: act.assignee ?? { full_name: "Unknown", email: "" },
            };
          }
        );

        const done = activities.filter((a) => a.status === "done").length;
        const total = activities.length;
        const progressPct = total === 0 ? 0 : Math.round((done / total) * 100);
        const hasOverdue = activities.some((a) => a.status === "overdue");

        return {
          id: g.id,
          department_id: g.department_id,
          title: g.title,
          description: g.description ?? null,
          year: g.year,
          quarter: g.quarter,
          due_date: g.due_date,
          created_by: g.created_by ?? null,
          created_at: g.created_at,
          activities,
          progress_pct: progressPct,
          status: computeGoalStatus(progressPct, expectedPct, hasOverdue),
          weekly_trend: [],
          next_activity: null,
        };
      }
    );

    enrichedGoals.forEach((g) => {
      const gTrendInput = g.activities.map((a) => ({
        due_date: a.due_date,
        submission_at: a.submission?.submitted_at ?? null,
      }));
      g.weekly_trend = buildWeeklyTrend(gTrendInput, new Date(), 8);
      const gUpcoming = g.activities
        .filter((a) => a.status === "pending")
        .sort((a, b) => a.due_date.localeCompare(b.due_date));
      g.next_activity = gUpcoming[0]
        ? { title: gUpcoming[0].title, due_date: gUpcoming[0].due_date }
        : null;
    });

    const allActivities = enrichedGoals.flatMap((g) => g.activities);
    const done = allActivities.filter((a) => a.status === "done").length;
    const pending = allActivities.filter((a) => a.status === "pending").length;
    const overdueList = allActivities
      .filter((a) => a.status === "overdue")
      .sort(
        (a, b) =>
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      );
    const total = allActivities.length;
    const progressPct = total === 0 ? 0 : Math.round((done / total) * 100);

    const submitted = (goals ?? [])
      .flatMap((g: { activities?: RawAct[] }) =>
        (g.activities ?? []).flatMap((a) => {
          const rawSub = a.submission;
          const sub = Array.isArray(rawSub) ? rawSub[0] ?? null : rawSub;
          if (!sub) return [];
          return [
            {
              activityTitle: a.title,
              submittedByName: sub.submittedBy?.full_name ?? "Unknown",
              submittedAt: sub.submitted_at,
            },
          ];
        })
      )
      .sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() -
          new Date(a.submittedAt).getTime()
      );
    const lastSubmission = submitted.length > 0 ? submitted[0] : null;

    setView({
      department: dept as Department,
      managerName,
      goals: enrichedGoals,
      overdue: overdueList,
      lastSubmission,
      status: computeGoalStatus(progressPct, expectedPct, overdueList.length > 0),
      progressPct,
      doneCount: done,
      pendingCount: pending,
      overdueCount: overdueList.length,
    });
    setLoading(false);
  }, [departmentId, year, quarter]);

  useEffect(() => {
    load();
  }, [load]);

  return { view, loading, error, reload: load };
}
