"use client";

import { useCallback, useEffect, useState } from "react";
import { listProjects, listActivities } from "@/lib/projects/queries";
import type { Project, ProjectActivity } from "@/lib/projects/types";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectFormModal } from "@/components/projects/project-form-modal";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";

export default function ProjectsPage() {
  const { isMELManager } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<
    Record<string, ProjectActivity[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Projects</h1>
        {isMELManager && (
          <Button onClick={() => setShowNew(true)}>+ New Project</Button>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading projects…</div>
      ) : projects.length === 0 ? (
        <div className="text-sm text-muted-foreground">No projects yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p) => (
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
