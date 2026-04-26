"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ActivityStatus,
  Project,
  ProjectActivity,
  ProjectActivityUpdate,
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
      label: "Not Started",
      tone: "bg-muted text-muted-foreground border-border",
    },
    {
      value: "in_progress",
      label: "In Progress",
      tone: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200",
    },
    {
      value: "done",
      label: "Done",
      tone: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-200",
    },
    {
      value: "blocked",
      label: "Blocked",
      tone: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-200",
    },
  ];

export function ActivitySidePanel({
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
  const childActivities = useMemo(
    () => getChildren(activity, allActivities),
    [activity, allActivities],
  );
  const displayPercent = useMemo(
    () => computeActivityPercent(activity, allActivities),
    [activity, allActivities],
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
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <aside className="w-full sm:max-w-md md:max-w-md lg:max-w-md bg-background border-l border-border overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-border bg-muted/20">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                {isSubactivity && <span>Sub-activity</span>}
                {isParent && (
                  <span>Parent · rolls up from sub-activities</span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-semibold leading-tight break-words">
                {activity.title}
              </h2>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete()}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                  aria-label="Delete activity"
                  title="Delete activity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Close"
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

          {/* Status / progress strip */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span
              className={cn(
                "px-2 py-0.5 rounded-full border font-medium",
                STATUS_OPTIONS.find((o) => o.value === activity.status)?.tone,
              )}
            >
              {STATUS_OPTIONS.find((o) => o.value === activity.status)?.label}
            </span>
            <span className="text-muted-foreground">
              Priority: <span className="font-medium text-foreground capitalize">{activity.priority}</span>
            </span>
            {activity.due_date && (
              <span className="text-muted-foreground">
                Due:{" "}
                <span className="font-medium text-foreground">
                  {new Date(activity.due_date).toLocaleDateString()}
                </span>
              </span>
            )}
            <span className="ml-auto font-semibold tabular-nums">
              {displayPercent}%
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-srsf-green-500 transition-all"
              style={{ width: `${displayPercent}%` }}
            />
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-6">
          {/* Sub-activities list (main activities only - not for sub-activities) */}
          {!isSubactivity && (isParent || onAddSubactivity) && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">
                  Sub-activities {childActivities.length > 0 && `(${childActivities.length})`}
                </h3>
                {onAddSubactivity && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onAddSubactivity(activity.id)}
                  >
                    + Add sub-activity
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
                          {STATUS_OPTIONS.find((o) => o.value === c.status)?.label}
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

          {/* Attachments slot */}
          {children}

          {/* Update form */}
          {canPostUpdate && (
            <form
              onSubmit={submit}
              className="rounded-lg border border-border p-4 space-y-4 bg-card"
            >
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

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={submitting || blockDone}
                  title={
                    blockDone
                      ? "Upload at least one proof of activity"
                      : undefined
                  }
                >
                  {submitting ? "Saving…" : "Post update"}
                </Button>
              </div>
            </form>
          )}

          {/* Update history */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Update history</h3>
            {updates.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No updates yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {updates.map((u) => {
                  const changed =
                    u.status_before &&
                    u.status_after &&
                    u.status_before !== u.status_after;
                  return (
                    <li
                      key={u.id}
                      className="rounded-md border border-border bg-card px-3 py-2"
                    >
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1">
                        <span>{new Date(u.created_at).toLocaleString()}</span>
                        {changed && (
                          <>
                            <span>·</span>
                            <span>
                              {u.status_before} → {u.status_after}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="text-sm whitespace-pre-wrap">
                        {u.note}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
