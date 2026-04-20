"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Paperclip, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProofOfWorkModal } from "./proof-of-work-modal";
import type { ActivityWithStatus } from "@/lib/types";

interface ActivityCardProps {
  activity: ActivityWithStatus;
  currentUserId: string;
  departmentId: string;
  onReload: () => void;
}

export function ActivityCard({
  activity,
  currentUserId,
  departmentId,
  onReload,
}: ActivityCardProps) {
  const [expanded, setExpanded] = useState(activity.status === "overdue");
  const [proofOpen, setProofOpen] = useState(false);

  const dueLabel = new Date(activity.due_date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  const borderClass =
    activity.status === "overdue"
      ? "border-perf-border-behind bg-perf-surface-behind"
      : activity.status === "done"
      ? "border-perf-border-ontrack bg-perf-surface-ontrack/50"
      : "border-border/60 bg-card";

  return (
    <div className={`rounded-xl border p-4 ${borderClass}`}>
      {/* Header row */}
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className="mt-0.5 shrink-0">
          {activity.status === "done" ? (
            <CheckCircle2 className="size-5 text-perf-accent-ontrack" />
          ) : activity.status === "overdue" ? (
            <Clock className="size-5 text-perf-accent-behind" />
          ) : (
            <div className="size-5 rounded-full border-2 border-muted-foreground/30" />
          )}
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium ${
              activity.status === "done"
                ? "line-through text-muted-foreground"
                : "text-foreground"
            }`}
          >
            {activity.title}
          </p>
          <p
            className={`text-xs mt-0.5 ${
              activity.status === "overdue"
                ? "text-perf-accent-behind font-medium"
                : "text-muted-foreground"
            }`}
          >
            Due {dueLabel}
            {activity.status === "overdue" && " · OVERDUE"}
          </p>
        </div>

        {/* Expand toggle (for done activities) */}
        {activity.status === "done" && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 text-muted-foreground"
          >
            {expanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>
        )}
      </div>

      {/* Done: proof summary (expandable) */}
      {activity.status === "done" && expanded && activity.submission && (
        <div className="mt-3 ml-8 space-y-2">
          <p className="text-xs text-muted-foreground">
            Submitted{" "}
            {new Date(activity.submission.submitted_at).toLocaleDateString(
              "en-GB",
              { day: "numeric", month: "short", year: "numeric" }
            )}
          </p>
          <p className="text-sm text-foreground">{activity.submission.description}</p>
          {activity.attachments.length > 0 && (
            <div className="space-y-1">
              {activity.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-1.5 text-xs text-foreground"
                >
                  <Paperclip className="size-3" />
                  {att.file_name}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending / Overdue: action button */}
      {(activity.status === "pending" || activity.status === "overdue") && (
        <div className="mt-3 ml-8">
          <Button
            size="sm"
            className="h-9 min-w-[120px] bg-[#5BBF3A] hover:bg-[#4da830] text-white"
            onClick={() => setProofOpen(true)}
          >
            Mark as Done
          </Button>
        </div>
      )}

      <ProofOfWorkModal
        open={proofOpen}
        onClose={() => setProofOpen(false)}
        onSubmitted={onReload}
        activityId={activity.id}
        activityTitle={activity.title}
        submittedBy={currentUserId}
        departmentId={departmentId}
        goalId={activity.goal_id}
      />
    </div>
  );
}
