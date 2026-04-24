"use client";

import Link from "next/link";
import type { Project, ProjectActivity } from "@/lib/projects/types";
import {
  computeProgressPercent,
  computeProjectStatus,
  countOverdue,
  countNeedsAttention,
} from "@/lib/projects/status";
import { StatusPill } from "./status-pill";
import { cn } from "@/lib/utils";

const STATUS_BAR: Record<string, string> = {
  "on-track": "#5BBF3A",
  "at-risk": "#f59e0b",
  complete: "#0ea5e9",
  overdue: "#e53e3e",
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
      className="block rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-border transition-colors shadow-sm overflow-hidden"
    >
      <div
        className="h-[3px]"
        style={{ background: STATUS_BAR[status] ?? "#5BBF3A" }}
      />
      <div className="p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-7 rounded-[7px] bg-gradient-to-br from-srsf-purple-600 to-srsf-purple-900 flex items-center justify-center text-[9px] font-extrabold text-white shrink-0">
            {initialsOf(project.name)}
          </div>
          <h3
            className={cn(
              "truncate",
              isCompact ? "font-medium text-sm" : "font-semibold text-base"
            )}
          >
            {project.name}
          </h3>
        </div>
        <StatusPill status={status} />
      </div>

      <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground mb-2">
        {progress}% complete
      </div>

      {!isCompact && project.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {project.description}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 text-[11px]">
        {overdue > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200">
            {overdue} overdue
          </span>
        )}
        {needsAttention > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
            {needsAttention} need attention
          </span>
        )}
      </div>
      </div>
    </Link>
  );
}
