"use client";

import Link from "next/link";
import type {
  ComputedProjectStatus,
  Project,
  ProjectActivity,
} from "@/features/projects";
import {
  computeProgressPercent,
  computeProjectStatus,
  countOverdue,
  countNeedsAttention,
} from "@/features/projects";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

const STATUS_STRIPE: Record<ComputedProjectStatus, string> = {
  not_started: "#94a3b8",
  in_progress: "#3B6D11",
  at_risk: "#f59e0b",
  blocked: "#dc2626",
  done: "#16a34a",
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
          <StatusBadge status={status} />
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
