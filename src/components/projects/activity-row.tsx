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
}

export function ActivityRow({ activity, onOpen }: Props) {
  const overdue =
    activity.due_date &&
    activity.status !== "done" &&
    new Date(activity.due_date) < new Date();

  return (
    <button
      onClick={() => onOpen(activity.id)}
      className="w-full text-left flex items-center gap-3 px-3 py-2 rounded hover:bg-accent/60"
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
      <span className="flex-1 truncate text-sm">{activity.title}</span>
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
      <span className="text-xs text-muted-foreground w-10 text-right">
        {activity.percent_complete}%
      </span>
    </button>
  );
}
