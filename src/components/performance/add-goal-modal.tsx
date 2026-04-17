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
import { Textarea } from "@/components/ui/textarea";

interface AddGoalModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  departmentId: string;
  year: number;
  quarter: number;
  createdBy: string;
}

export function AddGoalModal({
  open,
  onClose,
  onCreated,
  departmentId,
  year,
  quarter,
  createdBy,
}: AddGoalModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("performance_goals").insert({
      department_id: departmentId,
      title: title.trim(),
      description: description.trim() || null,
      year,
      quarter,
      due_date: dueDate,
      created_by: createdBy,
    });

    if (error) {
      toast.error("Failed to create goal: " + error.message);
    } else {
      toast.success("Goal created");
      setTitle("");
      setDescription("");
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
          <DialogTitle>Add Goal — Q{quarter} {year}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="goal-title">Goal title *</Label>
            <Input
              id="goal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Publish Q2 impact report"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goal-desc">Description (optional)</Label>
            <Textarea
              id="goal-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Additional context..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goal-due">Due date *</Label>
            <Input
              id="goal-due"
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
              {saving ? "Saving…" : "Create Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
