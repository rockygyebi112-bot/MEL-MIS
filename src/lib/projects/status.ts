import type {
  ComputedProjectStatus,
  Project,
  ProjectActivity,
} from "./types";

function isOverdue(activity: ProjectActivity, today: Date): boolean {
  if (!activity.due_date || activity.status === "done") return false;
  return new Date(activity.due_date) < today;
}

export function computeProjectStatus(
  project: Pick<Project, "status_override">,
  activities: ProjectActivity[],
  now: Date = new Date(),
): ComputedProjectStatus {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (activities.length > 0 && activities.every((a) => a.status === "done")) {
    return "done";
  }
  if (project.status_override === "blocked") return "blocked";

  const hasOverdue = activities.some((a) => isOverdue(a, today));
  const hasHighBlocked = activities.some(
    (a) => a.priority === "high" && a.status === "blocked",
  );
  if (hasOverdue || hasHighBlocked) return "at_risk";

  if (activities.some((a) => a.status !== "not_started")) return "in_progress";
  return "not_started";
}

export function computeProgressPercent(activities: ProjectActivity[]): number {
  if (activities.length === 0) return 0;
  const done = activities.filter((a) => a.status === "done").length;
  return Math.round((done / activities.length) * 100);
}

export function countOverdue(
  activities: ProjectActivity[],
  now: Date = new Date(),
): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return activities.filter((a) => isOverdue(a, today)).length;
}

export function countNeedsAttention(activities: ProjectActivity[]): number {
  return activities.filter(
    (a) => a.status === "blocked" || a.priority === "high",
  ).length;
}

export const STATUS_LABEL: Record<ComputedProjectStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  at_risk: "At Risk",
  blocked: "Blocked",
  done: "Done",
};

export const STATUS_TONE: Record<
  ComputedProjectStatus,
  "neutral" | "blue" | "amber" | "red" | "green"
> = {
  not_started: "neutral",
  in_progress: "blue",
  at_risk: "amber",
  blocked: "red",
  done: "green",
};
