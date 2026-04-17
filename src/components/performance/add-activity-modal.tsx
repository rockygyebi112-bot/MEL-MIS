"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StaffMemberProgress } from "@/hooks/use-performance-manager";

interface AddActivityModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  goalId: string;
  goalTitle: string;
  staff: StaffMemberProgress[];
  createdBy: string;
}

export function AddActivityModal({
  open,
  onClose,
  onCreated,
  goalId,
  goalTitle,
  staff,
  createdBy,
}: AddActivityModalProps) {
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !assignedTo || !dueDate) return;

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("performance_activities").insert({
      goal_id: goalId,
      title: title.trim(),
      assigned_to: assignedTo,
      due_date: dueDate,
      created_by: createdBy,
    });

    if (error) {
      toast.error("Failed to create activity: " + error.message);
    } else {
      toast.success("Activity added");
      setTitle("");
      setAssignedTo("");
      setDueDate("");
      onCreated();
      onClose();
    }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Activity</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-1">
          Goal: <span className="font-medium text-foreground">{goalTitle}</span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="act-title">Activity title *</Label>
            <Input
              id="act-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Draft executive summary"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="act-assign">Assign to *</Label>
            <select
              id="act-assign"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value ?? "")}
              required
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select staff member…</option>
              {staff.map((s) => (
                <option key={s.user.id} value={s.user.id}>
                  {s.user.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="act-due">Due date *</Label>
            <Input
              id="act-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Add Activity"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
