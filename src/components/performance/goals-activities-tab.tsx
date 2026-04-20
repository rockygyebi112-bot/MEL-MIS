"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddActivityModal } from "./add-activity-modal";
import { ActivityCard } from "./activity-card";
import {
  GOAL_STATUS_CLASSES,
  GOAL_STATUS_LABEL,
} from "@/lib/performance-utils";
import type { GoalWithActivities } from "@/lib/types";
import type { StaffMemberProgress } from "@/hooks/use-performance-manager";

interface GoalsActivitiesTabProps {
  goals: GoalWithActivities[];
  staff: StaffMemberProgress[];
  currentUserId: string;
  departmentId: string;
  onAddGoal: () => void;
  onReload: () => void;
}

function GoalRow({
  goal,
  staff,
  currentUserId,
  departmentId,
  onReload,
}: {
  goal: GoalWithActivities;
  staff: StaffMemberProgress[];
  currentUserId: string;
  departmentId: string;
  onReload: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [addActivityOpen, setAddActivityOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-muted/30"
      >
        {expanded ? (
          <ChevronDown className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{goal.title}</p>
          {goal.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {goal.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[120px]">
              <div
                className="h-full rounded-full bg-[#5BBF3A]"
                style={{ width: `${goal.progress_pct}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{goal.progress_pct}%</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${GOAL_STATUS_CLASSES[goal.status]}`}>
              {GOAL_STATUS_LABEL[goal.status]}
            </span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/40 p-3 space-y-2">
          {goal.activities.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">
              No activities yet
            </p>
          ) : (
            goal.activities.map((act) => (
              <ActivityCard
                key={act.id}
                activity={act}
                currentUserId={currentUserId}
                departmentId={departmentId}
                onReload={onReload}
              />
            ))
          )}
          <Button
            size="sm"
            variant="outline"
            className="w-full h-8 text-xs"
            onClick={() => setAddActivityOpen(true)}
          >
            <Plus className="size-3.5 mr-1" />
            Add activity
          </Button>
        </div>
      )}

      <AddActivityModal
        open={addActivityOpen}
        onClose={() => setAddActivityOpen(false)}
        onCreated={onReload}
        goalId={goal.id}
        goalTitle={goal.title}
        staff={staff}
        createdBy={currentUserId}
      />
    </div>
  );
}

export function GoalsActivitiesTab({
  goals,
  staff,
  currentUserId,
  departmentId,
  onAddGoal,
  onReload,
}: GoalsActivitiesTabProps) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={onAddGoal}>
          <Plus className="size-4 mr-1.5" />
          Add Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No goals for this quarter yet. Add one to get started.
        </div>
      ) : (
        <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-3">
          {goals.map((goal) => (
            <GoalRow
              key={goal.id}
              goal={goal}
              staff={staff}
              currentUserId={currentUserId}
              onReload={onReload}
            />
          ))}
        </div>
      )}
    </div>
  );
}
