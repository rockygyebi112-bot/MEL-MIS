"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ManageStaffModal } from "./manage-staff-modal";
import type { StaffMemberProgress } from "@/hooks/use-performance-manager";

interface StaffProgressTabProps {
  staff: StaffMemberProgress[];
  departmentId: string;
  onReload: () => void;
}

export function StaffProgressTab({
  staff,
  departmentId,
  onReload,
}: StaffProgressTabProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function removeStaff(userId: string, name: string) {
    setRemovingId(userId);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_departments")
      .delete()
      .eq("user_id", userId)
      .eq("department_id", departmentId)
      .select();

    if (error) {
      setRemovingId(null);
      setConfirmingId(null);
      toast.error("Failed to remove: " + error.message);
    } else if (!data || data.length === 0) {
      setRemovingId(null);
      setConfirmingId(null);
      toast.error("Could not remove staff member — permission denied.");
    } else {
      setRemovingId(null);
      setConfirmingId(null);
      toast.success(`${name} removed from department`);
      onReload();
    }
  }

  return (
    <div className="space-y-3">
      {/* Add Staff button */}
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
          <UserPlus className="size-4 mr-1.5" />
          Add Staff
        </Button>
      </div>

      {staff.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No staff assigned to this department yet. Click "Add Staff" to assign someone.
        </div>
      ) : (
        <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-3 lg:grid-cols-3">
          {staff.map((s) => (
            <div
              key={s.user.id}
              className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4"
            >
            <div className="size-9 rounded-full bg-[#6B2D7B] text-white flex items-center justify-center text-sm font-semibold shrink-0">
              {(s.user.full_name?.charAt(0) ?? "?").toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{s.user.full_name}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#5BBF3A]"
                    style={{ width: `${s.pct}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {s.done}/{s.total}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-[#5BBF3A]">{s.pct}%</p>
              {s.overdue > 0 && (
                <p className="text-xs text-red-500">{s.overdue} overdue</p>
              )}
            </div>

            {confirmingId === s.user.id ? (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => removeStaff(s.user.id, s.user.full_name)}
                  disabled={removingId === s.user.id}
                  className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                >
                  {removingId === s.user.id ? "Removing…" : "Remove"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingId(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                aria-label={`Remove ${s.user.full_name} from department`}
                onClick={() => setConfirmingId(s.user.id)}
                disabled={!!removingId}
                className="shrink-0 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-30"
              >
                <X className="size-4" />
              </button>
            )}
            </div>
          ))}
        </div>
      )}

      <ManageStaffModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={onReload}
        departmentId={departmentId}
      />
    </div>
  );
}
