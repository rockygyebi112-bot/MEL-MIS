"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  Project,
  ProjectActivity,
  ProjectMilestone,
} from "@/lib/projects/types";
import { computeActivityPercent } from "@/lib/projects/status";
import { ActivityRow } from "./activity-row";
import { ActivitySidePanel } from "./activity-side-panel";
import { MilestoneFormModal } from "./milestone-form-modal";
import { ActivityFormModal } from "./activity-form-modal";
import { AttachmentsGallery } from "./attachments-gallery";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { deleteActivity, deleteMilestone } from "@/lib/projects/mutations";
import { Trash2, Target, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Filter = "all" | "overdue" | "attention" | "mine";

interface Props {
  project: Project;
  milestones: ProjectMilestone[];
  activities: ProjectActivity[];
  onChange: () => void;
}

export function ActivitiesPanel({
  project,
  milestones,
  activities,
  onChange,
}: Props) {
  const { user, isMELManager } = useUser();
  const currentUserId = user?.id;

  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [subParentId, setSubParentId] = useState<string | null>(null);
  const [attachmentCount, setAttachmentCount] = useState(0);
  
  // Collapsible milestones state
  const [collapsedMilestones, setCollapsedMilestones] = useState<Set<string>>(new Set());
  
  // Collapsible activities state (for main activities with sub-activities)
  const [collapsedActivities, setCollapsedActivities] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!openId) setAttachmentCount(0);
  }, [openId]);

  const childrenByParent = useMemo(() => {
    const map = new Map<string, ProjectActivity[]>();
    for (const a of activities) {
      if (a.parent_activity_id) {
        const arr = map.get(a.parent_activity_id) ?? [];
        arr.push(a);
        map.set(a.parent_activity_id, arr);
      }
    }
    return map;
  }, [activities]);

  // A row matches the filter if itself or any descendant matches.
  const matchesFilter = (a: ProjectActivity, today: Date): boolean => {
    const self = (() => {
      if (filter === "overdue")
        return !!(
          a.due_date && a.status !== "done" && new Date(a.due_date) < today
        );
      if (filter === "attention")
        return a.status === "blocked" || a.priority === "high";
      if (filter === "mine")
        return !!currentUserId && a.owner_user_id === currentUserId;
      return true;
    })();
    if (self) return true;
    const kids = childrenByParent.get(a.id) ?? [];
    return kids.some((c) => matchesFilter(c, today));
  };

  const today = new Date();
  const topLevel = activities.filter((a) => !a.parent_activity_id);
  const filteredTopLevel = topLevel.filter((a) => matchesFilter(a, today));

  const byMilestone = new Map<string | null, ProjectActivity[]>();
  for (const a of filteredTopLevel) {
    const key = a.milestone_id ?? null;
    byMilestone.set(key, [...(byMilestone.get(key) ?? []), a]);
  }

  const openActivity = openId
    ? activities.find((a) => a.id === openId) ?? null
    : null;

  const canPostUpdate =
    !!openActivity &&
    !!currentUserId &&
    (isMELManager || openActivity.owner_user_id === currentUserId);

  const nextOrderIndex =
    milestones.reduce((m, x) => Math.max(m, x.order_index), -1) + 1;

  const toggleMilestone = (milestoneId: string) => {
    setCollapsedMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(milestoneId)) {
        next.delete(milestoneId);
      } else {
        next.add(milestoneId);
      }
      return next;
    });
  };

  const toggleActivity = (activityId: string) => {
    setCollapsedActivities((prev) => {
      const next = new Set(prev);
      if (next.has(activityId)) {
        next.delete(activityId);
      } else {
        next.add(activityId);
      }
      return next;
    });
  };

  const renderActivity = (a: ProjectActivity, idx: number, arr: ProjectActivity[]) => {
    const kids = childrenByParent.get(a.id) ?? [];
    const visibleKids = kids.filter((c) => matchesFilter(c, today));
    const isLastInList = idx === arr.length - 1;
    const hasChildren = kids.length > 0;
    const isExpanded = !collapsedActivities.has(a.id);
    
    return (
      <div key={a.id}>
        <ActivityRow
          activity={a}
          onOpen={setOpenId}
          displayPercent={computeActivityPercent(a, activities)}
          childCount={kids.length}
          isExpanded={isExpanded}
          onToggleExpand={hasChildren ? () => toggleActivity(a.id) : undefined}
        />
        {/* Sub-activities with tree connector lines - only show if expanded */}
        {isExpanded && visibleKids.map((c, childIdx) => (
          <ActivityRow
            key={c.id}
            activity={c}
            onOpen={setOpenId}
            displayPercent={computeActivityPercent(c, activities)}
            indent
            showTreeLine
            isLastChild={childIdx === visibleKids.length - 1}
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      {isMELManager && (
        <div className="flex flex-wrap justify-end gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMilestoneModal(true)}
          >
            + Add Milestone
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setSubParentId(null);
              setShowActivityModal(true);
            }}
          >
            + Add Activity
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {(["all", "overdue", "attention", "mine"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1 rounded-full border ${
              filter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border"
            }`}
          >
            {f === "all"
              ? "All"
              : f === "overdue"
                ? "Overdue"
                : f === "attention"
                  ? "Needs attention"
                  : "My activities"}
          </button>
        ))}
      </div>

      {milestones.map((m) => {
        const rows = byMilestone.get(m.id) ?? [];
        const isCollapsed = collapsedMilestones.has(m.id);
        const activityCount = rows.length;
        const completedCount = rows.filter(r => r.status === "done").length;
        const progress = activityCount > 0 ? Math.round((completedCount / activityCount) * 100) : 0;
        
        // Hide milestones with no rows ONLY when a non-"all" filter is active,
        // so admins can still delete empty milestones in the default view.
        if (rows.length === 0 && filter !== "all") return null;
        
        return (
          <section key={m.id} className="mb-4">
            {/* Asana-style Milestone Card */}
            <div className="bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              {/* Milestone Header - Clickable to collapse/expand */}
              <button
                onClick={() => toggleMilestone(m.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                {/* Collapse/Expand Icon */}
                <span className="text-slate-400">
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </span>
                
                {/* Target Icon for Milestone */}
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600">
                  <Target className="w-4 h-4" />
                </span>
                
                {/* Milestone Title & Info */}
                <div className="flex-1 min-w-0 text-left">
                  <h3 className="text-sm font-semibold text-slate-900 truncate">
                    {m.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {completedCount} of {activityCount} complete • {progress}% progress
                  </p>
                </div>
                
                {/* Progress Bar */}
                {activityCount > 0 && (
                  <div className="w-24 hidden sm:block">
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          progress === 100 ? "bg-green-500" : "bg-indigo-500"
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Add Activity Button (for managers) */}
                {isMELManager && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSubParentId(null);
                      setShowActivityModal(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    title="Add activity to milestone"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
                
                {/* Delete Button (for managers) */}
                {isMELManager && (
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (
                        !confirm(
                          `Delete milestone "${m.name}"? Activities under it will become Ungrouped.`,
                        )
                      )
                        return;
                      try {
                        await deleteMilestone(m.id);
                        onChange();
                      } catch (err) {
                        alert(
                          err instanceof Error ? err.message : String(err),
                        );
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    aria-label={`Delete milestone ${m.name}`}
                    title="Delete milestone"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </button>
              
              {/* Collapsible Content */}
              {!isCollapsed && (
                <div className="border-t border-slate-100">
                  {rows.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-slate-500">
                        No activities in this milestone yet.
                      </p>
                      {isMELManager && (
                        <button
                          onClick={() => {
                            setSubParentId(null);
                            setShowActivityModal(true);
                          }}
                          className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          Add your first activity
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {rows.map(renderActivity)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        );
      })}

      {(byMilestone.get(null)?.length ?? 0) > 0 && (
        <section className="mb-4">
          {/* Ungrouped Section - styled differently from milestones */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700">Ungrouped Activities</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {(byMilestone.get(null) ?? []).map(renderActivity)}
            </div>
          </div>
        </section>
      )}

      {filteredTopLevel.length === 0 && (
        <div className="text-sm text-muted-foreground">
          No activities match this filter.
        </div>
      )}

      {openActivity && (
        <ActivitySidePanel
          project={project}
          activity={openActivity}
          allActivities={activities}
          currentUserId={currentUserId}
          canPostUpdate={canPostUpdate}
          attachmentCount={attachmentCount}
          onClose={() => setOpenId(null)}
          onChange={onChange}
          onAddSubactivity={
            isMELManager
              ? (parentId) => {
                  setSubParentId(parentId);
                  setShowActivityModal(true);
                }
              : undefined
          }
          onDelete={
            isMELManager
              ? async () => {
                  if (!openActivity) return;
                  const childCount = childrenByParent.get(openActivity.id)?.length ?? 0;
                  const msg =
                    childCount > 0
                      ? `Delete "${openActivity.title}" and its ${childCount} sub-activit${childCount === 1 ? "y" : "ies"}? This cannot be undone.`
                      : `Delete "${openActivity.title}"? This cannot be undone.`;
                  if (!confirm(msg)) return;
                  try {
                    await deleteActivity(openActivity.id);
                    setOpenId(null);
                    onChange();
                  } catch (err) {
                    alert(err instanceof Error ? err.message : String(err));
                  }
                }
              : undefined
          }
        >
          {currentUserId && (
            <AttachmentsGallery
              projectId={project.id}
              activityId={openActivity.id}
              currentUserId={currentUserId}
              canUpload={
                isMELManager || openActivity.owner_user_id === currentUserId
              }
              canDelete={isMELManager}
              onChange={onChange}
              onCountChange={setAttachmentCount}
            />
          )}
        </ActivitySidePanel>
      )}

      {isMELManager && (
        <>
          <MilestoneFormModal
            projectId={project.id}
            nextOrderIndex={nextOrderIndex}
            open={showMilestoneModal}
            onOpenChange={setShowMilestoneModal}
            onSaved={onChange}
          />
          {currentUserId && (
            <ActivityFormModal
              projectId={project.id}
              milestones={milestones}
              parentCandidates={topLevel}
              currentUserId={currentUserId}
              open={showActivityModal}
              onOpenChange={(o) => {
                setShowActivityModal(o);
                if (!o) setSubParentId(null);
              }}
              fixedParentId={subParentId ?? undefined}
              onSaved={onChange}
            />
          )}
        </>
      )}
    </div>
  );
}
