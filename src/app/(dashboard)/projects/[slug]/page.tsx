"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import {
  getProjectBySlug,
  listActivities,
  listMilestones,
} from "@/lib/projects/queries";
import type {
  Project,
  ProjectActivity,
  ProjectMilestone,
} from "@/lib/projects/types";
import {
  computeProgressPercent,
  computeProjectStatus,
} from "@/lib/projects/status";
import { StatusPill } from "@/components/projects/status-pill";
import { ProgramDashboard } from "@/components/programs/program-dashboard";
import { ActivitiesPanel } from "@/components/projects/activities-panel";

type Tab = "activities" | "program-data";

export default function ProjectDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [tab, setTab] = useState<Tab>("activities");
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  const refresh = useCallback(async () => {
    const p = await getProjectBySlug(slug);
    if (!p) {
      setNotFoundFlag(true);
      setLoading(false);
      return;
    }
    setProject(p);
    const [ms, acts] = await Promise.all([
      listMilestones(p.id),
      listActivities(p.id),
    ]);
    setMilestones(ms);
    setActivities(acts);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (notFoundFlag) notFound();
  if (loading || !project)
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading…</div>
    );

  const status = computeProjectStatus(project, activities);
  const progress = computeProgressPercent(activities);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {project.description}
              </p>
            )}
          </div>
          <StatusPill status={status} />
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden max-w-md">
          <div
            className="h-full bg-primary"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {progress}% complete
        </div>
      </header>

      <nav className="border-b border-border mb-4 flex gap-4" role="tablist">
        <button
          role="tab"
          aria-selected={tab === "activities"}
          onClick={() => setTab("activities")}
          className={`pb-2 text-sm font-medium border-b-2 ${
            tab === "activities"
              ? "border-primary"
              : "border-transparent text-muted-foreground"
          }`}
        >
          Activities
        </button>
        {project.program_slug && (
          <button
            role="tab"
            aria-selected={tab === "program-data"}
            onClick={() => setTab("program-data")}
            className={`pb-2 text-sm font-medium border-b-2 ${
              tab === "program-data"
                ? "border-primary"
                : "border-transparent text-muted-foreground"
            }`}
          >
            Program Data
          </button>
        )}
      </nav>

      {tab === "activities" ? (
        <ActivitiesPanel
          project={project}
          milestones={milestones}
          activities={activities}
          onChange={refresh}
        />
      ) : project.program_slug ? (
        <ProgramDashboard slug={project.program_slug} showHeading={false} />
      ) : null}
    </div>
  );
}
