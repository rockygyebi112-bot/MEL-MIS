"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ActivityStatus,
  Project,
  ProjectActivity,
  ProjectActivityUpdate,
  ProjectMilestone,
} from "@/lib/projects/types";
import { listUpdates } from "@/lib/projects/queries";
import { postActivityUpdate } from "@/lib/projects/mutations";
import {
  computeActivityPercent,
  getChildren,
  isParent as activityIsParent,
} from "@/lib/projects/status";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { X, Trash2 } from "lucide-react";

interface Props {
  project: Project;
  milestones: ProjectMilestone[];
  activity: ProjectActivity;
  allActivities: ProjectActivity[];
  currentUserId?: string;
  canPostUpdate: boolean;
  attachmentCount: number;
  onClose: () => void;
  onChange: () => void;
  onAddSubactivity?: (parentId: string) => void;
  onDelete?: () => void | Promise<void>;
  children?: React.ReactNode;
}

const STATUS_OPTIONS: { value: ActivityStatus; label: string; tone: string }[] =
  [
    {
      value: "not_started",
      label: "Not started",
      tone: "bg-muted text-muted-foreground border-border",
    },
    {
      value: "in_progress",
      label: "In progress",
      tone: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    },
    {
      value: "done",
      label: "Done",
      tone: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
    },
    {
      value: "blocked",
      label: "Blocked",
      tone: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    },
  ];

const STATUS_LABELS: Record<ActivityStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
  blocked: "Blocked",
};

export function ActivitySidePanel({
  project,
  milestones,
  activity,
  allActivities,
  currentUserId,
  canPostUpdate,
  attachmentCount,
  onClose,
  onChange,
  onAddSubactivity,
  onDelete,
  children,
}: Props) {
  const isParent = activityIsParent(activity, allActivities);
  const isSubactivity = !!activity.parent_activity_id;
  const parentActivity = useMemo(
    () =>
      activity.parent_activity_id
        ? allActivities.find((a) => a.id === activity.parent_activity_id) ?? null
        : null,
    [activity.parent_activity_id, allActivities],
  );
  const childActivities = useMemo(
    () => getChildren(activity, allActivities),
    [activity, allActivities],
  );
  const milestoneId = activity.milestone_id ?? parentActivity?.milestone_id ?? null;
  const milestone = useMemo(
    () => milestones.find((item) => item.id === milestoneId) ?? null,
    [milestones, milestoneId],
  );

  const [updates, setUpdates] = useState<ProjectActivityUpdate[]>([]);
  const [note, setNote] = useState("");
  const [newStatus, setNewStatus] = useState<ActivityStatus>(activity.status);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listUpdates(activity.id).then(setUpdates);
  }, [activity.id]);

  useEffect(() => {
    setNewStatus(activity.status);
    setError(null);
  }, [activity.id, activity.status]);

  const blockDone =
    !isParent && newStatus === "done" && attachmentCount === 0;

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
      <div className="flex-1 bg-black/40 hidden sm:block" onClick={onClose} />
      <aside className="w-full sm:max-w-[420px] bg-background border-l border-border shadow-2xl flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-5 pt-5 pb-4 border-b border-border bg-muted/20">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-2">
              <span>{project.name}</span>
              <span>&gt;</span>
              <span>{milestone?.name ?? "Ungrouped"}</span>
              {isSubactivity && (
                <>
                  <span>&gt;</span>
                  <span>Sub-activity</span>
                </>
              )}
            </div>

            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className="text-sm sm:text-base font-semibold leading-snug break-words">
                {activity.title}
              </h2>
              <div className="flex items-center gap-1 shrink-0">
                {onDelete && (
                  <button
                    onClick={() => onDelete()}
                    className="p-1.5 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {activity.description && (
              <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">
                {activity.description}
              </p>
            )}

            <div className="flex flex-wrap gap-1.5">
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded border font-medium",
                  STATUS_OPTIONS.find((o) => o.value === activity.status)?.tone,
                )}
              >
                {STATUS_LABELS[activity.status]}
              </span>

              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded border font-medium",
                  activity.priority === "high" &&
                    "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
                  activity.priority === "medium" &&
                    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
                  activity.priority === "low" &&
                    "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
                )}
              >
                {activity.priority.charAt(0).toUpperCase() +
                  activity.priority.slice(1)}{" "}
                priority
              </span>

              {isParent && (
                <span className="text-[10px] px-2 py-0.5 rounded border font-medium bg-muted text-muted-foreground border-border">
                  {childActivities.length} sub-
                  {childActivities.length === 1 ? "activity" : "activities"}
                </span>
              )}

              {activity.due_date &&
                (() => {
                  const overdue =
                    activity.status !== "done" &&
                    new Date(activity.due_date) < new Date();
                  return (
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded border font-medium",
                        overdue
                          ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
                          : "bg-muted text-muted-foreground border-border",
                      )}
                    >
                      {overdue ? "Overdue - " : "Due "}
                      {new Date(activity.due_date).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </span>
                  );
                })()}
            </div>
          </div>

          <div className="px-4 sm:px-5 py-4 sm:py-5 space-y-6">
            {!isSubactivity && (isParent || onAddSubactivity) && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">
                    Sub-activities{" "}
                    {childActivities.length > 0 && `(${childActivities.length})`}
                  </h3>
                  {onAddSubactivity && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onAddSubactivity(activity.id)}
                    >
                      Add sub-activity
                    </Button>
                  )}
                </div>
                {childActivities.length > 0 && (
                  <ul className="rounded border border-border divide-y divide-border text-sm">
                    {childActivities.map((c) => {
                      const cPct = computeActivityPercent(c, allActivities);
                      return (
                        <li
                          key={c.id}
                          className="flex items-center gap-3 px-3 py-2"
                        >
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                              STATUS_OPTIONS.find((o) => o.value === c.status)
                                ?.tone,
                            )}
                          >
                            {STATUS_LABELS[c.status]}
                          </span>
                          <span className="flex-1 truncate">{c.title}</span>
                          <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                            {cPct}%
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {children}

            {canPostUpdate && (
              <form
                onSubmit={submit}
                className="rounded-lg border border-border bg-card overflow-hidden"
              >
                <div className="p-4 space-y-4">
                  <h3 className="text-sm font-semibold">Post update</h3>

                  <div className="grid gap-1.5">
                    <Label htmlFor="upd-note">What changed?</Label>
                    <Textarea
                      id="upd-note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      placeholder="Briefly describe progress, blockers, or next steps."
                      required
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">Status</Label>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map((opt) => {
                        const active = newStatus === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setNewStatus(opt.value)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-medium border transition",
                              active
                                ? opt.tone
                                : "bg-background text-muted-foreground border-border hover:bg-accent",
                            )}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {blockDone && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-900/30 dark:border-amber-800 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                      Upload at least one proof of activity above before marking
                      Done.
                    </div>
                  )}
                  {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-900/30 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-200">
                      {error}
                    </div>
                  )}
                </div>

                <div className="sticky bottom-0 bg-background border-t border-border px-4 py-3 sm:static sm:border-0 sm:px-4 sm:pb-4">
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={submitting || blockDone}
                      title={
                        blockDone
                          ? "Upload at least one proof of activity"
                          : undefined
                      }
                      className="w-full sm:w-auto bg-srsf-green-600 hover:bg-srsf-green-700 text-white"
                    >
                      {submitting ? "Saving..." : "Post update"}
                    </Button>
                  </div>
                </div>
              </form>
            )}

            <div>
              <h3 className="text-sm font-semibold mb-3">Update history</h3>
              {updates.length === 0 ? (
                <p className="text-xs text-muted-foreground">No updates yet.</p>
              ) : (
                <ul className="space-y-3">
                  {updates.map((u) => {
                    const changed =
                      (u.status_before || u.status_after) &&
                      u.status_before !== u.status_after;
                    return (
                      <li
                        key={u.id}
                        className="rounded-md border border-border bg-card px-3 py-2"
                      >
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1">
                          <span>{new Date(u.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{u.note}</p>
                        {changed && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[10px] text-muted-foreground line-through">
                              {STATUS_LABELS[u.status_before ?? "not_started"]}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              -&gt;
                            </span>
                            <span className="text-[10px] font-medium text-green-700 dark:text-green-400">
                              {STATUS_LABELS[u.status_after ?? "not_started"]}
                            </span>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
