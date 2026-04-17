"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { computeActivityStatus } from "@/lib/performance-utils";
import type {
  ActivityWithStatus,
  Department,
  ActivitySubmission,
  ActivityAttachment,
  PerformanceActivity,
} from "@/lib/types";

export interface StaffData {
  department: Department | null;
  goalTitle: string | null;
  deptProgressPct: number;
  activities: ActivityWithStatus[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** Returns Monday and Sunday of the ISO week containing `date` */
function getWeekBounds(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + diffToMon);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function usePerformanceStaff(userId: string, weekDate: Date): StaffData {
  const [department, setDepartment] = useState<Department | null>(null);
  const [goalTitle, setGoalTitle] = useState<string | null>(null);
  const [deptProgressPct, setDeptProgressPct] = useState(0);
  const [activities, setActivities] = useState<ActivityWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const supabase = createClient();

    // Get user's department
    const { data: ud, error: udErr } = await supabase
      .from("user_departments")
      .select("department_id, department:departments(*)")
      .eq("user_id", userId)
      .single();

    if (udErr || !ud) {
      setDepartment(null);
      setActivities([]);
      setLoading(false);
      return;
    }

    const dept = Array.isArray(ud.department) ? ud.department[0] : ud.department;
    setDepartment(dept as Department);

    const { start, end } = getWeekBounds(weekDate);

    // Activities assigned to this user with due_date in the selected week
    const { data: rawActivities, error: actErr } = await supabase
      .from("performance_activities")
      .select(`
        *,
        goal:performance_goals!goal_id ( id, title, department_id, year, quarter ),
        assignee:user_profiles!assigned_to ( full_name, email ),
        submission:activity_submissions (
          *,
          attachments:activity_attachments ( * )
        )
      `)
      .eq("assigned_to", userId)
      .gte("due_date", start.toISOString().split("T")[0])
      .lte("due_date", end.toISOString().split("T")[0]);

    if (actErr) { setError(actErr.message); setLoading(false); return; }

    type RawActivity = PerformanceActivity & {
      assignee: { full_name: string; email: string };
      submission:
        | (ActivitySubmission & { attachments: ActivityAttachment[] })
        | Array<ActivitySubmission & { attachments: ActivityAttachment[] }>
        | null;
      goal?:
        | { id: string; title: string; department_id: string; year: number; quarter: number }
        | Array<{ id: string; title: string; department_id: string; year: number; quarter: number }>;
    };

    const enriched: ActivityWithStatus[] = (rawActivities ?? []).map((act: RawActivity) => {
      const rawSub = act.submission;
      const submission = Array.isArray(rawSub) ? (rawSub[0] ?? null) : (rawSub ?? null);
      return {
        ...act,
        status: computeActivityStatus(act, submission),
        submission: submission
          ? {
              id: submission.id,
              activity_id: submission.activity_id,
              submitted_by: submission.submitted_by,
              description: submission.description,
              submitted_at: submission.submitted_at,
              updated_at: submission.updated_at,
            }
          : null,
        attachments: submission?.attachments ?? [],
        assignee: act.assignee ?? { full_name: "Unknown", email: "" },
      };
    });

    // Set first goal title for the dept banner
    const firstGoalRaw = rawActivities?.[0]?.goal;
    const firstGoal = Array.isArray(firstGoalRaw) ? firstGoalRaw[0] : firstGoalRaw;
    setGoalTitle((firstGoal as { title?: string } | undefined)?.title ?? null);

    // Compute dept-level progress for the current quarter
    const year = weekDate.getFullYear();
    const quarter = Math.ceil((weekDate.getMonth() + 1) / 3);

    const { data: deptGoals } = await supabase
      .from("performance_goals")
      .select("id")
      .eq("department_id", ud.department_id)
      .eq("year", year)
      .eq("quarter", quarter);

    const deptGoalIds = (deptGoals ?? []).map((g: { id: string }) => g.id);

    if (deptGoalIds.length > 0) {
      const { data: deptActs } = await supabase
        .from("performance_activities")
        .select("id, submission:activity_submissions(id)")
        .in("goal_id", deptGoalIds);

      const deptTotal = (deptActs ?? []).length;
      const deptDone = (deptActs ?? []).filter((a: { submission: unknown }) => {
        const sub = a.submission;
        return Array.isArray(sub) ? sub.length > 0 : sub !== null;
      }).length;
      setDeptProgressPct(deptTotal === 0 ? 0 : Math.round((deptDone / deptTotal) * 100));
    } else {
      setDeptProgressPct(0);
    }

    setActivities(enriched);
    setLoading(false);
  }, [userId, weekDate]);

  useEffect(() => { load(); }, [load]);

  return { department, goalTitle, deptProgressPct, activities, loading, error, reload: load };
}
