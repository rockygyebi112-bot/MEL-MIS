"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
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

interface UserOption {
  id: string;
  full_name: string | null;
  email: string;
}

interface Props {
  projectId: string;
  milestones: ProjectMilestone[];
  /** Existing top-level activities; sub-activities will reference one of these. */
  parentCandidates?: ProjectActivity[];
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<ProjectActivity>;
  /** When set, the form is locked into "create sub-activity" mode for this parent. */
  fixedParentId?: string;
  onSaved: () => void;
}

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
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [parentId, setParentId] = useState(
    fixedParentId ?? initial?.parent_activity_id ?? "",
  );
  const [milestoneId, setMilestoneId] = useState(initial?.milestone_id ?? "");
  const [ownerId, setOwnerId] = useState(initial?.owner_user_id ?? "");
  const [dueDate, setDueDate] = useState(initial?.due_date ?? "");
  const [priority, setPriority] = useState<ActivityPriority>(
    initial?.priority ?? "medium",
  );
  const [users, setUsers] = useState<UserOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When a parent is selected, inherit its milestone (and lock the field).
  useEffect(() => {
    if (!parentId) return;
    const parent = parentCandidates.find((p) => p.id === parentId);
    if (parent) setMilestoneId(parent.milestone_id ?? "");
  }, [parentId, parentCandidates]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("user_profiles")
        .select("id, full_name, email")
        .eq("status", "active")
        .order("full_name", { ascending: true });
      setUsers((data ?? []) as UserOption[]);
    })();
  }, [open]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ownerId) {
      setError("Please select an owner for this activity.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (initial?.id) {
        await updateActivity(initial.id, {
          title,
          description: description || null,
          milestone_id: milestoneId || null,
          parent_activity_id: parentId || null,
          owner_user_id: ownerId || null,
          due_date: dueDate || null,
          priority,
        });
      } else {
        await createActivity({
          project_id: projectId,
          title,
          description: description || null,
          milestone_id: milestoneId || null,
          parent_activity_id: parentId || null,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>
              {initial?.id
                ? "Edit Activity"
                : fixedParentId
                  ? "New Sub-activity"
                  : "New Activity"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <div className="grid gap-1.5">
              <Label htmlFor="act-title">Title</Label>
              <Input
                id="act-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="act-desc">Description</Label>
              <Textarea
                id="act-desc"
                value={description ?? ""}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            {!fixedParentId && parentCandidates.length > 0 && (
              <div className="grid gap-1.5">
                <Label htmlFor="act-parent">Parent activity (optional)</Label>
                <Select
                  value={parentId || "__none__"}
                  onValueChange={(v) =>
                    setParentId(v === "__none__" ? "" : (v ?? ""))
                  }
                >
                  <SelectTrigger id="act-parent">
                    <SelectValue placeholder="None — top-level activity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      None — top-level activity
                    </SelectItem>
                    {parentCandidates.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selecting a parent makes this a sub-activity. Its milestone
                  is inherited from the parent.
                </p>
              </div>
            )}
            {!parentId && (
              <div className="grid gap-1.5">
                <Label htmlFor="act-ms">Milestone</Label>
                <Select
                  value={milestoneId || "__none__"}
                  onValueChange={(v) =>
                    setMilestoneId(v === "__none__" ? "" : (v ?? ""))
                  }
                >
                  <SelectTrigger id="act-ms">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {milestones.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {users.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No active users are available to assign.
                  </p>
                )}
              </div>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="act-owner">Owner</Label>
              <Select
                value={ownerId ?? ""}
                onValueChange={(v) => setOwnerId(v ?? "")}
              >
                <SelectTrigger id="act-owner">
                  <SelectValue placeholder="Select owner…" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!ownerId && (
                <p className="text-xs text-muted-foreground">
                  Owner is required.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="act-due">Due Date</Label>
                <Input
                  id="act-due"
                  type="date"
                  value={dueDate ?? ""}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Priority</Label>
                <div className="flex gap-3 pt-2 text-sm">
                  {(["low", "medium", "high"] as ActivityPriority[]).map(
                    (p) => (
                      <label
                        key={p}
                        className="inline-flex items-center gap-1.5"
                      >
                        <input
                          type="radio"
                          name="priority"
                          value={p}
                          checked={priority === p}
                          onChange={() => setPriority(p)}
                        />
                        {p}
                      </label>
                    ),
                  )}
                </div>
              </div>
            </div>
            {error && <div className="text-xs text-red-600">{error}</div>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
