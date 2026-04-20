# Performance Responsive Desktop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add responsive `md:` / `lg:` breakpoints to the Performance pages so desktop uses screen real estate effectively. Mobile layout is never modified — only additive responsive classes and page-level container adjustments.

**Architecture:** Change container `max-width` at page level. Adjust `PerformanceHeroTile` typography at `lg:`. Turn ED home's dept list into a responsive grid. Split ED drilldown into 2 columns at `lg:`. Turn Manager's Goals and Staff tabs into grids at `md:+`.

**Tech Stack:** Next.js 15, React, Tailwind, TypeScript. No tests. Verification = `npx tsc --noEmit` + manual visual at 375/768/1280 px if preview auth allows.

**Spec:** [docs/superpowers/specs/2026-04-20-performance-responsive-design.md](../specs/2026-04-20-performance-responsive-design.md)

---

## File Map

**Modify:**
- `src/app/(dashboard)/performance/page.tsx` — container max-width
- `src/app/(dashboard)/performance/[departmentId]/page.tsx` — container max-widths for both branches
- `src/app/(dashboard)/performance/me/page.tsx` — add container wrapper
- `src/components/performance/performance-hero-tile.tsx` — responsive typography
- `src/components/performance/ed-home.tsx` — grid on dept list
- `src/components/performance/ed-drilldown.tsx` — 2-col split wrapper at lg
- `src/components/performance/goals-activities-tab.tsx` — md: 2-col goal grid
- `src/components/performance/staff-progress-tab.tsx` — md: grid for staff cards

**No changes:**
- All hooks, all lib types, all other components

---

## Task 1: Page-level containers + hero typography

**Files:**
- Modify: `src/app/(dashboard)/performance/page.tsx`
- Modify: `src/app/(dashboard)/performance/[departmentId]/page.tsx`
- Modify: `src/app/(dashboard)/performance/me/page.tsx`
- Modify: `src/components/performance/performance-hero-tile.tsx`

- [ ] **Step 1: `performance/page.tsx` — skeleton + ED container**

Change the skeleton wrapper on line 10:

Before:
```tsx
<div className="mx-auto max-w-[560px] space-y-4">
```
After:
```tsx
<div className="mx-auto max-w-[560px] lg:max-w-6xl space-y-4">
```

Change the ED wrapper on line 60:

Before:
```tsx
<div className="mx-auto max-w-[560px]">
  <EdHome />
</div>
```
After:
```tsx
<div className="mx-auto max-w-[560px] lg:max-w-6xl">
  <EdHome />
</div>
```

- [ ] **Step 2: `performance/[departmentId]/page.tsx` — ED drilldown container + Manager container**

Change the ED drilldown wrapper on line 27:

Before:
```tsx
<div className="mx-auto max-w-[560px]">
  <EdDrilldown departmentId={departmentId} />
</div>
```
After:
```tsx
<div className="mx-auto max-w-[560px] lg:max-w-5xl">
  <EdDrilldown departmentId={departmentId} />
</div>
```

Change the Manager branch (line 33):

Before:
```tsx
return <ManagerDashboard departmentId={departmentId} />;
```
After:
```tsx
return (
  <div className="mx-auto max-w-[560px] lg:max-w-6xl">
    <ManagerDashboard departmentId={departmentId} />
  </div>
);
```

- [ ] **Step 3: `performance/me/page.tsx` — add container**

Replace the entire file contents:

```tsx
import { StaffDashboard } from "@/components/performance/staff-dashboard";

export default function StaffPerformancePage() {
  return (
    <div className="mx-auto max-w-[560px] lg:max-w-3xl">
      <StaffDashboard />
    </div>
  );
}
```

- [ ] **Step 4: `performance-hero-tile.tsx` — responsive typography + padding**

Open the file and make three class changes to the existing JSX.

Outer container (currently `rounded-3xl p-5 text-white ${GRADIENTS[status]}`):

Before:
```tsx
<div className={`rounded-3xl p-5 text-white ${GRADIENTS[status]}`}>
```
After:
```tsx
<div className={`rounded-3xl p-5 lg:p-8 text-white ${GRADIENTS[status]}`}>
```

Big number (currently `text-[64px] font-extrabold leading-none tracking-tight`):

Before:
```tsx
<div className="text-[64px] font-extrabold leading-none tracking-tight">
```
After:
```tsx
<div className="text-[64px] lg:text-[96px] font-extrabold leading-none tracking-tight">
```

Percent sign (currently `text-[28px] ${ACCENT[status]}`):

Before:
```tsx
<span className={`text-[28px] ${ACCENT[status]}`}>%</span>
```
After:
```tsx
<span className={`text-[28px] lg:text-[40px] ${ACCENT[status]}`}>%</span>
```

Subline (currently `mt-3 text-[13px] text-white/80`):

Before:
```tsx
<div className="mt-3 text-[13px] text-white/80">
```
After:
```tsx
<div className="mt-3 text-[13px] lg:text-[15px] text-white/80">
```

- [ ] **Step 5: Verification**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/(dashboard)/performance/page.tsx "src/app/(dashboard)/performance/[departmentId]/page.tsx" src/app/(dashboard)/performance/me/page.tsx src/components/performance/performance-hero-tile.tsx
git commit -m "feat(performance): responsive containers + hero typography"
```

---

## Task 2: ED home — dept card grid

**Files:**
- Modify: `src/components/performance/ed-home.tsx`

- [ ] **Step 1: Change dept list wrapper to responsive grid**

In `ed-home.tsx`, locate the list wrapper (currently `<div className="space-y-2.5">` on line 101 wrapping the `departments.map((dept) => ...)`).

Before:
```tsx
<div className="space-y-2.5">
  {departments.map((dept) => (
    <DepartmentRowCard key={dept.id} dept={dept} />
  ))}
</div>
```

After:
```tsx
<div className="space-y-2.5 md:space-y-0 md:grid md:grid-cols-2 md:gap-3 lg:grid-cols-3">
  {departments.map((dept) => (
    <DepartmentRowCard key={dept.id} dept={dept} />
  ))}
</div>
```

This keeps the single-column stacked layout on mobile, and switches to a 2-col grid at md, 3-col at lg. No changes to the card component itself — the cards keep their row shape and just sit in a grid.

- [ ] **Step 2: Verification**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/performance/ed-home.tsx
git commit -m "feat(performance): ED home department grid on tablet+"
```

---

## Task 3: ED drilldown — 2-col split on desktop

**Files:**
- Modify: `src/components/performance/ed-drilldown.tsx`

- [ ] **Step 1: Split goals (left) from overdue + last submission (right) at lg**

In `ed-drilldown.tsx`, the current structure after the hero is:

```tsx
return (
  <div className="space-y-5 text-foreground">
    {/* header */}
    {/* hero tile */}
    {/* goals block */}
    {/* overdue block */}
    {/* last submission block */}
  </div>
);
```

Wrap the three blocks below the hero in a responsive grid. Replace the relevant section.

Locate the block starting with `{view.goals.length > 0 && (` (line 147) through the closing of the last submission block's `)}` (around line 189). Wrap all three sections in a new grid div.

Before:
```tsx
      {view.goals.length > 0 && (
        ...goals block...
      )}

      {view.overdue.length > 0 && (
        ...overdue block...
      )}

      {view.lastSubmission && (
        ...last submission block...
      )}
    </div>
  );
}
```

After:
```tsx
      <div className="lg:grid lg:grid-cols-[3fr_2fr] lg:gap-6 space-y-5 lg:space-y-0">
        <div className="space-y-5">
          {view.goals.length > 0 && (
            <div>
              <div className="text-[10px] tracking-[2px] font-bold text-muted-foreground">
                GOALS · Q{quarter}
              </div>
              <div className="mt-3 space-y-2">
                {view.goals.map((goal) => (
                  <GoalProgressCard key={goal.id} goal={goal} />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="space-y-5">
          {view.overdue.length > 0 && (
            <div>
              <div className="text-[10px] tracking-[2px] font-bold text-red-700 dark:text-[#FCA5A5]">
                OVERDUE · {view.overdue.length} ITEM
                {view.overdue.length === 1 ? "" : "S"}
              </div>
              <div className="mt-3 space-y-2">
                {view.overdue.map((a) => (
                  <OverdueActivityRow key={a.id} activity={a} />
                ))}
              </div>
            </div>
          )}

          {view.lastSubmission && (
            <div>
              <div className="text-[10px] tracking-[2px] font-bold text-muted-foreground">
                LAST SUBMISSION
              </div>
              <div className="mt-3 rounded-2xl bg-card border border-border p-3.5">
                <div className="text-[13px] font-semibold text-foreground">
                  {view.lastSubmission.activityTitle}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {view.lastSubmission.submittedByName} ·{" "}
                  {timeAgo(view.lastSubmission.submittedAt)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

Key point: on mobile, `lg:grid` is not active, so the `space-y-5` on the wrapper stacks the two inner columns vertically and their own `space-y-5` stacks the sections inside each column. The net visual at mobile is identical to the previous flat stack.

- [ ] **Step 2: Verification**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/performance/ed-drilldown.tsx
git commit -m "feat(performance): ED drilldown 2-col split on desktop"
```

---

## Task 4: Manager tabs — goal + staff grids

**Files:**
- Modify: `src/components/performance/goals-activities-tab.tsx`
- Modify: `src/components/performance/staff-progress-tab.tsx`

- [ ] **Step 1: `goals-activities-tab.tsx` — 2-col goal grid on md+**

In `goals-activities-tab.tsx`, locate the list wrapper (the `<div className="space-y-3">` around line 163 at the end of the component's return).

Before:
```tsx
      {goals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No goals for this quarter yet. Add one to get started.
        </div>
      ) : (
        goals.map((goal) => (
          <GoalRow
            key={goal.id}
            goal={goal}
            staff={staff}
            currentUserId={currentUserId}
            onReload={onReload}
          />
        ))
      )}
    </div>
  );
}
```

After:
```tsx
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
```

Note: the outer `<div className="space-y-3">` of the whole tab stays unchanged — the `Add Goal` button and the grid are separate siblings inside it.

- [ ] **Step 2: `staff-progress-tab.tsx` — staff card grid on md+ / 3-col on lg**

In `staff-progress-tab.tsx`, locate the `staff.map(...)` block around line 67.

Before:
```tsx
      {staff.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No staff assigned to this department yet. Click "Add Staff" to assign someone.
        </div>
      ) : (
        staff.map((s) => (
          <div
            key={s.user.id}
            className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4"
          >
            ...existing staff row content unchanged...
          </div>
        ))
      )}
```

After (wrap the map output in a grid):
```tsx
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
              ...existing staff row content unchanged...
            </div>
          ))}
        </div>
      )}
```

Keep all inner content (monogram div, name + progress bar div, pct div, remove button) exactly as it is today. Only the wrapper changes.

- [ ] **Step 3: Verification**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/performance/goals-activities-tab.tsx src/components/performance/staff-progress-tab.tsx
git commit -m "feat(performance): Manager goals + staff grids on tablet+"
```

---

## Task 5: Visual verification + push

- [ ] **Step 1: Final typecheck + lint**

Run: `npx tsc --noEmit` — expect no errors.
Run: `npm run lint` — expect no NEW errors beyond pre-existing ones in `use-performance-staff.ts` and `middleware.ts`.

- [ ] **Step 2: Try preview at three widths (if auth allows)**

If preview server starts and authenticates:
- Resize to 375px — confirm mobile layout unchanged
- Resize to 768px — confirm dept grid / staff grid appear as 2-col
- Resize to 1280px — confirm 3-col grids on ED home and Staff tab, 2-col split on ED drilldown, hero pct number grows

If preview auth blocks: document in final report and rely on typecheck.

- [ ] **Step 3: Push branch**

```bash
git push origin claude/intelligent-jemison-00281d
```

---

## Self-review notes

- Spec coverage: Task 1 covers containers + hero typography, Task 2 covers ED dept grid, Task 3 covers ED drilldown split, Task 4 covers Manager grids. Staff dashboard only gets container change (Task 1 Step 3) — intentional per spec (personal task list stays narrow and single-column).
- Type consistency: no type changes anywhere. Pure className edits.
- Mobile layout: every change uses `md:` / `lg:` prefixes (additive), preserving mobile. Exception: `space-y-X md:space-y-0` is required on grid wrappers to switch spacing strategy — mobile keeps `space-y`, md+ uses `gap`.
- No placeholders, no TBDs.
