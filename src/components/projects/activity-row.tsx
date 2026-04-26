"use client";

import type { ProjectActivity } from "@/lib/projects/types";
import { PriorityFlag } from "./priority-flag";
import { cn } from "@/lib/utils";

const STATUS_LABEL = {
  not_started: "Not Started",
  in_progress: "In Progress",
  done: "Done",
  blocked: "Blocked",
} as const;

const STATUS_CLASS: Record<ProjectActivity["status"], string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  done: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  blocked: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};

interface Props {
  activity: ProjectActivity;
  onOpen: (id: string) => void;
  /** Display percent (auto-rolled-up for parents). Falls back to activity.percent_complete. */
  displayPercent?: number;
  /** When > 0, shows a "N sub" badge and indicates this row is a parent. */
  childCount?: number;
  /** Visual indent for sub-activities. */
  indent?: boolean;
}

export function ActivityRow({
  activity,
  onOpen,
  displayPercent,
  childCount = 0,
  indent = false,
}: Props) {
  const overdue =
    activity.due_date &&
    activity.status !== "done" &&
    new Date(activity.due_date) < new Date();

  const pct = displayPercent ?? activity.percent_complete;

  return (
    <button
      onClick={() => onOpen(activity.id)}
      className={cn(
        "w-full text-left flex items-center gap-3 px-3 py-2 rounded hover:bg-accent/60",
        indent && "pl-9 bg-muted/20",
      )}
    >
      <span
        className={cn(
          "px-2 py-0.5 rounded-full text-[11px] font-medium",
          STATUS_CLASS[activity.status],
        )}
      >
        {STATUS_LABEL[activity.status]}
      </span>
      <PriorityFlag priority={activity.priority} />
      <span className="flex-1 min-w-0 truncate text-sm">
        {activity.title}
        {childCount > 0 && (
          <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-semibold">
            {childCount} sub
          </span>
        )}
      </span>
      {activity.due_date && (
        <span
          className={cn(
            "text-xs",
            overdue ? "text-red-600" : "text-muted-foreground",
          )}
        >
          {new Date(activity.due_date).toLocaleDateString()}
        </span>
      )}
      <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
        {pct}%
      </span>
    </button>
  );
}
