"use client";

import type {
  ActivityPriority,
  ProjectActivity,
} from "@/lib/projects/types";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  ProjectActivity["status"],
  { dot: string; icon: string | null }
> = {
  not_started: {
    dot: "border-slate-300 text-slate-400 dark:border-slate-600",
    icon: null,
  },
  in_progress: {
    dot: "border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: "\u25D1",
  },
  done: {
    dot: "border-green-300 bg-green-50 text-green-600 dark:border-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: "\u2713",
  },
  blocked: {
    dot: "border-red-300 bg-red-50 text-red-600 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: "\u2715",
  },
};

const PRIORITY_FLAG: Record<ActivityPriority, string> = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-slate-300 dark:bg-slate-600",
};

interface Props {
  activity: ProjectActivity;
  onOpen: (id: string) => void;
  displayPercent?: number;
  childCount?: number;
  indent?: boolean;
  showTreeLine?: boolean;
  isLastChild?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function ActivityRow({
  activity,
  onOpen,
  displayPercent,
  childCount = 0,
  indent = false,
  isExpanded = true,
  onToggleExpand,
}: Props) {
  const overdue =
    activity.due_date &&
    activity.status !== "done" &&
    new Date(activity.due_date) < new Date();

  const pct = displayPercent ?? activity.percent_complete;
  const hasChildren = childCount > 0;
  const isSubActivity = indent;
  const isMainActivity = !indent;
  const canExpand = isMainActivity && hasChildren && onToggleExpand;

  return (
    <div
      className={cn(
        "flex items-center gap-2 transition-colors",
        isMainActivity
          ? "px-3 py-2.5 hover:bg-muted/50"
          : "pl-[var(--activity-sub-indent)] pr-3 py-2 bg-muted/30 hover:bg-muted/50",
        activity.status === "blocked" && "bg-red-50/60 dark:bg-red-900/10",
      )}
    >
      {canExpand ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand?.();
          }}
          className="text-[9px] text-muted-foreground w-3 shrink-0 hover:text-foreground"
        >
          {isExpanded ? "\u25BC" : "\u25B6"}
        </button>
      ) : isMainActivity ? (
        <span className="w-3 shrink-0" />
      ) : null}

      <button
        onClick={() => onOpen(activity.id)}
        className={cn(
          "flex items-center justify-center rounded-full border-[1.5px] shrink-0 transition-colors",
          isMainActivity ? "w-[18px] h-[18px] text-[9px]" : "w-[14px] h-[14px] text-[7px]",
          STATUS_CONFIG[activity.status].dot,
        )}
      >
        {STATUS_CONFIG[activity.status].icon}
      </button>

      <button
        onClick={() => onOpen(activity.id)}
        className="flex-1 flex items-center gap-2 text-left min-w-0"
      >
        <span
          className={cn(
            "truncate",
            isMainActivity ? "text-xs font-medium" : "text-[11px]",
            activity.status === "done" && "line-through text-muted-foreground",
          )}
        >
          {activity.title}
        </span>

        {hasChildren && (
          <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-medium">
            {childCount}
          </span>
        )}
      </button>

      <div className="flex items-center gap-2.5 shrink-0">
        <div
          className={cn("rounded-sm shrink-0", PRIORITY_FLAG[activity.priority])}
          style={{
            width: "var(--priority-flag-w)",
            height: "var(--priority-flag-h)",
          }}
        />

        {activity.due_date && (
          <span
            className={cn(
              "text-[10px] tabular-nums",
              overdue
                ? "text-red-600 font-medium dark:text-red-400"
                : "text-muted-foreground",
              isSubActivity && "hidden sm:block",
            )}
          >
            {new Date(activity.due_date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}

        <div
          className={cn("flex items-center gap-1", isSubActivity && "hidden md:flex")}
        >
          <div
            className={cn(
              "rounded-full bg-muted overflow-hidden",
              isMainActivity ? "w-[40px] h-[3px]" : "w-[30px] h-[2px]",
            )}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background:
                  pct === 100 ? "#16a34a" : pct >= 50 ? "#3B6D11" : "#94a3b8",
              }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground tabular-nums w-5 text-right">
            {pct}%
          </span>
        </div>
      </div>
    </div>
  );
}
