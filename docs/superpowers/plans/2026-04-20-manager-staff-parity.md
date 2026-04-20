# Manager + Staff Dashboard Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the shared Performance primitives (`PerformanceHeroTile`, `StatusSegmentedBar`, `QuarterChip`) and the unified green-for-progress / purple-for-role color system to `manager-dashboard.tsx` and `staff-dashboard.tsx` and their supporting components.

**Architecture:** Pure UI changes. No hook/data changes. Reuse primitives already built for the ED redesign. Swap ad-hoc headers for `PerformanceHeroTile`, add `StatusSegmentedBar` below hero, replace `QuarterSelector` with `QuarterChip`, pill-ify `WeekNavigator`, and migrate hex literals to semantic tokens. Accent color swap: purple `#6B2D7B` → green `#5BBF3A` everywhere except a small role-marker eyebrow in the header and the Staff dept-goal banner border tint.

**Tech Stack:** Next.js, React, Tailwind, TypeScript, next-themes. No test framework wired up for these components — verification is `npm run typecheck` plus visual check in preview (light + dark mode).

**Spec:** [docs/superpowers/specs/2026-04-20-manager-staff-parity-design.md](../specs/2026-04-20-manager-staff-parity-design.md)

---

## File Map

**Modify:**
- `src/components/performance/manager-dashboard.tsx` — swap header/hero, add segmented bar, QuarterChip, tab color
- `src/components/performance/goals-activities-tab.tsx` — token migration, `bg-white` → `bg-card`
- `src/components/performance/staff-progress-tab.tsx` — token migration, swap `#6B2D7B` purple accents → `#5BBF3A` green (pct text, monogram bg)
- `src/components/performance/alerts-panel.tsx` — `bg-white` → `bg-card`
- `src/components/performance/staff-dashboard.tsx` — swap header/hero, add segmented bar, dept goal banner tokens
- `src/components/performance/week-navigator.tsx` — pill shape (rounded-full, muted bg)
- `src/components/performance/activity-card.tsx` — token migration, `#6B2D7B` attachment color → token

**Possibly modify (only if needed):**
- `src/components/performance/performance-hero-tile.tsx` — add optional `subline` prop override if current wording doesn't fit Staff usage

**No changes:**
- `src/hooks/use-performance-manager.ts`
- `src/hooks/use-performance-staff.ts`
- `src/lib/performance-utils.ts`
- `src/lib/types.ts`

---

## Task 1: Manager dashboard — header, hero, segmented bar, quarter chip

**Files:**
- Modify: `src/components/performance/manager-dashboard.tsx`

- [ ] **Step 1: Update imports**

At the top of `manager-dashboard.tsx`, replace the `QuarterSelector` import and add the new primitives:

```tsx
import { QuarterChip } from "./quarter-chip";
import { PerformanceHeroTile } from "./performance-hero-tile";
import { StatusSegmentedBar } from "./status-segmented-bar";
```

Remove: `import { QuarterSelector } from "./quarter-selector";`

- [ ] **Step 2: Compute goal-level status counts**

Inside the `ManagerDashboard` function, after the existing `pct` / `overdueCount` calculations, add:

```tsx
const goalsOnTrack = goals.filter((g) => g.status === "on_track").length;
const goalsAtRisk = goals.filter((g) => g.status === "at_risk").length;
const goalsBehind = goals.filter((g) => g.status === "behind").length;
```

- [ ] **Step 3: Rewrite the return block**

Replace the entire `return (…)` block (lines 71–178 in the current file) with:

```tsx
return (
  <div className="space-y-5">
    {/* Header */}
    <div className="flex items-center gap-3">
      <button
        onClick={() => router.push("/performance")}
        className="size-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
      >
        <ArrowLeft className="size-4" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold tracking-[2px] text-[#6B2D7B] uppercase">
          Manager · {department?.name ?? "Department"}
        </p>
        <h1 className="text-xl font-bold truncate mt-0.5">
          {loading ? "Loading…" : (department?.name ?? "Department")}
        </h1>
      </div>
      <div className="relative">
        <Bell className="size-5 text-muted-foreground" />
        {overdueCount > 0 && (
          <span className="absolute -top-1 -right-1 size-2 rounded-full bg-red-500" />
        )}
      </div>
    </div>

    {/* Hero tile + segmented bar */}
    {!loading && (
      <>
        <PerformanceHeroTile
          pct={pct}
          onTrackCount={goalsOnTrack}
          totalDepts={goals.length}
          doneActivities={doneCount}
          totalActivities={totalCount}
          trendDeltaPct={null}
          status={deptStatus}
        />
        <StatusSegmentedBar
          onTrack={goalsOnTrack}
          atRisk={goalsAtRisk}
          behind={goalsBehind}
        />
      </>
    )}

    {/* Quarter chip row */}
    <div className="flex justify-end">
      <QuarterChip
        year={year}
        quarter={quarter}
        onYearChange={setYear}
        onQuarterChange={setQuarter}
      />
    </div>

    {/* Tab bar */}
    <div className="flex border-b border-border">
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
            activeTab === tab
              ? "text-[#5BBF3A]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab}
          {tab === "Alerts" && overdueCount > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center size-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
              {overdueCount}
            </span>
          )}
          {activeTab === tab && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5BBF3A]" />
          )}
        </button>
      ))}
    </div>

    {/* Tab content */}
    {loading ? (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    ) : (
      <>
        {activeTab === "Goals & Activities" && user && (
          <GoalsActivitiesTab
            goals={goals}
            staff={staff}
            currentUserId={user.id}
            onAddGoal={() => setAddGoalOpen(true)}
            onReload={reload}
          />
        )}
        {activeTab === "Staff" && (
          <StaffProgressTab
            staff={staff}
            departmentId={departmentId}
            onReload={reload}
          />
        )}
        {activeTab === "Alerts" && deptSummary && (
          <AlertsPanel departments={[deptSummary]} />
        )}
      </>
    )}

    {user && (
      <AddGoalModal
        open={addGoalOpen}
        onClose={() => setAddGoalOpen(false)}
        onCreated={reload}
        departmentId={departmentId}
        year={year}
        quarter={quarter}
        createdBy={user.id}
      />
    )}
  </div>
);
```

- [ ] **Step 4: Also update the error branch to use tokens**

Replace the early-return error block:

```tsx
if (error) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
      {error}
    </div>
  );
}
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: no errors related to `manager-dashboard.tsx`.

- [ ] **Step 6: Commit**

```bash
git add src/components/performance/manager-dashboard.tsx
git commit -m "feat(performance): apply shared primitives to manager dashboard"
```

---

## Task 2: Manager inner tabs — token migration

**Files:**
- Modify: `src/components/performance/goals-activities-tab.tsx`
- Modify: `src/components/performance/staff-progress-tab.tsx`
- Modify: `src/components/performance/alerts-panel.tsx`

- [ ] **Step 1: `goals-activities-tab.tsx` — swap `bg-white` for `bg-card`**

In the `GoalRow` component, change the goal card container:

Before:
```tsx
<div className="rounded-xl border border-border/60 bg-white overflow-hidden">
```

After:
```tsx
<div className="rounded-xl border border-border/60 bg-card overflow-hidden">
```

- [ ] **Step 2: `staff-progress-tab.tsx` — swap `bg-white`, swap `#6B2D7B` purple accents to `#5BBF3A` green**

Make three changes to the staff row rendering (inside the `staff.map(...)` block):

Change A — card background (line ~70):

Before:
```tsx
className="flex items-center gap-4 rounded-xl border border-border/60 bg-white p-4"
```
After:
```tsx
className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4"
```

Change B — monogram bubble (line ~72). Keep purple here since this is a role/people identity cue, not a progress accent. Only change: add `dark:` safety for text contrast. Leave as:

```tsx
<div className="size-9 rounded-full bg-[#6B2D7B] text-white flex items-center justify-center text-sm font-semibold shrink-0">
```

(No change required — confirms intentional keep.)

Change C — the percent number (line ~92). Swap purple → green:

Before:
```tsx
<p className="text-sm font-bold text-[#6B2D7B]">{s.pct}%</p>
```
After:
```tsx
<p className="text-sm font-bold text-[#5BBF3A]">{s.pct}%</p>
```

- [ ] **Step 3: `alerts-panel.tsx` — swap `bg-white` for `bg-card`**

Two occurrences:

Empty state (line ~49):
```tsx
<div className="rounded-xl border border-border/60 bg-card p-5 text-center text-sm text-muted-foreground">
```

List container (line ~56):
```tsx
<div className="rounded-xl border border-border/60 bg-card divide-y divide-border/40">
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/performance/goals-activities-tab.tsx src/components/performance/staff-progress-tab.tsx src/components/performance/alerts-panel.tsx
git commit -m "feat(performance): migrate manager tab components to tokens + green accent"
```

---

## Task 3: Staff dashboard — header, hero, segmented bar

**Files:**
- Modify: `src/components/performance/staff-dashboard.tsx`

- [ ] **Step 1: Update imports**

At the top of `staff-dashboard.tsx`, add:

```tsx
import { PerformanceHeroTile } from "./performance-hero-tile";
import { StatusSegmentedBar } from "./status-segmented-bar";
```

- [ ] **Step 2: Derive hero status from `myPct`**

Inside the component, after the existing `done` / `overdue` / `pending` / `myPct` calculations, add:

```tsx
const heroStatus: "on_track" | "at_risk" | "behind" =
  myPct >= 80 ? "on_track" : myPct >= 50 ? "at_risk" : "behind";
```

- [ ] **Step 3: Replace header block**

Replace the existing Header `<div>` (lines ~45–51) with:

```tsx
{/* Header */}
<div>
  <p className="text-[10px] font-bold tracking-[2px] text-[#6B2D7B] uppercase">
    Staff · {department?.name ?? "No department"}
  </p>
  <h1 className="text-2xl font-bold tracking-tight mt-0.5">My Performance</h1>
  <p className="text-sm text-muted-foreground mt-0.5">{user?.full_name}</p>
</div>
```

- [ ] **Step 4: Replace the 4-stat grid with hero tile + segmented bar**

Replace the entire `{/* Personal summary strip */}` grid block (lines ~53–71) with:

```tsx
{/* Hero tile */}
<PerformanceHeroTile
  pct={myPct}
  onTrackCount={done}
  totalDepts={activities.length}
  doneActivities={done}
  totalActivities={activities.length}
  trendDeltaPct={null}
  status={heroStatus}
/>

{/* Segmented bar */}
<StatusSegmentedBar
  onTrack={done}
  atRisk={pending}
  behind={overdue}
/>
```

Note: The hero tile's built-in subline will read `{done} of {activities.length} departments on track · {done} of {activities.length} activities done this quarter`. This is incorrect for Staff context. Resolve in Step 5.

- [ ] **Step 5: Add optional `subline` prop to `PerformanceHeroTile`**

Modify `src/components/performance/performance-hero-tile.tsx`:

Change the props interface:

```tsx
interface PerformanceHeroTileProps {
  pct: number;
  onTrackCount: number;
  totalDepts: number;
  doneActivities: number;
  totalActivities: number;
  trendDeltaPct: number | null;
  status: "on_track" | "at_risk" | "behind";
  subline?: string;
  eyebrow?: string;
}
```

Destructure the new props and use them:

```tsx
export function PerformanceHeroTile({
  pct,
  onTrackCount,
  totalDepts,
  doneActivities,
  totalActivities,
  trendDeltaPct,
  status,
  subline,
  eyebrow = "ORG HEALTH",
}: PerformanceHeroTileProps) {
```

Replace the hard-coded eyebrow text:

```tsx
<div className={`text-[11px] font-bold tracking-[2px] ${ACCENT[status]}`}>
  {eyebrow}
</div>
```

Replace the hard-coded subline block:

```tsx
<div className="mt-3 text-[13px] text-white/80">
  {subline ??
    `${onTrackCount} of ${totalDepts} departments on track · ${doneActivities} of ${totalActivities} activities done this quarter`}
</div>
```

- [ ] **Step 6: Pass the correct subline + eyebrow from Staff**

Back in `staff-dashboard.tsx`, update the hero call from Step 4 to:

```tsx
<PerformanceHeroTile
  pct={myPct}
  onTrackCount={done}
  totalDepts={activities.length}
  doneActivities={done}
  totalActivities={activities.length}
  trendDeltaPct={null}
  status={heroStatus}
  eyebrow="MY WEEK"
  subline={`${done} of ${activities.length} activities done this week${overdue > 0 ? ` · ${overdue} overdue` : ""}`}
/>
```

- [ ] **Step 7: Typecheck**

Run: `npm run typecheck`
Expected: no errors. The `PerformanceHeroTile` callsite in `ed-home.tsx` must still compile because the new props are optional.

- [ ] **Step 8: Commit**

```bash
git add src/components/performance/staff-dashboard.tsx src/components/performance/performance-hero-tile.tsx
git commit -m "feat(performance): apply hero + segmented bar to staff dashboard"
```

---

## Task 4: Staff dept goal banner + week navigator + activity card

**Files:**
- Modify: `src/components/performance/staff-dashboard.tsx`
- Modify: `src/components/performance/week-navigator.tsx`
- Modify: `src/components/performance/activity-card.tsx`

- [ ] **Step 1: `staff-dashboard.tsx` — dept goal banner tokens**

Replace the dept goal banner block (originally lines 77–95 in the pre-change file — now located after the segmented bar) with:

```tsx
{goalTitle && (
  <div className="rounded-xl border border-[#6B2D7B]/30 bg-card p-4">
    <p className="text-xs font-semibold uppercase tracking-widest text-[#6B2D7B] mb-1">
      Department Goal
    </p>
    <p className="text-sm font-medium text-foreground">{goalTitle}</p>
    <div className="mt-2 flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-[#5BBF3A]"
          style={{ width: `${deptProgressPct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground shrink-0">
        Dept {deptProgressPct}%
      </span>
    </div>
  </div>
)}
```

Also update the error branch:

```tsx
if (error) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
      {error}
    </div>
  );
}
```

And the empty activities state:

```tsx
<div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
  No activities due this week.
</div>
```
(No change — already uses tokens.)

- [ ] **Step 2: `week-navigator.tsx` — pill-ify**

Replace the outer `<div>` (line 50) with a pill shape:

Before:
```tsx
<div className="flex items-center justify-between rounded-xl border border-border/60 bg-white px-4 py-3">
```

After:
```tsx
<div className="flex items-center justify-between rounded-full bg-muted px-2 py-1.5">
```

Update the prev/next buttons to match QuarterChip's visual weight:

Before (both buttons):
```tsx
className="size-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
```

After (both buttons):
```tsx
className="size-7 flex items-center justify-center rounded-full hover:bg-background transition-colors"
```

Update the disabled next button (add `disabled:opacity-30` already present — keep):

```tsx
<button
  onClick={() => shift(7)}
  disabled={isFuture}
  className="size-7 flex items-center justify-center rounded-full hover:bg-background transition-colors disabled:opacity-30"
>
```

Update the label to be slightly smaller and semibold:

Before:
```tsx
<span className="text-sm font-medium">{getWeekLabel(weekDate)}</span>
```

After:
```tsx
<span className="text-xs font-semibold text-foreground px-2">{getWeekLabel(weekDate)}</span>
```

- [ ] **Step 3: `activity-card.tsx` — bg-white → bg-card and attachment color → token**

Change A — the `borderClass` ternary (line ~30). Keep the colored variants (red for overdue, green for done) — these are status cues, not surface colors. Swap only the neutral `bg-white` default:

Before:
```tsx
const borderClass =
  activity.status === "overdue"
    ? "border-red-300 bg-red-50"
    : activity.status === "done"
    ? "border-green-200 bg-green-50/30"
    : "border-border/60 bg-white";
```

After:
```tsx
const borderClass =
  activity.status === "overdue"
    ? "border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-900"
    : activity.status === "done"
    ? "border-green-200 bg-green-50/30 dark:bg-green-950/20 dark:border-green-900"
    : "border-border/60 bg-card";
```

Change B — attachment filename color (line ~106). Swap purple → foreground token:

Before:
```tsx
className="flex items-center gap-1.5 text-xs text-[#6B2D7B]"
```
After:
```tsx
className="flex items-center gap-1.5 text-xs text-foreground"
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/performance/staff-dashboard.tsx src/components/performance/week-navigator.tsx src/components/performance/activity-card.tsx
git commit -m "feat(performance): finalize staff tokens (banner, week nav, activity card)"
```

---

## Task 5: Visual verification

**Files:** none (verification only)

- [ ] **Step 1: Try the preview server**

Run preview_start. If it starts, navigate to `/performance` (ED view), `/performance/[known-dept-id]` (Manager view if logged in as non-admin), and `/performance` (Staff view if logged in as staff).

If auth blocks access (known issue from prior PRs), skip to Step 4.

- [ ] **Step 2: Check light mode**

For each of the three views, confirm:
- Role eyebrow is small, uppercase, purple
- Hero tile shows the correct percentage and status color
- Segmented bar appears below the hero
- QuarterChip (Manager) / WeekNavigator (Staff) is pill-shaped
- Tab bar underline (Manager) is green
- No white boxes that look out of place in dark mode (should not apply to light mode — this is a sanity check that `bg-card` reads as white here)

Capture preview_screenshot for each view.

- [ ] **Step 3: Check dark mode**

Toggle the theme via the Topbar sun/moon. Confirm same views render with correct dark surfaces (no lingering `bg-white`).

Capture preview_screenshot for each view.

- [ ] **Step 4: If preview blocked by auth**

Document that visual verification was not possible. Rely on `npm run typecheck` as the primary gate. Flag to the user explicitly in the final summary.

- [ ] **Step 5: Final typecheck and lint**

Run: `npm run typecheck`
Run: `npm run lint`
Expected: both clean.

- [ ] **Step 6: Push branch**

```bash
git push origin claude/compassionate-einstein-ec759e
```

- [ ] **Step 7: Report PR URL**

PR is not yet open. User opens manually at:
`https://github.com/rockygyebi112-bot/MEL-MIS/pull/new/claude/compassionate-einstein-ec759e`

Include this URL in the final summary to the user.

---

## Self-review notes

- **Spec coverage:** Every item in the spec maps to a task — Manager header/hero/bar/chip (Task 1), Manager inner tabs (Task 2), Staff header/hero/bar + hero prop extension (Task 3), Staff banner/week nav/activity card (Task 4), verification (Task 5).
- **Type consistency:** `PerformanceHeroTile` props extended with optional `subline` and `eyebrow` — existing `ed-home.tsx` callsite remains valid since both are optional with defaults.
- **Color system:** `#5BBF3A` used for progress / active-state accents, `#6B2D7B` used only for role-eyebrow text and dept-goal banner border tint.
- **No placeholders, no TBDs, every code change shown in full.**
