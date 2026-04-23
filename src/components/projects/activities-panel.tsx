"use client";

import { useMemo, useState } from "react";
import type {
  Project,
  ProjectActivity,
  ProjectMilestone,
} from "@/lib/projects/types";
import { ActivityRow } from "./activity-row";
import { ActivitySidePanel } from "./activity-side-panel";

type Filter = "all" | "overdue" | "attention" | "mine";

interface Props {
  project: Project;
  milestones: ProjectMilestone[];
  activities: ProjectActivity[];
  onChange: () => void;
  currentUserId?: string;
}

export function ActivitiesPanel({
  project,
  milestones,
  activities,
  onChange,
  currentUserId,
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const today = new Date();
    return activities.filter((a) => {
      if (filter === "overdue")
        return (
          a.due_date && a.status !== "done" && new Date(a.due_date) < today
        );
      if (filter === "attention")
        return a.status === "blocked" || a.priority === "high";
      if (filter === "mine")
        return currentUserId && a.owner_user_id === currentUserId;
      return true;
    });
  }, [filter, activities, currentUserId]);

  const byMilestone = new Map<string | null, ProjectActivity[]>();
  for (const a of filtered) {
    const key = a.milestone_id ?? null;
    byMilestone.set(key, [...(byMilestone.get(key) ?? []), a]);
  }

  const openActivity = openId
    ? activities.find((a) => a.id === openId) ?? null
    : null;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(["all", "overdue", "attention", "mine"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1 rounded-full border ${
              filter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border"
            }`}
          >
            {f === "all"
              ? "All"
              : f === "overdue"
                ? "Overdue"
                : f === "attention"
                  ? "Needs attention"
                  : "My activities"}
          </button>
        ))}
      </div>

      {milestones.map((m) => {
        const rows = byMilestone.get(m.id) ?? [];
        if (rows.length === 0) return null;
        return (
          <section key={m.id} className="mb-6">
            <h3 className="text-sm font-semibold mb-2">{m.name}</h3>
            <div className="rounded border border-border divide-y divide-border">
              {rows.map((a) => (
                <ActivityRow key={a.id} activity={a} onOpen={setOpenId} />
              ))}
            </div>
          </section>
        );
      })}

      {(byMilestone.get(null)?.length ?? 0) > 0 && (
        <section className="mb-6">
          <h3 className="text-sm font-semibold mb-2">Ungrouped</h3>
          <div className="rounded border border-border divide-y divide-border">
            {(byMilestone.get(null) ?? []).map((a) => (
              <ActivityRow key={a.id} activity={a} onOpen={setOpenId} />
            ))}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <div className="text-sm text-muted-foreground">
          No activities match this filter.
        </div>
      )}

      {openActivity && (
        <ActivitySidePanel
          project={project}
          activity={openActivity}
          onClose={() => setOpenId(null)}
          onChange={onChange}
        />
      )}
    </div>
  );
}
