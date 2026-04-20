"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  computeActivityStatus,
  computeGoalStatus,
  getExpectedProgress,
  buildWeeklyTrend,
} from "@/lib/performance-utils";
import type {
  Department,
  DepartmentSummary,
  GoalWithActivities,
  ActivityWithStatus,
  PerformanceGoal,
  PerformanceActivity,
  ActivitySubmission,
  ActivityAttachment,
} from "@/lib/types";

export function usePerformanceEd(year: number, quarter: number) {
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [trendDeltaPct, setTrendDeltaPct] = useState<number | null>(null);
  const [orgWeeklyTrend, setOrgWeeklyTrend] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    // 1. Fetch all departments
    const { data: depts, error: deptsErr } = await supabase
      .from("departments")
      .select("*")
      .order("name");

    if (deptsErr) { setError(deptsErr.message); setLoading(false); return; }

    // 2. Fetch goals for this year/quarter with nested activities + submissions + attachments
    const { data: goals, error: goalsErr } = await supabase
      .from("performance_goals")
      .select(`
        *,
        activities:performance_activities (
          *,
          assignee:user_profiles!assigned_to ( full_name, email ),
          submission:activity_submissions (
            *,
            attachments:activity_attachments ( * )
          )
        )
      `)
      .eq("year", year)
      .eq("quarter", quarter);

    if (goalsErr) { setError(goalsErr.message); setLoading(false); return; }

    // 3. Fetch staff counts per department
    const { data: staffRows } = await supabase
      .from("user_departments")
      .select("department_id");

    const staffCountMap: Record<string, number> = {};
    (staffRows ?? []).forEach((r: { department_id: string }) => {
      staffCountMap[r.department_id] = (staffCountMap[r.department_id] ?? 0) + 1;
    });

    // 3.1 Managers per department
    const { data: mgrRows } = await supabase
      .from("user_departments")
      .select("department_id, user:user_profiles!user_id(full_name)")
      .eq("is_manager", true);

    const managerMap: Record<
      string,
      { full_name: string | null; avatar_url: string | null }
    > = {};
    (mgrRows ?? []).forEach(
      (r: {
        department_id: string;
        user: { full_name: string | null } | { full_name: string | null }[] | null;
      }) => {
        const userObj = Array.isArray(r.user) ? r.user[0] : r.user;
        if (userObj) {
          managerMap[r.department_id] = {
            full_name: userObj.full_name,
            avatar_url: null,
          };
        }
      }
    );

    // 3.5. Fetch prior quarter goals and activities for trend delta
    const priorQuarter = quarter === 1 ? 4 : quarter - 1;
    const priorYear = quarter === 1 ? year - 1 : year;

    const { data: priorGoals } = await supabase
      .from("performance_goals")
      .select(`
        activities:performance_activities (
          id,
          due_date,
          submission:activity_submissions ( id )
        )
      `)
      .eq("year", priorYear)
      .eq("quarter", priorQuarter);

    const priorActivities = (priorGoals ?? []).flatMap(
      (g: { activities?: Array<{ submission: unknown }> }) => g.activities ?? []
    );
    const priorDone = priorActivities.filter((a) => {
      const sub = Array.isArray(a.submission) ? a.submission[0] : a.submission;
      return !!sub;
    }).length;
    const priorPct = priorActivities.length === 0
      ? null
      : Math.round((priorDone / priorActivities.length) * 100);

    // 4. Assemble DepartmentSummary for each department
    const expectedPct = getExpectedProgress(quarter, year);

    const summaries: DepartmentSummary[] = (depts as Department[]).map((dept) => {
      const deptGoals = (goals ?? []).filter(
        (g: { department_id: string }) => g.department_id === dept.id
      );

      const enrichedGoals: GoalWithActivities[] = deptGoals.map((goal: PerformanceGoal & { activities?: Array<PerformanceActivity & { assignee: { full_name: string; email: string }; submission: (ActivitySubmission & { attachments: ActivityAttachment[] }) | null }> }) => {
        const rawActivities = goal.activities ?? [];

        const activities: ActivityWithStatus[] = rawActivities.map((act) => {
          // Supabase may return submission as array or object depending on FK detection
          const rawSub = act.submission;
          const submission = Array.isArray(rawSub) ? (rawSub[0] ?? null) : (rawSub ?? null);
          return {
            ...act,
            status: computeActivityStatus(act, submission ? { id: submission.id, activity_id: submission.activity_id, submitted_by: submission.submitted_by, description: submission.description, submitted_at: submission.submitted_at, updated_at: submission.updated_at } : null),
            submission: submission ? { id: submission.id, activity_id: submission.activity_id, submitted_by: submission.submitted_by, description: submission.description, submitted_at: submission.submitted_at, updated_at: submission.updated_at } : null,
            attachments: submission?.attachments ?? [],
            assignee: act.assignee ?? { full_name: "Unknown", email: "" },
          };
        });

        const done = activities.filter((a) => a.status === "done").length;
        const total = activities.length;
        const progressPct = total === 0 ? 0 : Math.round((done / total) * 100);
        const hasOverdue = activities.some((a) => a.status === "overdue");

        return {
          id: goal.id,
          department_id: goal.department_id,
          title: goal.title,
          description: goal.description ?? null,
          year: goal.year,
          quarter: goal.quarter,
          due_date: goal.due_date,
          created_by: goal.created_by ?? null,
          created_at: goal.created_at,
          activities,
          progress_pct: progressPct,
          status: computeGoalStatus(progressPct, expectedPct, hasOverdue),
          weekly_trend: [],
          next_activity: null,
        };
      });

      const allActivities = enrichedGoals.flatMap((g) => g.activities);
      const done = allActivities.filter((a) => a.status === "done").length;
      const pending = allActivities.filter((a) => a.status === "pending").length;
      const overdue = allActivities.filter((a) => a.status === "overdue").length;
      const total = allActivities.length;
      const progressPct = total === 0 ? 0 : Math.round((done / total) * 100);

      const trendInput = allActivities.map((a) => ({
        due_date: a.due_date,
        submission_at: a.submission?.submitted_at ?? null,
      }));
      const weeklyTrend = buildWeeklyTrend(trendInput, new Date(), 8);

      const upcoming = allActivities
        .filter((a) => a.status === "pending")
        .sort((a, b) => a.due_date.localeCompare(b.due_date));
      const nextActivity = upcoming[0]
        ? { title: upcoming[0].title, due_date: upcoming[0].due_date }
        : null;

      // Annotate each goal with its own trend + next
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

      return {
        ...dept,
        goals: enrichedGoals,
        progress_pct: progressPct,
        status: computeGoalStatus(progressPct, expectedPct, overdue > 0),
        staff_count: staffCountMap[dept.id] ?? 0,
        done_count: done,
        pending_count: pending,
        overdue_count: overdue,
        manager_name: managerMap[dept.id]?.full_name ?? null,
        manager_avatar_url: managerMap[dept.id]?.avatar_url ?? null,
        weekly_trend: weeklyTrend,
        next_activity: nextActivity,
      };
    });

    setDepartments(summaries);

    const orgTrendInput = summaries.flatMap((d) =>
      d.goals.flatMap((g) =>
        g.activities.map((a) => ({
          due_date: a.due_date,
          submission_at: a.submission?.submitted_at ?? null,
        }))
      )
    );
    const orgTrendPoints = buildWeeklyTrend(orgTrendInput, new Date(), 8);
    setOrgWeeklyTrend(orgTrendPoints);

    // Compute trend delta
    const totalAct = summaries.reduce(
      (s, d) => s + d.done_count + d.pending_count + d.overdue_count,
      0
    );
    const doneAct = summaries.reduce((s, d) => s + d.done_count, 0);
    const currentPct = totalAct === 0 ? 0 : Math.round((doneAct / totalAct) * 100);
    setTrendDeltaPct(priorPct === null ? null : currentPct - priorPct);

    setLoading(false);
  }, [year, quarter]);

  useEffect(() => { load(); }, [load]);

  return { departments, trendDeltaPct, orgWeeklyTrend, loading, error, reload: load };
}
