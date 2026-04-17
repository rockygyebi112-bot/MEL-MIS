"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  computeActivityStatus,
  computeGoalStatus,
  getExpectedProgress,
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
        };
      });

      const allActivities = enrichedGoals.flatMap((g) => g.activities);
      const done = allActivities.filter((a) => a.status === "done").length;
      const pending = allActivities.filter((a) => a.status === "pending").length;
      const overdue = allActivities.filter((a) => a.status === "overdue").length;
      const total = allActivities.length;
      const progressPct = total === 0 ? 0 : Math.round((done / total) * 100);

      return {
        ...dept,
        goals: enrichedGoals,
        progress_pct: progressPct,
        status: computeGoalStatus(progressPct, expectedPct, overdue > 0),
        staff_count: staffCountMap[dept.id] ?? 0,
        done_count: done,
        pending_count: pending,
        overdue_count: overdue,
      };
    });

    setDepartments(summaries);
    setLoading(false);
  }, [year, quarter]);

  useEffect(() => { load(); }, [load]);

  return { departments, loading, error, reload: load };
}
