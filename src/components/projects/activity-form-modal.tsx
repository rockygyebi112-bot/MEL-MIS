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
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<ProjectActivity>;
  onSaved: () => void;
}

export function ActivityFormModal({
  projectId,
  milestones,
  currentUserId,
  open,
  onOpenChange,
  initial,
  onSaved,
}: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [milestoneId, setMilestoneId] = useState(initial?.milestone_id ?? "");
  const [ownerId, setOwnerId] = useState(initial?.owner_user_id ?? "");
  const [dueDate, setDueDate] = useState(initial?.due_date ?? "");
  const [priority, setPriority] = useState<ActivityPriority>(
    initial?.priority ?? "medium",
  );
  const [users, setUsers] = useState<UserOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("user_profiles")
        .select("id, full_name, email")
        .order("full_name", { ascending: true });
      setUsers((data ?? []) as UserOption[]);
    })();
  }, [open]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (initial?.id) {
        await updateActivity(initial.id, {
          title,
          description: description || null,
          milestone_id: milestoneId || null,
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
              {initial?.id ? "Edit Activity" : "New Activity"}
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
            <div className="grid gap-1.5">
              <Label htmlFor="act-ms">Milestone</Label>
              <select
                id="act-ms"
                value={milestoneId ?? ""}
                onChange={(e) => setMilestoneId(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">None</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="act-owner">Owner</Label>
              <select
                id="act-owner"
                value={ownerId ?? ""}
                onChange={(e) => setOwnerId(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                required
              >
                <option value="">Select owner…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || u.email}
                  </option>
                ))}
              </select>
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
