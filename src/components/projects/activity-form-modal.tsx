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
import { cn } from "@/lib/utils";
import { Target, AlignLeft, User, Calendar, Flag, LayoutList, ChevronRight } from "lucide-react";

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

  const isSubActivity = !!fixedParentId || !!parentId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <form onSubmit={onSubmit}>
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg",
                isSubActivity ? "bg-indigo-100 text-indigo-600" : "bg-blue-100 text-blue-600"
              )}>
                {isSubActivity ? <ChevronRight className="w-5 h-5" /> : <LayoutList className="w-5 h-5" />}
              </span>
              {initial?.id
                ? "Edit Activity"
                : isSubActivity
                  ? "New Sub-activity"
                  : "New Activity"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="px-6 py-5 space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="act-title" className="flex items-center gap-2 text-sm font-medium">
                <Target className="w-4 h-4 text-slate-400" />
                Title
              </Label>
              <Input
                id="act-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                required
                className="h-11"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="act-desc" className="flex items-center gap-2 text-sm font-medium">
                <AlignLeft className="w-4 h-4 text-slate-400" />
                Description
              </Label>
              <Textarea
                id="act-desc"
                value={description ?? ""}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Add details about this activity..."
                className="resize-none"
              />
            </div>
            {/* Parent & Milestone - Grid Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!fixedParentId && parentCandidates.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Parent Activity</Label>
                  <Select
                    value={parentId || "__none__"}
                    onValueChange={(v) =>
                      setParentId(v === "__none__" ? "" : (v ?? ""))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None — top-level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None — top-level</SelectItem>
                      {parentCandidates.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {!parentId && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Milestone</Label>
                  <Select
                    value={milestoneId || "__none__"}
                    onValueChange={(v) =>
                      setMilestoneId(v === "__none__" ? "" : (v ?? ""))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select milestone" />
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
                </div>
              )}
            </div>
            {/* Owner, Due Date, Priority - 3 Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="act-owner" className="flex items-center gap-2 text-sm font-medium">
                  <User className="w-4 h-4 text-slate-400" />
                  Owner
                </Label>
                <Select
                  value={ownerId ?? ""}
                  onValueChange={(v) => setOwnerId(v ?? "")}
                >
                  <SelectTrigger id="act-owner" className={cn(!ownerId && "border-amber-300")}>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="act-due" className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Due Date
                </Label>
                <Input
                  id="act-due"
                  type="date"
                  value={dueDate ?? ""}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Flag className="w-4 h-4 text-slate-400" />
                  Priority
                </Label>
                <div className="flex gap-2">
                  {(["low", "medium", "high"] as ActivityPriority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all border",
                        priority === p
                          ? p === "high"
                            ? "bg-red-50 border-red-300 text-red-700"
                            : p === "medium"
                              ? "bg-amber-50 border-amber-300 text-amber-700"
                              : "bg-slate-100 border-slate-300 text-slate-700"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t border-slate-100 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 px-6"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || !ownerId}
              className="h-11 px-6"
            >
              {submitting ? "Saving…" : initial?.id ? "Save Changes" : "Create Activity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
