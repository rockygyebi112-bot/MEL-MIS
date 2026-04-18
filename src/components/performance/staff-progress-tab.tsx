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

  async function removeStaff(userId: string, name: string) {
    if (!confirm(`Remove ${name} from this department?`)) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("user_departments")
      .delete()
      .eq("user_id", userId)
      .eq("department_id", departmentId);

    if (error) {
      toast.error("Failed to remove: " + error.message);
    } else {
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
        staff.map((s) => (
          <div
            key={s.user.id}
            className="flex items-center gap-4 rounded-xl border border-border/60 bg-white p-4"
          >
            <div className="size-9 rounded-full bg-[#6B2D7B] text-white flex items-center justify-center text-sm font-semibold shrink-0">
              {s.user.full_name.charAt(0).toUpperCase()}
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
              <p className="text-sm font-bold text-[#6B2D7B]">{s.pct}%</p>
              {s.overdue > 0 && (
                <p className="text-xs text-red-500">{s.overdue} overdue</p>
              )}
            </div>

            <button
              onClick={() => removeStaff(s.user.id, s.user.full_name)}
              className="shrink-0 text-muted-foreground hover:text-red-500 transition-colors"
              title="Remove from department"
            >
              <X className="size-4" />
            </button>
          </div>
        ))
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
