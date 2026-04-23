"use client";

import { useEffect, useState } from "react";
import type {
  ActivityStatus,
  Project,
  ProjectActivity,
  ProjectActivityUpdate,
} from "@/lib/projects/types";
import { listUpdates } from "@/lib/projects/queries";
import { postActivityUpdate } from "@/lib/projects/mutations";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  project: Project;
  activity: ProjectActivity;
  currentUserId?: string;
  canPostUpdate: boolean;
  attachmentCount: number;
  onClose: () => void;
  onChange: () => void;
  children?: React.ReactNode;
}

const STATUS_OPTIONS: ActivityStatus[] = [
  "not_started",
  "in_progress",
  "done",
  "blocked",
];

export function ActivitySidePanel({
  activity,
  currentUserId,
  canPostUpdate,
  attachmentCount,
  onClose,
  onChange,
  children,
}: Props) {
  const [updates, setUpdates] = useState<ProjectActivityUpdate[]>([]);
  const [note, setNote] = useState("");
  const [newStatus, setNewStatus] = useState<ActivityStatus>(activity.status);
  const [newPercent, setNewPercent] = useState(activity.percent_complete);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listUpdates(activity.id).then(setUpdates);
  }, [activity.id]);

  const blockDone = newStatus === "done" && attachmentCount === 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUserId) return;
    setSubmitting(true);
    setError(null);
    try {
      await postActivityUpdate({
        activity_id: activity.id,
        user_id: currentUserId,
        note,
        new_status: newStatus !== activity.status ? newStatus : undefined,
        new_percent:
          newPercent !== activity.percent_complete ? newPercent : undefined,
        current_status: activity.status,
      });
      setNote("");
      onChange();
      const fresh = await listUpdates(activity.id);
      setUpdates(fresh);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes("proof")) {
        setError(
          "Upload at least one proof-of-activity attachment before marking Done.",
        );
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

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

        {children}

        {canPostUpdate && (
          <form onSubmit={submit} className="space-y-3 mb-6">
            <h3 className="text-sm font-semibold">Post update</h3>
            <div className="grid gap-1.5">
              <Label htmlFor="upd-note">Note</Label>
              <Textarea
                id="upd-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="upd-status">Status</Label>
                <select
                  id="upd-status"
                  value={newStatus}
                  onChange={(e) =>
                    setNewStatus(e.target.value as ActivityStatus)
                  }
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="upd-pct">{newPercent}% complete</Label>
                <input
                  id="upd-pct"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={newPercent}
                  onChange={(e) => setNewPercent(Number(e.target.value))}
                />
              </div>
            </div>
            {blockDone && (
              <div className="text-xs text-amber-700 dark:text-amber-300">
                Upload at least one proof of activity before marking Done.
              </div>
            )}
            {error && <div className="text-xs text-red-600">{error}</div>}
            <Button
              type="submit"
              disabled={submitting || blockDone}
              title={
                blockDone ? "Upload at least one proof of activity" : undefined
              }
            >
              {submitting ? "Saving…" : "Save update"}
            </Button>
          </form>
        )}

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
