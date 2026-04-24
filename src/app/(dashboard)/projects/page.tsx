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

const FILTERS = ["All", "On Track", "At Risk", "Complete"] as const;
type FilterKey = typeof FILTERS[number];

const FILTER_TO_STATUS: Record<FilterKey, string | null> = {
  All: null,
  "On Track": "on-track",
  "At Risk": "at-risk",
  Complete: "complete",
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
    const ps = await listProjects();
    setProjects(ps);
    const entries = await Promise.all(
      ps.map(async (p) => [p.id, await listActivities(p.id)] as const),
    );
    setActivities(Object.fromEntries(entries));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredProjects = useMemo(() => {
    const target = FILTER_TO_STATUS[filter];
    if (!target) return projects;
    return projects.filter(
      (p) => computeProjectStatus(p, activities[p.id] ?? []) === target,
    );
  }, [projects, activities, filter]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Projects</h1>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors",
                filter === f
                  ? "border-srsf-green-500 bg-srsf-green-500/10 text-srsf-green-600"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        {isMELManager && (
          <Button
            onClick={() => setShowNew(true)}
            className="bg-srsf-green-500 hover:bg-srsf-green-600 text-white"
          >
            <Plus className="size-3.5 mr-1.5" />
            New Project
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading projects…</div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          {projects.length === 0 ? "No projects yet." : "No projects match this filter."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
