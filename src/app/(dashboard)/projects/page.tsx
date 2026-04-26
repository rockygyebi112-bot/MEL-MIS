"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { listProjects, listActivities } from "@/lib/projects/queries";
import type { Project, ProjectActivity } from "@/lib/projects/types";
import { computeProjectStatus } from "@/lib/projects/status";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectFormModal } from "@/components/projects/project-form-modal";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComputedProjectStatus } from "@/lib/projects/types";

const FILTERS = [
  "All",
  "Not Started",
  "In Progress",
  "At Risk",
  "Blocked",
  "Done",
] as const;
type FilterKey = typeof FILTERS[number];

const FILTER_TO_STATUS: Record<FilterKey, ComputedProjectStatus | null> = {
  All: null,
  "Not Started": "not_started",
  "In Progress": "in_progress",
  "At Risk": "at_risk",
  Blocked: "blocked",
  Done: "done",
};

export default function ProjectsPage() {
  const { isMELManager } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<
    Record<string, ProjectActivity[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("All");

  const refresh = useCallback(async () => {
    setLoading(true);
    const ps = await listProjects();
    setProjects(ps);
    const entries = await Promise.all(
      ps.map(async (p) => [p.id, await listActivities(p.id)] as const),
    );
    setActivities(Object.fromEntries(entries));
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    void (async () => {
      const ps = await listProjects();
      if (!active) return;
      setProjects(ps);
      const entries = await Promise.all(
        ps.map(async (p) => [p.id, await listActivities(p.id)] as const),
      );
      if (!active) return;
      setActivities(Object.fromEntries(entries));
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  const filteredProjects = useMemo(() => {
    const target = FILTER_TO_STATUS[filter];
    if (!target) return projects;
    return projects.filter(
      (p) => computeProjectStatus(p, activities[p.id] ?? []) === target,
    );
  }, [projects, activities, filter]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-xl font-semibold">Projects</h1>
        {isMELManager && (
          <Button
            onClick={() => setShowNew(true)}
            size="sm"
            className="bg-srsf-green-600 hover:bg-srsf-green-700 text-white w-full sm:w-auto"
          >
            <Plus className="size-3.5 mr-1.5" />
            New project
          </Button>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors",
              filter === f
                ? "border-srsf-green-600 bg-srsf-green-600 text-white"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading projects...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          {projects.length === 0
            ? "No projects yet."
            : "No projects match this filter."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredProjects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              activities={activities[p.id] ?? []}
            />
          ))}
        </div>
      )}

      <ProjectFormModal
        open={showNew}
        onOpenChange={setShowNew}
        onSaved={refresh}
      />
    </div>
  );
}
