"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { UserProfile } from "@/lib/types";

interface ManageStaffModalProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
  departmentId: string;
}

export function ManageStaffModal({
  open,
  onClose,
  onAdded,
  departmentId,
}: ManageStaffModalProps) {
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isManager, setIsManager] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    async function fetchAvailable() {
      setLoadingUsers(true);
      const supabase = createClient();

      // Users already in this department
      const { data: existing } = await supabase
        .from("user_departments")
        .select("user_id")
        .eq("department_id", departmentId);

      const existingIds = (existing ?? []).map((r: { user_id: string }) => r.user_id);

      // All active users
      const { data: allUsers } = await supabase
        .from("user_profiles")
        .select("id, full_name, email, role_id, status, created_at, updated_at")
        .eq("status", "active")
        .order("full_name");

      // Filter out already-assigned users
      const filtered = (allUsers ?? []).filter(
        (u: UserProfile) => !existingIds.includes(u.id)
      );

      setAvailableUsers(filtered as UserProfile[]);
      setSelectedUserId("");
      setIsManager(false);
      setLoadingUsers(false);
    }

    fetchAvailable();
  }, [open, departmentId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId) return;

    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase.from("user_departments").insert({
      user_id: selectedUserId,
      department_id: departmentId,
      is_manager: isManager,
    });

    if (error) {
      toast.error("Failed to add staff: " + error.message);
    } else {
      toast.success("Staff member added to department");
      onAdded();
      onClose();
    }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Staff to Department</DialogTitle>
        </DialogHeader>

        {loadingUsers ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Loading users…
          </p>
        ) : availableUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            All active users are already assigned to this department.
          </p>
        ) : (
          <form onSubmit={handleAdd} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="staff-select">Select staff member *</Label>
              <select
                id="staff-select"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Choose a user…</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} — {u.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="is-manager"
                type="checkbox"
                checked={isManager}
                onChange={(e) => setIsManager(e.target.checked)}
                className="size-4 rounded border-input"
              />
              <Label htmlFor="is-manager" className="cursor-pointer">
                Department Manager
              </Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !selectedUserId}>
                {saving ? "Adding…" : "Add to Department"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
