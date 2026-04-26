"use client";

import type { ProjectActivity } from "@/lib/projects/types";
import { PriorityFlag } from "./priority-flag";
import { cn } from "@/lib/utils";
import { Circle, CheckCircle2, Loader2, AlertCircle, ChevronRight, ChevronDown } from "lucide-react";

const STATUS_CONFIG: Record<ProjectActivity["status"], { 
  label: string;
  icon: React.ReactNode;
  class: string;
  bgClass: string;
}> = {
  not_started: {
    label: "To do",
    icon: <Circle className="w-4 h-4" />,
    class: "text-slate-500 border-slate-300",
    bgClass: "bg-slate-50 hover:bg-slate-100",
  },
  in_progress: {
    label: "In progress",
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    class: "text-blue-600 border-blue-400",
    bgClass: "bg-blue-50 hover:bg-blue-100",
  },
  done: {
    label: "Complete",
    icon: <CheckCircle2 className="w-4 h-4" />,
    class: "text-green-600 border-green-400",
    bgClass: "bg-green-50 hover:bg-green-100",
  },
  blocked: {
    label: "Blocked",
    icon: <AlertCircle className="w-4 h-4" />,
    class: "text-red-600 border-red-400",
    bgClass: "bg-red-50 hover:bg-red-100",
  },
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
  /** Show tree connector line (for sub-activities) */
  showTreeLine?: boolean;
  /** Is last child in list (affects tree line rendering) */
  isLastChild?: boolean;
  /** For main activities with children: is expanded? */
  isExpanded?: boolean;
  /** Toggle expand/collapse (only for main activities with children) */
  onToggleExpand?: () => void;
}

export function ActivityRow({
  activity,
  onOpen,
  displayPercent,
  childCount = 0,
  indent = false,
  showTreeLine = false,
  isLastChild = false,
  isExpanded = true,
  onToggleExpand,
}: Props) {
  const overdue =
    activity.due_date &&
    activity.status !== "done" &&
    new Date(activity.due_date) < new Date();

  const pct = displayPercent ?? activity.percent_complete;
  const status = STATUS_CONFIG[activity.status];
  const hasChildren = childCount > 0;
  const isSubActivity = indent;
  const isMainActivity = !indent;
  const canExpand = isMainActivity && hasChildren && onToggleExpand;

  return (
    <div className={cn("flex", isSubActivity && "relative")}>
      {/* Tree connector line for sub-activities */}
      {showTreeLine && isSubActivity && (
        <div className="absolute left-[27px] top-0 bottom-0 w-px bg-slate-200">
          {/* Horizontal branch line */}
          <div className="absolute top-5 left-0 w-6 h-px bg-slate-200" />
          {/* Stop vertical line early for last child */}
          {isLastChild && (
            <div className="absolute top-5 left-0 w-px h-[calc(100%-20px)] bg-white" />
          )}
        </div>
      )}

      <div
        className={cn(
          "flex-1 flex items-center gap-2 py-3 transition-colors",
          isMainActivity 
            ? "px-3 rounded-lg border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm"
            : "pl-14 pr-3",
          isSubActivity && "text-sm",
          status.bgClass
        )}
      >
        {/* Expand/Collapse Toggle (for main activities with children) */}
        {canExpand ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand?.();
            }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200/50 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        ) : isMainActivity ? (
          /* Spacer for alignment when no children */
          <span className="w-6" />
        ) : null}

        {/* Activity Row Button */}
        <button
          onClick={() => onOpen(activity.id)}
          className="flex-1 flex items-center gap-3 text-left"
        >
        {/* Status Icon/Button */}
        <span 
          className={cn(
            "flex items-center justify-center rounded-full border-2 transition-colors",
            isMainActivity ? "w-6 h-6" : "w-5 h-5",
            status.class,
            activity.status === "not_started" && "hover:bg-slate-200"
          )}
        >
          <span className={isMainActivity ? "scale-100" : "scale-90"}>
            {status.icon}
          </span>
        </span>

        {/* Priority & Title */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className={cn(
            "truncate font-medium",
            isMainActivity ? "text-sm" : "text-xs",
            activity.status === "done" && "text-slate-500 line-through"
          )}>
            {activity.title}
          </span>
          
          {/* Sub-activity count badge (only for parents) */}
          {hasChildren && (
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-medium">
              <ChevronRight className="w-3 h-3" />
              {childCount}
            </span>
          )}
        </div>

        {/* Right side: Priority, Due Date, Progress */}
        <div className="flex items-center gap-3 shrink-0">
          <PriorityFlag priority={activity.priority} />
          
          {activity.due_date && (
            <span
              className={cn(
                "text-xs tabular-nums",
                overdue ? "text-red-600 font-medium" : "text-slate-500",
                isSubActivity && "hidden sm:block"
              )}
            >
              {new Date(activity.due_date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
          
          {/* Progress indicator */}
          <div className={cn(
            "flex items-center gap-1.5",
            isSubActivity && "hidden md:flex"
          )}>
            <div className={cn(
              "rounded-full bg-slate-200 overflow-hidden",
              isMainActivity ? "w-16 h-1.5" : "w-12 h-1"
            )}>
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  pct === 100 
                    ? "bg-green-500" 
                    : pct >= 50 
                      ? "bg-blue-500" 
                      : "bg-slate-400"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={cn(
              "text-xs tabular-nums text-slate-500",
              isSubActivity && "text-[10px]"
            )}>
              {pct}%
            </span>
          </div>
        </div>
      </button>
      </div>
    </div>
  );
}
