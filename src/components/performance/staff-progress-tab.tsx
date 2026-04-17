"use client";

import type { StaffMemberProgress } from "@/hooks/use-performance-manager";

interface StaffProgressTabProps {
  staff: StaffMemberProgress[];
}

export function StaffProgressTab({ staff }: StaffProgressTabProps) {
  if (staff.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No staff assigned to this department yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {staff.map((s) => (
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
        </div>
      ))}
    </div>
  );
}
