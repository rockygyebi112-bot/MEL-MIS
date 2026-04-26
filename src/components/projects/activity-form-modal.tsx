"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { createActivity, updateActivity } from "@/lib/projects/mutations";
import type {
  ActivityPriority,
  ProjectActivity,
  ProjectMilestone,
} from "@/lib/projects/types";
import { cn } from "@/lib/utils";
import {
  AlignLeft,
  CalendarDays,
  Flag,
  FolderTree,
  LayoutList,
  Target,
  UserRound,
} from "lucide-react";

interface UserOption {
  id: string;
  full_name: string | null;
  email: string;
}

interface Props {
  projectId: string;
  milestones: ProjectMilestone[];
  parentCandidates?: ProjectActivity[];
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<ProjectActivity>;
  fixedParentId?: string;
  onSaved: () => void;
}

const PRIORITY_TONES: Record<ActivityPriority, string> = {
  low: "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
  medium:
    "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300",
  high: "border-red-200 bg-red-50 text-red-700 hover:border-red-300 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300",
};

export function ActivityFormModal({
  projectId,
  milestones,
  parentCandidates = [],
  currentUserId,
  open,
  onOpenChange,
  initial,
  fixedParentId,
  onSaved,
}: Props) {
  const resolvedParentId = fixedParentId ?? initial?.parent_activity_id ?? "";
  const parentActivity = useMemo(
    () =>
      resolvedParentId
        ? parentCandidates.find((candidate) => candidate.id === resolvedParentId) ??
          null
        : null,
    [parentCandidates, resolvedParentId],
  );
  const isSubActivity = !!resolvedParentId;
  const isEdit = !!initial?.id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [milestoneId, setMilestoneId] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<ActivityPriority>("medium");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setTitle(initial?.title ?? "");
    setDescription(initial?.description ?? "");
    setMilestoneId(
      resolvedParentId
        ? parentActivity?.milestone_id ?? ""
        : initial?.milestone_id ?? "",
    );
    setOwnerId(initial?.owner_user_id ?? "");
    setDueDate(initial?.due_date ?? "");
    setPriority(initial?.priority ?? "medium");
    setError(null);
  }, [open, initial, resolvedParentId, parentActivity]);

  useEffect(() => {
    if (!open) return;

    let active = true;

    async function loadUsers() {
      const supabase = createClient();
      const { data } = await supabase
        .from("user_profiles")
        .select("id, full_name, email")
        .eq("status", "active")
        .order("full_name", { ascending: true });

      if (!active) return;
      setUsers((data ?? []) as UserOption[]);
    }

    void loadUsers();

    return () => {
      active = false;
    };
  }, [open]);

  const milestone = milestones.find((item) => item.id === milestoneId) ?? null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ownerId) {
      setError("Please select an owner for this item.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (initial?.id) {
        await updateActivity(initial.id, {
          title,
          description: description || null,
          milestone_id: isSubActivity ? parentActivity?.milestone_id ?? null : milestoneId || null,
          parent_activity_id: isSubActivity ? resolvedParentId : null,
          owner_user_id: ownerId || null,
          due_date: dueDate || null,
          priority,
        });
      } else {
        await createActivity({
          project_id: projectId,
          title,
          description: description || null,
          milestone_id: isSubActivity ? parentActivity?.milestone_id ?? null : milestoneId || null,
          parent_activity_id: isSubActivity ? resolvedParentId : null,
          owner_user_id: ownerId || null,
          due_date: dueDate || null,
          priority,
          created_by: currentUserId,
        });
      }

      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  const titleText = isEdit
    ? isSubActivity
      ? "Edit sub-activity"
      : "Edit activity"
    : isSubActivity
      ? "New sub-activity"
      : "New activity";

  const descriptionText = isSubActivity
    ? "Capture a concrete execution task. Parent activity and milestone are inherited and locked."
    : "Create a planning item that can stand alone or coordinate a set of sub-activities.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-1rem)] gap-0 overflow-hidden rounded-[28px] border border-stone-200 bg-stone-50 p-0 text-foreground shadow-2xl sm:max-w-3xl dark:border-slate-800 dark:bg-slate-950"
      >
        <form onSubmit={onSubmit}>
          <DialogHeader className="border-b border-stone-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,246,234,0.92))] px-6 py-5 dark:border-slate-800 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(30,41,59,0.96))]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
                    isSubActivity
                      ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300"
                      : "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300",
                  )}
                >
                  {isSubActivity ? (
                    <FolderTree className="h-5 w-5" />
                  ) : (
                    <LayoutList className="h-5 w-5" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                      {isSubActivity ? "Sub-activity" : "Activity"}
                    </span>
                    {isEdit && (
                      <span className="rounded-full border border-stone-200 bg-stone-100 px-2.5 py-1 text-[10px] font-semibold text-stone-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        Editing existing item
                      </span>
                    )}
                  </div>
                  <DialogTitle className="text-xl font-semibold tracking-tight">
                    {titleText}
                  </DialogTitle>
                  <DialogDescription className="max-w-2xl text-sm text-stone-600 dark:text-slate-300">
                    {descriptionText}
                  </DialogDescription>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="shrink-0"
              >
                Close
              </Button>
            </div>
          </DialogHeader>

          <div className="max-h-[75vh] overflow-y-auto px-6 py-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label
                    htmlFor="act-title"
                    className="flex items-center gap-2 text-sm font-semibold"
                  >
                    <Target className="h-4 w-4 text-stone-400" />
                    Title
                  </Label>
                  <Input
                    id="act-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      isSubActivity
                        ? "What specific task needs to happen?"
                        : "What outcome or workstream needs to be tracked?"
                    }
                    required
                    className="h-12 rounded-2xl border-stone-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>

                <div className="grid gap-2">
                  <Label
                    htmlFor="act-desc"
                    className="flex items-center gap-2 text-sm font-semibold"
                  >
                    <AlignLeft className="h-4 w-4 text-stone-400" />
                    Description
                  </Label>
                  <Textarea
                    id="act-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    placeholder={
                      isSubActivity
                        ? "Add execution notes, expected output, or dependencies."
                        : "Describe scope, constraints, or what this activity coordinates."
                    }
                    className="min-h-[132px] rounded-2xl border-stone-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>

                {!isSubActivity && (
                  <div className="grid gap-2">
                    <Label className="text-sm font-semibold">Milestone</Label>
                    <Select
                      value={milestoneId || "__none__"}
                      onValueChange={(value) =>
                        setMilestoneId(value === "__none__" ? "" : (value ?? ""))
                      }
                    >
                      <SelectTrigger className="h-12 rounded-2xl border-stone-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900">
                        <SelectValue placeholder="Choose a milestone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No milestone</SelectItem>
                        {milestones.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Activities can stay ungrouped, but milestones help organize major phases.
                    </p>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label
                      htmlFor="act-owner"
                      className="flex items-center gap-2 text-sm font-semibold"
                    >
                      <UserRound className="h-4 w-4 text-stone-400" />
                      Owner
                    </Label>
                    <Select
                      value={ownerId || "__none__"}
                      onValueChange={(value) =>
                        setOwnerId(value === "__none__" ? "" : (value ?? ""))
                      }
                    >
                      <SelectTrigger
                        id="act-owner"
                        className={cn(
                          "h-12 rounded-2xl border-stone-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900",
                          !ownerId && "border-amber-300 dark:border-amber-700",
                        )}
                      >
                        <SelectValue placeholder="Select owner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Select owner</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label
                      htmlFor="act-due"
                      className="flex items-center gap-2 text-sm font-semibold"
                    >
                      <CalendarDays className="h-4 w-4 text-stone-400" />
                      Due date
                    </Label>
                    <Input
                      id="act-due"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="h-12 rounded-2xl border-stone-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="flex items-center gap-2 text-sm font-semibold">
                    <Flag className="h-4 w-4 text-stone-400" />
                    Priority
                  </Label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {(["low", "medium", "high"] as ActivityPriority[]).map(
                      (item) => {
                        const active = priority === item;
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setPriority(item)}
                            className={cn(
                              "rounded-2xl border px-4 py-3 text-left transition-all",
                              PRIORITY_TONES[item],
                              active
                                ? "ring-2 ring-offset-2 ring-offset-stone-50 dark:ring-offset-slate-950"
                                : "opacity-80 hover:opacity-100",
                            )}
                          >
                            <div className="text-sm font-semibold capitalize">
                              {item}
                            </div>
                            <div className="mt-1 text-xs opacity-80">
                              {item === "high"
                                ? "Needs close attention or carries risk."
                                : item === "medium"
                                  ? "Important work with normal follow-up."
                                  : "Useful but not urgent."}
                            </div>
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">
                    Workflow
                  </p>
                  <h3 className="mt-2 text-base font-semibold text-foreground">
                    {isSubActivity ? "Execution task" : "Planning container"}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isSubActivity
                      ? "Sub-activities are leaf tasks. They collect proof, updates, blockers, and completion history."
                      : "Activities can stand alone or hold sub-activities. Progress rolls up from child work when children exist."}
                  </p>
                </div>

                {isSubActivity ? (
                  <div className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">
                      Inherited context
                    </p>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
                        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">
                          Parent activity
                        </div>
                        <div className="mt-1 text-sm font-medium text-foreground">
                          {parentActivity?.title ?? "Selected parent"}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
                        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">
                          Milestone
                        </div>
                        <div className="mt-1 text-sm font-medium text-foreground">
                          {milestone?.name ?? "No milestone assigned"}
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      This context is locked so the hierarchy stays clean and sub-activities cannot drift into another branch accidentally.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-slate-400">
                      Design intent
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <li>Use activities to describe the workstream or outcome.</li>
                      <li>Use sub-activities only when execution needs separate owners or proofs.</li>
                      <li>Keep titles action-oriented so the panel remains scannable.</li>
                    </ul>
                  </div>
                )}

                {error && (
                  <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                  </div>
                )}
              </aside>
            </div>
          </div>

          <DialogFooter className="m-0 rounded-none border-t border-stone-200 bg-white/90 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/95">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-xl px-5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !ownerId}
              className="h-11 rounded-xl bg-srsf-green-600 px-5 text-white hover:bg-srsf-green-700"
            >
              {submitting
                ? "Saving..."
                : isEdit
                  ? "Save changes"
                  : isSubActivity
                    ? "Create sub-activity"
                    : "Create activity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
