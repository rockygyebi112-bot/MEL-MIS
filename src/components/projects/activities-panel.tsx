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
import { Trash2 } from "lucide-react";

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

  const renderRow = (a: ProjectActivity) => {
    const kids = childrenByParent.get(a.id) ?? [];
    const visibleKids = kids.filter((c) => matchesFilter(c, today));
    return (
      <div key={a.id}>
        <ActivityRow
          activity={a}
          onOpen={setOpenId}
          displayPercent={computeActivityPercent(a, activities)}
          childCount={kids.length}
        />
        {visibleKids.map((c) => (
          <ActivityRow
            key={c.id}
            activity={c}
            onOpen={setOpenId}
            displayPercent={computeActivityPercent(c, activities)}
            indent
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
        // Hide milestones with no rows ONLY when a non-"all" filter is active,
        // so admins can still delete empty milestones in the default view.
        if (rows.length === 0 && filter !== "all") return null;
        return (
          <section key={m.id} className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">{m.name}</h3>
              {isMELManager && (
                <button
                  type="button"
                  onClick={async () => {
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
                  className="text-xs text-muted-foreground hover:text-red-600 inline-flex items-center gap-1"
                  aria-label={`Delete milestone ${m.name}`}
                  title="Delete milestone"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {rows.length === 0 ? (
              <div className="rounded border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
                No activities under this milestone yet.
              </div>
            ) : (
              <div className="rounded border border-border divide-y divide-border">
                {rows.map(renderRow)}
              </div>
            )}
          </section>
        );
      })}

      {(byMilestone.get(null)?.length ?? 0) > 0 && (
        <section className="mb-6">
          <h3 className="text-sm font-semibold mb-2">Ungrouped</h3>
          <div className="rounded border border-border divide-y divide-border">
            {(byMilestone.get(null) ?? []).map(renderRow)}
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
