import type {
  PerformanceActivity,
  ActivitySubmission,
  ActivityStatus,
  GoalStatus,
} from "./types";

/**
 * Derive activity status from its submission and due date.
 * Status is never stored — always computed at read time.
 */
export function computeActivityStatus(
  activity: Pick<PerformanceActivity, "due_date">,
  submission: ActivitySubmission | null
): ActivityStatus {
  if (submission) return "done";
  if (new Date(activity.due_date) < new Date()) return "overdue";
  return "pending";
}

/**
 * Returns the expected completion % for a given quarter/year
 * based on how far through the quarter today is.
 * Returns 0 if the quarter hasn't started, 100 if it has ended.
 */
export function getExpectedProgress(quarter: number, year: number): number {
  const now = new Date();
  const quarterStart = new Date(year, (quarter - 1) * 3, 1);
  const quarterEnd = new Date(year, quarter * 3, 0, 23, 59, 59);

  if (now < quarterStart) return 0;
  if (now > quarterEnd) return 100;

  const elapsed = now.getTime() - quarterStart.getTime();
  const total = quarterEnd.getTime() - quarterStart.getTime();
  return (elapsed / total) * 100;
}

/**
 * Derive goal/department status from actual vs expected progress.
 * - Behind: >30% below expected OR any activity is overdue
 * - At Risk: 15–30% below expected
 * - On Track: within 15% of expected (or ahead)
 */
export function computeGoalStatus(
  progressPct: number,
  expectedPct: number,
  hasOverdue: boolean
): GoalStatus {
  if (hasOverdue || progressPct < expectedPct - 30) return "behind";
  if (progressPct < expectedPct - 15) return "at_risk";
  return "on_track";
}

/** Human-readable label for GoalStatus */
export const GOAL_STATUS_LABEL: Record<GoalStatus, string> = {
  on_track: "On Track",
  at_risk: "At Risk",
  behind: "Behind",
};

/** Tailwind colour classes for each status (pill bg + text) */
export const GOAL_STATUS_CLASSES: Record<GoalStatus, string> = {
  on_track: "bg-green-100 text-green-800",
  at_risk: "bg-amber-100 text-amber-800",
  behind: "bg-red-100 text-red-800",
};

/** Tailwind colour class for ActivityStatus (used in activity cards) */
export const ACTIVITY_STATUS_CLASSES: Record<ActivityStatus, string> = {
  pending: "text-muted-foreground",
  done: "text-green-600",
  overdue: "text-red-600",
};

/**
 * ISO week index (0-based) of a date within its quarter.
 * Returns null if the date is outside the given year/quarter.
 */
export function weekIndexInQuarter(
  date: Date,
  year: number,
  quarter: number
): number | null {
  const qStartMonth = (quarter - 1) * 3; // 0, 3, 6, 9
  const qStart = new Date(year, qStartMonth, 1);
  const qEnd = new Date(year, qStartMonth + 3, 0, 23, 59, 59);
  if (date < qStart || date > qEnd) return null;
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.floor((date.getTime() - qStart.getTime()) / msPerWeek);
}

/**
 * Build an 8-entry (or shorter) weekly trend of % completion.
 * Each entry is the cumulative % of activities submitted on or before that week's end,
 * out of total activities in scope. Returns up to `maxWeeks` most-recent weeks.
 */
export function buildWeeklyTrend(
  activities: Array<{ due_date: string; submission_at: string | null }>,
  now: Date,
  maxWeeks = 8
): number[] {
  const total = activities.length;
  if (total === 0) return [];

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const points: number[] = [];
  for (let i = maxWeeks - 1; i >= 0; i--) {
    const weekEnd = new Date(now.getTime() - i * msPerWeek);
    const doneByThen = activities.filter(
      (a) => a.submission_at !== null && new Date(a.submission_at) <= weekEnd
    ).length;
    points.push(Math.round((doneByThen / total) * 100));
  }
  return points;
}
