"use client";

import Link from "next/link";
import type {
  ComputedProjectStatus,
  Project,
  ProjectActivity,
} from "@/lib/projects/types";
import {
  computeProgressPercent,
  computeProjectStatus,
  countOverdue,
  countNeedsAttention,
} from "@/lib/projects/status";
import { cn } from "@/lib/utils";

const STATUS_STRIPE: Record<ComputedProjectStatus, string> = {
  not_started: "#94a3b8",
  in_progress: "#3B6D11",
  at_risk: "#f59e0b",
  blocked: "#dc2626",
  done: "#16a34a",
};

const STATUS_PILL: Record<ComputedProjectStatus, string> = {
  not_started:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  in_progress:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  at_risk:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  blocked: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  done: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ProjectCardStatusPill({
  status,
}: {
  status: ComputedProjectStatus;
}) {
  const label = {
    not_started: "Not started",
    in_progress: "In progress",
    at_risk: "At risk",
    blocked: "Blocked",
    done: "Done",
  }[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0",
        STATUS_PILL[status],
      )}
    >
      <span className="w-[5px] h-[5px] rounded-full bg-current" />
      {label}
    </span>
  );
}

type Variant = "full" | "compact";

interface ProjectCardProps {
  project: Project;
  activities: ProjectActivity[];
  variant?: Variant;
}

export function ProjectCard({
  project,
  activities,
  variant = "full",
}: ProjectCardProps) {
  const status = computeProjectStatus(project, activities);
  const progress = computeProgressPercent(activities);
  const overdue = countOverdue(activities);
  const needsAttention = countNeedsAttention(activities);
  const isCompact = variant === "compact";

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="block rounded-lg border border-border bg-card hover:border-border/80 hover:shadow-sm transition-all overflow-hidden"
    >
      <div
        className="h-[3px]"
        style={{ background: STATUS_STRIPE[status] }}
      />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-[30px] rounded-[8px] bg-gradient-to-br from-srsf-purple-600 to-srsf-green-700 flex items-center justify-center text-[9px] font-extrabold text-white shrink-0">
              {initialsOf(project.name)}
            </div>
            <h3
              className={cn(
                "truncate",
                isCompact ? "text-sm font-medium" : "text-sm font-semibold",
              )}
            >
              {project.name}
            </h3>
          </div>
          <ProjectCardStatusPill status={status} />
        </div>

        {!isCompact && project.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {project.description}
          </p>
        )}

        <div className="h-[5px] bg-muted rounded-full overflow-hidden mb-1.5">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progress}%`,
              background: STATUS_STRIPE[status],
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">
            {progress}% complete
          </span>
          <div className="flex gap-1">
            {overdue > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200 font-medium">
                {overdue} overdue
              </span>
            )}
            {needsAttention > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 font-medium">
                {needsAttention} needs attention
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
