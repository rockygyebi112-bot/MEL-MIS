"use client";

import { useEffect, useState } from "react";
import { listProjects, listActivities } from "@/lib/projects/queries";
import type { Project, ProjectActivity } from "@/lib/projects/types";
import { ProjectCard } from "@/components/projects/project-card";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<
    Record<string, ProjectActivity[]>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const ps = await listProjects();
      setProjects(ps);
      const entries = await Promise.all(
        ps.map(async (p) => [p.id, await listActivities(p.id)] as const),
      );
      setActivities(Object.fromEntries(entries));
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Projects</h1>
        {/* "+ New Project" button added in Task 12 (project form modal) */}
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
    </div>
  );
}
