"use client";

import type {
  ActivityPriority,
  ProjectActivity,
} from "@/lib/projects/types";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  FolderTree,
  UserRound,
} from "lucide-react";

const STATUS_CONFIG: Record<
  ProjectActivity["status"],
  { dot: string; icon: string | null; chip: string; label: string }
> = {
  not_started: {
    dot: "border-slate-300 text-slate-400 dark:border-slate-600",
    icon: null,
    chip: "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300",
    label: "Not started",
  },
  in_progress: {
    dot: "border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: "\u25D1",
    chip: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    label: "In progress",
  },
  done: {
    dot: "border-green-300 bg-green-50 text-green-600 dark:border-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: "\u2713",
    chip: "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300",
    label: "Done",
  },
  blocked: {
    dot: "border-red-300 bg-red-50 text-red-600 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: "\u2715",
    chip: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300",
    label: "Blocked",
  },
};

const PRIORITY_FLAG: Record<ActivityPriority, string> = {
  high: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300",
  medium:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  low: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

interface Props {
  activity: ProjectActivity;
  onOpen: (id: string) => void;
  ownerNameMap?: Record<string, string>;
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
  ownerNameMap,
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
  const ownerName =
    ownerNameMap?.[activity.owner_user_id ?? ""] ?? "Unassigned";
  const statusMeta = STATUS_CONFIG[activity.status];

  return (
    <div
      className={cn(
        "px-2 py-2 transition-colors sm:px-3",
        isSubActivity && "pl-[var(--activity-sub-indent)]",
      )}
    >
      <div className="flex items-start gap-2">
        {canExpand ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand?.();
            }}
            className="mt-3 hidden shrink-0 rounded-full border border-transparent p-1 text-muted-foreground transition hover:border-border hover:bg-background hover:text-foreground sm:block"
            aria-label={isExpanded ? "Collapse activity" : "Expand activity"}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : isMainActivity ? (
          <span className="hidden w-7 shrink-0 sm:block" />
        ) : null}

        <button
          onClick={() => onOpen(activity.id)}
          className={cn(
            "flex-1 rounded-[22px] border text-left transition-all hover:-translate-y-px hover:shadow-sm",
            isMainActivity
              ? "border-stone-200 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-slate-950"
              : "border-stone-200/80 bg-stone-50/90 px-3.5 py-3 dark:border-slate-800 dark:bg-slate-900/70",
            activity.status === "blocked" &&
              "border-red-200/80 bg-red-50/60 dark:border-red-900/60 dark:bg-red-950/20",
          )}
        >
          <div
            className={cn(
              "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
              isSubActivity && "sm:gap-4",
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors",
                    isMainActivity ? "h-5 w-5 text-[9px]" : "h-4 w-4 text-[7px]",
                    statusMeta.dot,
                  )}
                >
                  {statusMeta.icon}
                </span>
                <span
                  className={cn(
                    "truncate font-medium text-foreground",
                    isMainActivity ? "text-sm" : "text-[13px]",
                    activity.status === "done" && "text-muted-foreground line-through",
                  )}
                >
                  {activity.title}
                </span>
                <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-medium text-stone-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {isSubActivity ? "Sub-activity" : "Activity"}
                </span>
                {hasChildren && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-medium text-stone-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <FolderTree className="h-3 w-3" />
                    {childCount} sub-activities
                  </span>
                )}
                {overdue && (
                  <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                    Overdue
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <UserRound className="h-3 w-3" />
                  {ownerName}
                </span>
                {activity.due_date && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1",
                      overdue && "font-medium text-red-600 dark:text-red-400",
                    )}
                  >
                    <CalendarDays className="h-3 w-3" />
                    Due{" "}
                    {new Date(activity.due_date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
                {activity.last_update_at && (
                  <span>
                    Updated{" "}
                    {new Date(activity.last_update_at).toLocaleDateString(
                      undefined,
                      {
                        month: "short",
                        day: "numeric",
                      },
                    )}
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[10px] font-semibold",
                    statusMeta.chip,
                  )}
                >
                  {statusMeta.label}
                </span>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[10px] font-semibold capitalize",
                    PRIORITY_FLAG[activity.priority],
                  )}
                >
                  {activity.priority} priority
                </span>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-stone-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background:
                        pct === 100 ? "#16a34a" : pct >= 50 ? "#3d9922" : "#94a3b8",
                    }}
                  />
                </div>
                <span className="min-w-10 text-right font-medium tabular-nums text-foreground">
                  {pct}%
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
