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
    if (!open) {
      // Reset state on close so stale data doesn't flash on next open
      setAvailableUsers([]);
      setSelectedUserId("");
      setIsManager(false);
      return;
    }

    let cancelled = false;

    async function fetchAvailable() {
      setLoadingUsers(true);
      const supabase = createClient();

      // Users already in this department
      const { data: existing, error: existingErr } = await supabase
        .from("user_departments")
        .select("user_id")
        .eq("department_id", departmentId);

      if (existingErr) {
        toast.error("Failed to load staff: " + existingErr.message);
        if (!cancelled) setLoadingUsers(false);
        return;
      }

      const existingIds = (existing ?? []).map((r: { user_id: string }) => r.user_id);

      // All active users
      const { data: allUsers, error: usersErr } = await supabase
        .from("user_profiles")
        .select("id, full_name, email, role_id, status, created_at, updated_at")
        .eq("status", "active")
        .order("full_name");

      if (usersErr) {
        toast.error("Failed to load users: " + usersErr.message);
        if (!cancelled) setLoadingUsers(false);
        return;
      }

      // Filter out already-assigned users
      const filtered = (allUsers ?? []).filter(
        (u: UserProfile) => !existingIds.includes(u.id)
      );

      if (!cancelled) {
        setAvailableUsers(filtered as UserProfile[]);
        setSelectedUserId("");
        setIsManager(false);
        setLoadingUsers(false);
      }
    }

    fetchAvailable();
    return () => { cancelled = true; };
  }, [open, departmentId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId || saving) return;

    setSaving(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.from("user_departments").insert({
        user_id: selectedUserId,
        department_id: departmentId,
        is_manager: isManager,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("This user is already assigned to the department.");
        } else {
          toast.error("Failed to add staff: " + error.message);
        }
      } else {
        toast.success("Staff member added to department");
        onAdded();
        onClose();
      }
    } finally {
      setSaving(false);
    }
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
          <div className="py-4 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              All active users are already assigned to this department.
            </p>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
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
