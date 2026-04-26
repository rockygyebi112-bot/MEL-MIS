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
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  FolderTree,
  ListTodo,
  PencilLine,
  ShieldAlert,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

interface Props {
  project: Project;
  milestones: ProjectMilestone[];
  activity: ProjectActivity;
  allActivities: ProjectActivity[];
  ownerNameMap?: Record<string, string>;
  currentUserId?: string;
  canPostUpdate: boolean;
  attachmentCount: number;
  onClose: () => void;
  onChange: () => void;
  onAddSubactivity?: (parentId: string) => void;
  onOpenActivity?: (activityId: string) => void;
  onEditActivity?: (activity: ProjectActivity) => void;
  onDelete?: () => void | Promise<void>;
  children?: React.ReactNode;
}

const STATUS_OPTIONS: { value: ActivityStatus; label: string; tone: string }[] =
  [
    {
      value: "not_started",
      label: "Not started",
      tone: "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
    },
    {
      value: "in_progress",
      label: "In progress",
      tone: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    },
    {
      value: "done",
      label: "Done",
      tone: "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300",
    },
    {
      value: "blocked",
      label: "Blocked",
      tone: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300",
    },
  ];

const STATUS_LABELS: Record<ActivityStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
  blocked: "Blocked",
};

const PRIORITY_TONES = {
  high: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300",
  medium:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  low: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
} as const;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ActivitySidePanel({
  project,
  milestones,
  activity,
  allActivities,
  ownerNameMap,
  currentUserId,
  canPostUpdate,
  attachmentCount,
  onClose,
  onChange,
  onAddSubactivity,
  onOpenActivity,
  onEditActivity,
  onDelete,
  children,
}: Props) {
  const isParent = activityIsParent(activity, allActivities);
  const isSubactivity = !!activity.parent_activity_id;
  const childActivities = useMemo(
    () => getChildren(activity, allActivities),
    [activity, allActivities],
  );
  const parentActivity = useMemo(
    () =>
      activity.parent_activity_id
        ? allActivities.find((item) => item.id === activity.parent_activity_id) ??
          null
        : null,
    [activity.parent_activity_id, allActivities],
  );
  const milestoneId = activity.milestone_id ?? parentActivity?.milestone_id ?? null;
  const milestone = useMemo(
    () => milestones.find((item) => item.id === milestoneId) ?? null,
    [milestones, milestoneId],
  );
  const isLeafTask = childActivities.length === 0;
  const progress = computeActivityPercent(activity, allActivities);
  const ownerName =
    ownerNameMap?.[activity.owner_user_id ?? ""] ?? "Unassigned";
  const overdue =
    activity.due_date &&
    activity.status !== "done" &&
    new Date(activity.due_date) < new Date();
  const canAddSubactivity = !isSubactivity && !!onAddSubactivity;
  const proofRequired = isLeafTask;

  const [updates, setUpdates] = useState<ProjectActivityUpdate[]>([]);
  const [note, setNote] = useState("");
  const [newStatus, setNewStatus] = useState<ActivityStatus>(activity.status);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadUpdates() {
      const next = await listUpdates(activity.id);
      if (active) setUpdates(next);
    }

    void loadUpdates();

    return () => {
      active = false;
    };
  }, [activity.id]);

  useEffect(() => {
    setNewStatus(activity.status);
    setNote("");
    setError(null);
  }, [activity.id, activity.status]);

  const blockDone = proofRequired && newStatus === "done" && attachmentCount === 0;

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
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.toLowerCase().includes("proof")) {
        setError(
          "Upload at least one proof item before marking this leaf task as done.",
        );
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="hidden flex-1 bg-stone-950/35 backdrop-blur-[2px] sm:block" onClick={onClose} />

      <aside className="flex h-full w-full flex-col border-l border-stone-200 bg-[linear-gradient(180deg,#fcfcfb_0%,#f6f4ef_100%)] shadow-2xl sm:max-w-[780px] dark:border-slate-800 dark:bg-[linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
        <div className="sticky top-0 z-10 border-b border-stone-200 bg-background/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
          <div className="px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-muted-foreground">
                  <span>{project.name}</span>
                  <span>/</span>
                  <span>{milestone?.name ?? "Ungrouped"}</span>
                  {isSubactivity && (
                    <>
                      <span>/</span>
                      <span>{parentActivity?.title ?? "Parent activity"}</span>
                    </>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    {isSubactivity ? "Sub-activity" : "Activity"}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[10px] font-semibold",
                      STATUS_OPTIONS.find((item) => item.value === activity.status)?.tone,
                    )}
                  >
                    {STATUS_LABELS[activity.status]}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[10px] font-semibold capitalize",
                      PRIORITY_TONES[activity.priority],
                    )}
                  >
                    {activity.priority} priority
                  </span>
                  {overdue && (
                    <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                      Overdue
                    </span>
                  )}
                </div>

                <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-foreground">
                  {activity.title}
                </h2>

                {activity.description && (
                  <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {activity.description}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {onEditActivity && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onEditActivity(activity)}
                  >
                    <PencilLine className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void onDelete()}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                )}
                <Button type="button" variant="ghost" size="icon-sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_290px]">
            <div className="space-y-6">
              {isSubactivity && parentActivity && (
                <section className="rounded-[26px] border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">
                        Parent activity
                      </p>
                      <h3 className="mt-2 text-base font-semibold text-foreground">
                        {parentActivity.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        This item is a leaf task. It can carry proof, updates, blockers, and completion history, but it cannot contain more sub-activities.
                      </p>
                    </div>
                    {onOpenActivity && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenActivity(parentActivity.id)}
                      >
                        View parent
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </section>
              )}

              {!isSubactivity && (
                <section className="rounded-[26px] border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">
                        Sub-activities
                      </p>
                      <h3 className="mt-2 text-base font-semibold text-foreground">
                        Break execution into leaf tasks
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Use sub-activities when work needs separate ownership, proof, or update history.
                      </p>
                    </div>
                    {canAddSubactivity && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => onAddSubactivity?.(activity.id)}
                        className="bg-srsf-green-600 text-white hover:bg-srsf-green-700"
                      >
                        Add sub-activity
                      </Button>
                    )}
                  </div>

                  {childActivities.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm text-muted-foreground dark:border-slate-700 dark:bg-slate-950">
                      No sub-activities yet. This activity can still be tracked on its own, or you can break it down into execution tasks.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {childActivities.map((child) => {
                        const childProgress = computeActivityPercent(child, allActivities);
                        const childOwner =
                          ownerNameMap?.[child.owner_user_id ?? ""] ?? "Unassigned";
                        const childOverdue =
                          child.due_date &&
                          child.status !== "done" &&
                          new Date(child.due_date) < new Date();

                        return (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => onOpenActivity?.(child.id)}
                            className={cn(
                              "flex w-full flex-col gap-3 rounded-[22px] border px-4 py-4 text-left transition-all hover:-translate-y-px hover:shadow-sm sm:flex-row sm:items-center sm:justify-between",
                              child.status === "blocked"
                                ? "border-red-200 bg-red-50/60 dark:border-red-900/60 dark:bg-red-950/20"
                                : "border-stone-200 bg-stone-50/80 dark:border-slate-800 dark:bg-slate-950/70",
                            )}
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-foreground">
                                  {child.title}
                                </span>
                                <span
                                  className={cn(
                                    "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                    STATUS_OPTIONS.find((item) => item.value === child.status)
                                      ?.tone,
                                  )}
                                >
                                  {STATUS_LABELS[child.status]}
                                </span>
                                {childOverdue && (
                                  <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                                    Overdue
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <UserRound className="h-3 w-3" />
                                  {childOwner}
                                </span>
                                {child.due_date && (
                                  <span className="inline-flex items-center gap-1">
                                    <CalendarDays className="h-3 w-3" />
                                    Due {formatDate(child.due_date)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-3">
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-stone-200 dark:bg-slate-800">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${childProgress}%`,
                                      background:
                                        childProgress === 100
                                          ? "#16a34a"
                                          : childProgress >= 50
                                            ? "#3d9922"
                                            : "#94a3b8",
                                    }}
                                  />
                                </div>
                                <span className="min-w-9 text-right font-medium text-foreground">
                                  {childProgress}%
                                </span>
                              </div>
                              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              {canPostUpdate && (
                <form
                  onSubmit={submit}
                  className="rounded-[26px] border border-stone-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="border-b border-stone-200 px-5 py-4 dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">
                      Post update
                    </p>
                    <h3 className="mt-2 text-base font-semibold text-foreground">
                      Capture progress, blockers, or next steps
                    </h3>
                  </div>

                  <div className="space-y-4 px-5 py-5">
                    <div className="grid gap-2">
                      <Label htmlFor="upd-note" className="text-sm font-semibold">
                        What changed?
                      </Label>
                      <Textarea
                        id="upd-note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={4}
                        placeholder="Describe what moved forward, what is blocked, and what should happen next."
                        required
                        className="min-h-[120px] rounded-2xl border-stone-200 bg-stone-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                      />
                    </div>

                    <div>
                      <Label className="mb-2 block text-sm font-semibold">
                        Status after this update
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map((option) => {
                          const active = newStatus === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setNewStatus(option.value)}
                              className={cn(
                                "rounded-full border px-3 py-2 text-xs font-semibold transition-all",
                                active
                                  ? option.tone
                                  : "border-stone-200 bg-white text-muted-foreground hover:border-stone-300 hover:text-foreground dark:border-slate-700 dark:bg-slate-900",
                              )}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {blockDone && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                        Proof is required before this leaf task can be marked done.
                      </div>
                    )}

                    {error && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                        {error}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end border-t border-stone-200 px-5 py-4 dark:border-slate-800">
                    <Button
                      type="submit"
                      disabled={submitting || blockDone}
                      title={
                        blockDone
                          ? "Upload proof before marking this task done"
                          : undefined
                      }
                      className="h-11 rounded-xl bg-srsf-green-600 px-5 text-white hover:bg-srsf-green-700"
                    >
                      {submitting ? "Saving..." : "Post update"}
                    </Button>
                  </div>
                </form>
              )}

              <section className="rounded-[26px] border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">
                      Update history
                    </p>
                    <h3 className="mt-2 text-base font-semibold text-foreground">
                      Activity timeline
                    </h3>
                  </div>
                  <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[10px] font-semibold text-stone-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                    {updates.length} {updates.length === 1 ? "entry" : "entries"}
                  </span>
                </div>

                {updates.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm text-muted-foreground dark:border-slate-700 dark:bg-slate-950">
                    No updates yet. The first post here will become the running narrative for this task.
                  </div>
                ) : (
                  <ol className="mt-5 space-y-4">
                    {updates.map((update) => {
                      const changed =
                        (update.status_before || update.status_after) &&
                        update.status_before !== update.status_after;

                      return (
                        <li key={update.id} className="relative pl-8">
                          <span className="absolute left-0 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </span>
                          <div className="rounded-[22px] border border-stone-200 bg-stone-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/70">
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                              <span>{new Date(update.created_at).toLocaleString()}</span>
                            </div>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
                              {update.note}
                            </p>
                            {changed && (
                              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                                <span className="rounded-full border border-stone-200 bg-white px-2 py-0.5 text-muted-foreground line-through dark:border-slate-700 dark:bg-slate-900">
                                  {STATUS_LABELS[update.status_before ?? "not_started"]}
                                </span>
                                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 font-semibold text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300">
                                  {STATUS_LABELS[update.status_after ?? "not_started"]}
                                </span>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>
            </div>

            <aside className="space-y-4">
              <section className="rounded-[26px] border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">
                  Overview
                </p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
                    <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">
                      Owner
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm font-medium text-foreground">
                      <UserRound className="h-4 w-4 text-stone-400" />
                      {ownerName}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
                    <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">
                      Due date
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm font-medium text-foreground">
                      <CalendarDays className="h-4 w-4 text-stone-400" />
                      {activity.due_date ? formatDate(activity.due_date) : "Not set"}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
                    <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">
                      Progress
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-200 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${progress}%`,
                            background:
                              progress === 100 ? "#16a34a" : progress >= 50 ? "#3d9922" : "#94a3b8",
                          }}
                        />
                      </div>
                      <span className="min-w-10 text-right text-sm font-semibold text-foreground">
                        {progress}%
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
                    <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">
                      Structure
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
                      {isSubactivity ? (
                        <ListTodo className="h-4 w-4 text-stone-400" />
                      ) : (
                        <FolderTree className="h-4 w-4 text-stone-400" />
                      )}
                      {isSubactivity
                        ? "Leaf task"
                        : isParent
                          ? `${childActivities.length} sub-activities`
                          : "Standalone activity"}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[26px] border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-amber-50 p-2 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">
                      Completion rule
                    </p>
                    <h3 className="mt-2 text-sm font-semibold text-foreground">
                      {proofRequired
                        ? "Proof required before done"
                        : "Progress rolls up from child tasks"}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {proofRequired
                        ? attachmentCount > 0
                          ? "This leaf task has proof attached, so it can be completed once the update is ready."
                          : "Upload at least one proof item before changing this task to done."
                        : "This parent activity should stay focused on coordination. Completion is reflected automatically as sub-activities move forward."}
                    </p>
                  </div>
                </div>
              </section>

              {children}
            </aside>
          </div>
        </div>
      </aside>
    </div>
  );
}
