"use client";

import { useEffect, useState, useCallback } from "react";
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
  UserProfile,
  PerformanceGoal,
  PerformanceActivity,
  ActivitySubmission,
  ActivityAttachment,
} from "@/lib/types";

export interface StaffMemberProgress {
  user: UserProfile;
  total: number;
  done: number;
  overdue: number;
  pct: number;
}

export interface ManagerData {
  department: Department | null;
  goals: GoalWithActivities[];
  staff: StaffMemberProgress[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function usePerformanceManager(
  departmentId: string,
  year: number,
  quarter: number
): ManagerData {
  const [department, setDepartment] = useState<Department | null>(null);
  const [goals, setGoals] = useState<GoalWithActivities[]>([]);
  const [staff, setStaff] = useState<StaffMemberProgress[]>([]);
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

    if (deptErr) { setError(deptErr.message); setLoading(false); return; }

    const { data: rawGoals, error: goalsErr } = await supabase
      .from("performance_goals")
      .select(`
        *,
        activities:performance_activities (
          *,
          assignee:user_profiles!assigned_to ( id, full_name, email ),
          submission:activity_submissions (
            *,
            attachments:activity_attachments ( * )
          )
        )
      `)
      .eq("department_id", departmentId)
      .eq("year", year)
      .eq("quarter", quarter)
      .order("created_at");

    if (goalsErr) { setError(goalsErr.message); setLoading(false); return; }

    const expectedPct = getExpectedProgress(quarter, year);

    const enrichedGoals: GoalWithActivities[] = (rawGoals ?? []).map(
      (goal: PerformanceGoal & { activities?: Array<PerformanceActivity & { assignee: { id: string; full_name: string; email: string }; submission: (ActivitySubmission & { attachments: ActivityAttachment[] }) | Array<ActivitySubmission & { attachments: ActivityAttachment[] }> | null }> }) => {
        const rawActivities = goal.activities ?? [];

        const activities: ActivityWithStatus[] = rawActivities.map((act) => {
          // Supabase may return submission as array or single object
          const rawSub = act.submission;
          const submission = Array.isArray(rawSub) ? (rawSub[0] ?? null) : (rawSub ?? null);
          return {
            ...act,
            status: computeActivityStatus(act, submission),
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

    const { data: udRows } = await supabase
      .from("user_departments")
      .select("user_id, user:user_profiles ( id, full_name, email, role_id, status, created_at, updated_at )")
      .eq("department_id", departmentId);

    const allActivities = enrichedGoals.flatMap((g) => g.activities);

    const staffProgress: StaffMemberProgress[] = (udRows ?? [])
      .map(
        (row: { user_id: string; user: UserProfile | UserProfile[] | null }) => {
          // Supabase may return user as array or single object
          const userData = Array.isArray(row.user) ? (row.user[0] ?? null) : (row.user ?? null);
          if (!userData) return null;

          const userActivities = allActivities.filter(
            (a) => a.assigned_to === row.user_id
          );
          const done = userActivities.filter((a) => a.status === "done").length;
          const overdue = userActivities.filter((a) => a.status === "overdue").length;
          const total = userActivities.length;
          return {
            user: userData,
            total,
            done,
            overdue,
            pct: total === 0 ? 0 : Math.round((done / total) * 100),
          };
        }
      )
      .filter((s): s is StaffMemberProgress => s !== null);

    setDepartment(dept as Department);
    setGoals(enrichedGoals);
    setStaff(staffProgress);
    setLoading(false);
  }, [departmentId, year, quarter]);

  useEffect(() => { load(); }, [load]);

  return { department, goals, staff, loading, error, reload: load };
}
