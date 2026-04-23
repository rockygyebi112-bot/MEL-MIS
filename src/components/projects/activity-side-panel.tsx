"use client";

import { useEffect, useState } from "react";
import type {
  Project,
  ProjectActivity,
  ProjectActivityUpdate,
} from "@/lib/projects/types";
import { listUpdates } from "@/lib/projects/queries";

interface Props {
  project: Project;
  activity: ProjectActivity;
  onClose: () => void;
  onChange: () => void;
}

export function ActivitySidePanel({ activity, onClose }: Props) {
  const [updates, setUpdates] = useState<ProjectActivityUpdate[]>([]);

  useEffect(() => {
    listUpdates(activity.id).then(setUpdates);
  }, [activity.id]);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <aside className="w-full max-w-md bg-background border-l border-border overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold">{activity.title}</h2>
          <button
            onClick={onClose}
            className="text-sm text-muted-foreground"
          >
            Close
          </button>
        </div>
        {activity.description && (
          <p className="text-sm text-muted-foreground mb-4">
            {activity.description}
          </p>
        )}
        <div className="text-xs text-muted-foreground mb-6">
          Status: {activity.status} · Priority: {activity.priority} ·{" "}
          {activity.percent_complete}%
          {activity.due_date &&
            ` · Due ${new Date(activity.due_date).toLocaleDateString()}`}
        </div>

        {/* Attachments gallery lands in Task 13 */}
        {/* Post-update form lands in Task 12 */}

        <h3 className="text-sm font-semibold mb-2">Updates</h3>
        {updates.length === 0 ? (
          <div className="text-xs text-muted-foreground">No updates yet.</div>
        ) : (
          <ul className="space-y-3">
            {updates.map((u) => (
              <li key={u.id} className="text-sm">
                <div className="text-muted-foreground text-xs">
                  {new Date(u.created_at).toLocaleString()}
                  {u.status_before &&
                    u.status_after &&
                    u.status_before !== u.status_after && (
                      <>
                        {" "}
                        · {u.status_before} → {u.status_after}
                      </>
                    )}
                </div>
                <div>{u.note}</div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
