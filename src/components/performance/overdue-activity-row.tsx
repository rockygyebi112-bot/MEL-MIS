"use client";

import type { ActivityWithStatus } from "@/lib/types";

interface OverdueActivityRowProps {
  activity: ActivityWithStatus;
}

function daysLate(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  return Math.max(1, Math.floor((now.getTime() - due.getTime()) / 86400000));
}

export function OverdueActivityRow({ activity }: OverdueActivityRowProps) {
  const late = daysLate(activity.due_date);
  return (
    <div className="rounded-2xl bg-[#151B27] p-3.5 border-l-[3px] border-[#DC2626]">
      <div className="text-[13px] font-semibold text-white">{activity.title}</div>
      <div className="mt-1.5 flex justify-between text-[11px]">
        <span className="text-[#8891A6]">{activity.assignee.full_name}</span>
        <span className="text-[#FCA5A5]">
          {late} day{late === 1 ? "" : "s"} late
        </span>
      </div>
    </div>
  );
}
