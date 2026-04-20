# Performance UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix responsive cramping on the ED performance dashboard and apply a coherent, softer visual language across the performance module (ED home, manager, staff).

**Architecture:** Extend `DepartmentSummary` and the performance hooks to return the extra data needed by enriched cards (manager, trend, next activity). Introduce shared Tailwind v4 theme tokens for status surfaces/accents and a tiny SVG sparkline component. Rework the hero tile and card components to consume the tokens and the new data. Adjust only the responsive breakpoints on the ED shell — no routing or data model changes.

**Tech Stack:** Next.js 16 (fork — consult `node_modules/next/dist/docs/` before touching page-level APIs), React 19, Tailwind CSS v4 (`@theme` in `globals.css`), Supabase JS, lucide-react, TypeScript 5.

**Testing note:** The project has no unit-test harness (no Jest/Vitest). Verification is: (1) `npx tsc --noEmit` for type safety, (2) `npm run lint` clean, (3) `npm run build` clean, (4) visual verification via `preview_*` tools at three widths: 1024px, 1280px, 1536px, both light and dark mode.

---

## File map

**New:**
- `src/components/performance/sparkline.tsx` — inline SVG sparkline.

**Modified:**
- `src/lib/types.ts` — extend `DepartmentSummary` and `GoalWithActivities` with new fields.
- `src/lib/performance-utils.ts` — add `weeksInQuarter`, `computeWeeklyTrend` helpers.
- `src/hooks/use-performance-ed.ts` — return `orgWeeklyTrend`; populate new per-dept fields.
- `src/hooks/use-performance-manager.ts` — populate `weekly_trend` + `next_activity` per goal.
- `src/app/globals.css` — add `--perf-*` tokens (light + dark).
- `src/components/performance/performance-hero-tile.tsx` — shrink, detune, accept `weeklyTrend` prop.
- `src/components/performance/department-row-card.tsx` — panel variant: owner, sparkline, next-due footer; use tokens.
- `src/components/performance/goal-progress-card.tsx` — same enrichment pattern; use tokens.
- `src/components/performance/activity-card.tsx` — use tokens for status surfaces.
- `src/components/performance/ed-home.tsx` — breakpoints `300px`, `md:grid-cols-2 xl:grid-cols-3`.
- `src/components/performance/manager-dashboard.tsx` — adopt sidebar shell; underlined tabs.
- `src/components/performance/staff-dashboard.tsx` — header tightening, token adoption.

---

## Task 1: Extend types

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Add new fields to `DepartmentSummary` and `GoalWithActivities`**

In `src/lib/types.ts`, replace the two interfaces so they end at these shapes:

```ts
export interface GoalWithActivities extends PerformanceGoal {
  activities: ActivityWithStatus[];
  status: GoalStatus;
  progress_pct: number;
  weekly_trend: number[]; // up to 8 entries, oldest → newest, each 0–100
  next_activity: { title: string; due_date: string } | null;
}

export interface DepartmentSummary extends Department {
  goals: GoalWithActivities[];
  progress_pct: number;
  status: GoalStatus;
  staff_count: number;
  done_count: number;
  pending_count: number;
  overdue_count: number;
  manager_name: string | null;
  manager_avatar_url: string | null;
  weekly_trend: number[]; // up to 8 entries, oldest → newest, each 0–100
  next_activity: { title: string; due_date: string } | null;
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: errors only in files that construct `DepartmentSummary` / `GoalWithActivities` — those get fixed in later tasks. Note the list for verification at the end.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "types(performance): add manager/trend/next-activity fields"
```

---

## Task 2: Add trend & quarter helpers

**Files:**
- Modify: `src/lib/performance-utils.ts`

- [ ] **Step 1: Add helpers at the bottom of the file**

Append to `src/lib/performance-utils.ts`:

```ts
/**
 * ISO week index (0-based) of a date within its quarter.
 * Returns null if the date is outside the given year/quarter.
 */
export function weekIndexInQuarter(
  date: Date,
  year: number,
  quarter: number
): number | null {
  const qStartMonth = (quarter - 1) * 3; // 0, 3, 6, 9
  const qStart = new Date(year, qStartMonth, 1);
  const qEnd = new Date(year, qStartMonth + 3, 0, 23, 59, 59);
  if (date < qStart || date > qEnd) return null;
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.floor((date.getTime() - qStart.getTime()) / msPerWeek);
}

/**
 * Build an 8-entry (or shorter) weekly trend of % completion.
 * Each entry is the cumulative % of activities submitted on or before that week's end,
 * out of total activities in scope. Returns up to `maxWeeks` most-recent weeks.
 */
export function buildWeeklyTrend(
  activities: Array<{ due_date: string; submission_at: string | null }>,
  now: Date,
  maxWeeks = 8
): number[] {
  const total = activities.length;
  if (total === 0) return [];

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const points: number[] = [];
  for (let i = maxWeeks - 1; i >= 0; i--) {
    const weekEnd = new Date(now.getTime() - i * msPerWeek);
    const doneByThen = activities.filter(
      (a) => a.submission_at !== null && new Date(a.submission_at) <= weekEnd
    ).length;
    points.push(Math.round((doneByThen / total) * 100));
  }
  return points;
}
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`
Expected: same preexisting errors as task 1 — no new ones from these helpers.

- [ ] **Step 3: Commit**

```bash
git add src/lib/performance-utils.ts
git commit -m "feat(performance): add weeklyTrend and weekIndexInQuarter helpers"
```

---

## Task 3: Add shared Tailwind tokens

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add `--perf-*` tokens inside the `@theme inline { ... }` block**

Append inside the existing `@theme inline` block (just before the closing `}`, after the SRSF purple block):

```css
  /* Performance status surfaces */
  --color-perf-surface-ontrack: var(--perf-surface-ontrack);
  --color-perf-surface-atrisk: var(--perf-surface-atrisk);
  --color-perf-surface-behind: var(--perf-surface-behind);
  --color-perf-accent-ontrack: var(--perf-accent-ontrack);
  --color-perf-accent-atrisk: var(--perf-accent-atrisk);
  --color-perf-accent-behind: var(--perf-accent-behind);
  --color-perf-border-ontrack: var(--perf-border-ontrack);
  --color-perf-border-atrisk: var(--perf-border-atrisk);
  --color-perf-border-behind: var(--perf-border-behind);
```

- [ ] **Step 2: Add light-mode values in `:root`**

Append inside the `:root { ... }` block (before the closing `}`):

```css
  /* Performance status surfaces — light */
  --perf-surface-ontrack: hsl(104 50% 96%);
  --perf-surface-atrisk: hsl(38 92% 96%);
  --perf-surface-behind: hsl(0 85% 97%);
  --perf-accent-ontrack: hsl(104 65% 32%);
  --perf-accent-atrisk: hsl(30 80% 38%);
  --perf-accent-behind: hsl(0 72% 44%);
  --perf-border-ontrack: hsl(104 40% 85%);
  --perf-border-atrisk: hsl(38 80% 82%);
  --perf-border-behind: hsl(0 70% 88%);
```

- [ ] **Step 3: Add dark-mode values in `.dark`**

Append inside the `.dark { ... }` block (before the closing `}`):

```css
  /* Performance status surfaces — dark */
  --perf-surface-ontrack: hsl(140 30% 12%);
  --perf-surface-atrisk: hsl(30 40% 12%);
  --perf-surface-behind: hsl(0 35% 13%);
  --perf-accent-ontrack: hsl(140 70% 70%);
  --perf-accent-atrisk: hsl(38 90% 65%);
  --perf-accent-behind: hsl(0 80% 78%);
  --perf-border-ontrack: hsl(140 40% 22%);
  --perf-border-atrisk: hsl(30 50% 25%);
  --perf-border-behind: hsl(0 50% 28%);
```

- [ ] **Step 4: Verify build compiles the CSS**

Run: `npm run build`
Expected: build succeeds; no CSS errors referencing `--perf-*`.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "style(performance): add shared status surface/accent tokens"
```

---

## Task 4: Sparkline component

**Files:**
- Create: `src/components/performance/sparkline.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/performance/sparkline.tsx` with exactly this content:

```tsx
"use client";

interface SparklineProps {
  values: number[]; // each 0–100
  accentClassName?: string; // stroke color via tailwind text-* class, e.g. "text-perf-accent-ontrack"
  height?: number; // px
  className?: string;
}

export function Sparkline({
  values,
  accentClassName = "text-foreground",
  height = 32,
  className = "",
}: SparklineProps) {
  if (values.length < 2) return null;

  const width = 100; // viewBox units, scales via CSS
  const maxY = 100;
  const stepX = width / (values.length - 1);
  const toY = (v: number) => height - (v / maxY) * height;

  const points = values.map((v, i) => `${i * stepX},${toY(v)}`).join(" ");
  const areaPath =
    `M0,${height} ` +
    values.map((v, i) => `L${i * stepX},${toY(v)}`).join(" ") +
    ` L${width},${height} Z`;

  const lastX = (values.length - 1) * stepX;
  const lastY = toY(values[values.length - 1]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={`w-full ${accentClassName} ${className}`}
      style={{ height }}
      aria-hidden="true"
    >
      <path d={areaPath} fill="currentColor" opacity={0.12} />
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX} cy={lastY} r={2.5} fill="currentColor" />
    </svg>
  );
}
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`
Expected: no new errors in this file.

- [ ] **Step 3: Commit**

```bash
git add src/components/performance/sparkline.tsx
git commit -m "feat(performance): add Sparkline component"
```

---

## Task 5: Extend `usePerformanceEd` hook

**Files:**
- Modify: `src/hooks/use-performance-ed.ts`

- [ ] **Step 1: Expand supabase selects and return shape**

Replace the body of `usePerformanceEd` (keeping the function signature) so that:
1. The goals select additionally pulls the submission `submitted_at` (it already does via `submission:activity_submissions(*)`, but ensure it's kept).
2. Fetch department managers in a new query: from `user_departments` where `is_manager = true`, joined to `user_profiles` for name/avatar.
3. Compute `weekly_trend` and `next_activity` per department and in aggregate.
4. Return `orgWeeklyTrend: number[]` alongside existing values.

Apply these edits:

**5a.** Add imports at the top:

```ts
import { buildWeeklyTrend } from "@/lib/performance-utils";
```

**5b.** After step 3 (staff counts), add a managers fetch:

```ts
// 3.1 Managers per department
const { data: mgrRows } = await supabase
  .from("user_departments")
  .select("department_id, user:user_profiles!user_id(full_name, avatar_url)")
  .eq("is_manager", true);

const managerMap: Record<
  string,
  { full_name: string | null; avatar_url: string | null }
> = {};
(mgrRows ?? []).forEach(
  (r: {
    department_id: string;
    user: { full_name: string | null; avatar_url: string | null } | null;
  }) => {
    if (r.user) {
      managerMap[r.department_id] = {
        full_name: r.user.full_name,
        avatar_url: r.user.avatar_url,
      };
    }
  }
);
```

Note: If `user_profiles` does not have an `avatar_url` column in this schema, drop `avatar_url` from both the select and the type. Check by running:

```bash
grep -n "avatar_url" src/lib/types.ts src/hooks/*.ts
```

If no match, use `avatar_url: null` as the value in `managerMap` entries and omit it from the select.

**5c.** Inside the `summaries` mapping, after `allActivities` is built and before the `return { ... }`, add:

```ts
const trendInput = allActivities.map((a) => ({
  due_date: a.due_date,
  submission_at: a.submission?.submitted_at ?? null,
}));
const weeklyTrend = buildWeeklyTrend(trendInput, new Date(), 8);

const upcoming = allActivities
  .filter((a) => a.status === "pending")
  .sort((a, b) => a.due_date.localeCompare(b.due_date));
const nextActivity = upcoming[0]
  ? { title: upcoming[0].title, due_date: upcoming[0].due_date }
  : null;

// Also annotate each goal with its own trend + next
enrichedGoals.forEach((g) => {
  const gTrendInput = g.activities.map((a) => ({
    due_date: a.due_date,
    submission_at: a.submission?.submitted_at ?? null,
  }));
  (g as GoalWithActivities).weekly_trend = buildWeeklyTrend(
    gTrendInput,
    new Date(),
    8
  );
  const gUpcoming = g.activities
    .filter((a) => a.status === "pending")
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
  (g as GoalWithActivities).next_activity = gUpcoming[0]
    ? { title: gUpcoming[0].title, due_date: gUpcoming[0].due_date }
    : null;
});
```

And when constructing `enrichedGoals.map(...)`, initialize the new fields to `[]` / `null` in the returned object so the type is satisfied *before* the post-loop annotation runs — change the returned object to include:

```ts
weekly_trend: [],
next_activity: null,
```

**5d.** In the department `return { ...dept, ... }`, add:

```ts
manager_name: managerMap[dept.id]?.full_name ?? null,
manager_avatar_url: managerMap[dept.id]?.avatar_url ?? null,
weekly_trend: weeklyTrend,
next_activity: nextActivity,
```

**5e.** After the `summaries` are computed, build `orgWeeklyTrend`:

```ts
const orgTrendInput = summaries.flatMap((d) =>
  d.goals.flatMap((g) =>
    g.activities.map((a) => ({
      due_date: a.due_date,
      submission_at: a.submission?.submitted_at ?? null,
    }))
  )
);
const orgWeeklyTrend = buildWeeklyTrend(orgTrendInput, new Date(), 8);
```

**5f.** Add `orgWeeklyTrend` to state and to the return value:

```ts
const [orgWeeklyTrend, setOrgWeeklyTrend] = useState<number[]>([]);
// ...
setOrgWeeklyTrend(orgWeeklyTrend);
// ...
return { departments, trendDeltaPct, orgWeeklyTrend, loading, error, reload: load };
```

Note variable shadowing: rename the local `orgWeeklyTrend` to `orgTrendPoints` in computation, then `setOrgWeeklyTrend(orgTrendPoints)`.

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`
Expected: no new errors in `use-performance-ed.ts`. Existing type errors elsewhere still expected.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-performance-ed.ts
git commit -m "feat(performance): enrich ED hook with manager, trend, next activity"
```

---

## Task 6: Extend `usePerformanceManager` hook

**Files:**
- Modify: `src/hooks/use-performance-manager.ts`

- [ ] **Step 1: Add trend + next_activity annotation per goal**

In `src/hooks/use-performance-manager.ts`, after goals are enriched and before the hook returns, add:

```ts
import { buildWeeklyTrend } from "@/lib/performance-utils";
// ...
enrichedGoals.forEach((g) => {
  const gTrendInput = g.activities.map((a) => ({
    due_date: a.due_date,
    submission_at: a.submission?.submitted_at ?? null,
  }));
  g.weekly_trend = buildWeeklyTrend(gTrendInput, new Date(), 8);
  const gUpcoming = g.activities
    .filter((a) => a.status === "pending")
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
  g.next_activity = gUpcoming[0]
    ? { title: gUpcoming[0].title, due_date: gUpcoming[0].due_date }
    : null;
});
```

Ensure the initial object literal for each goal includes `weekly_trend: []` and `next_activity: null` so the type is satisfied at construction.

If the hook file does not presently use a variable named `enrichedGoals`, adapt the snippet to the actual variable name; read the file first to confirm (search for `weekly_trend` does not yet exist).

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`
Expected: no new errors in this file.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-performance-manager.ts
git commit -m "feat(performance): annotate goals with trend + next activity"
```

---

## Task 7: Rebalance `PerformanceHeroTile`

**Files:**
- Modify: `src/components/performance/performance-hero-tile.tsx`

- [ ] **Step 1: Rewrite the component**

Replace the entire file contents with:

```tsx
"use client";

import { Sparkline } from "./sparkline";

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
  weeklyTrend?: number[];
}

const SURFACE: Record<PerformanceHeroTileProps["status"], string> = {
  on_track:
    "bg-[linear-gradient(135deg,#3D9922_0%,#2F7319_100%)] dark:bg-[linear-gradient(135deg,#14532D_0%,#1A2030_100%)]",
  at_risk:
    "bg-[linear-gradient(135deg,#C77A0A_0%,#8A4F08_100%)] dark:bg-[linear-gradient(135deg,#422006_0%,#1A2030_100%)]",
  behind:
    "bg-[linear-gradient(135deg,#BE3434_0%,#7F1D1D_100%)] dark:bg-[linear-gradient(135deg,#450A0A_0%,#1A2030_100%)]",
};

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
  weeklyTrend = [],
}: PerformanceHeroTileProps) {
  const trendText =
    trendDeltaPct === null
      ? null
      : `${trendDeltaPct >= 0 ? "▲" : "▼"} ${Math.abs(trendDeltaPct)}% vs last quarter`;

  return (
    <div className={`rounded-3xl p-4 lg:p-5 text-white ${SURFACE[status]}`}>
      <div className="text-[11px] font-bold tracking-[2px] text-white/85">
        {eyebrow}
      </div>
      <div className="mt-1.5 flex items-end gap-2.5">
        <div className="text-[48px] lg:text-[64px] font-extrabold leading-none tracking-tight tabular-nums">
          {pct}
          <span className="text-[22px] lg:text-[28px] text-white/85">%</span>
        </div>
        {trendText && (
          <div className="pb-1.5 text-xs text-white/85">{trendText}</div>
        )}
      </div>
      <div className="mt-2 text-[13px] text-white/80 tabular-nums">
        {subline ??
          `${onTrackCount} of ${totalDepts} departments on track · ${doneActivities} of ${totalActivities} activities done this quarter`}
      </div>
      {weeklyTrend.length >= 2 && (
        <div className="mt-3 text-white/70">
          <Sparkline values={weeklyTrend} accentClassName="text-white" height={28} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`
Expected: no new errors in this file.

- [ ] **Step 3: Commit**

```bash
git add src/components/performance/performance-hero-tile.tsx
git commit -m "style(performance): rebalance hero tile — smaller, softer, with sparkline"
```

---

## Task 8: Fix ED home breakpoints and pass new data

**Files:**
- Modify: `src/components/performance/ed-home.tsx`

- [ ] **Step 1: Update shell, skeleton, grid, and hero props**

In `src/components/performance/ed-home.tsx` apply these exact changes:

**8a.** In the `usePerformanceEd` destructure, add `orgWeeklyTrend`:

```ts
const { departments, trendDeltaPct, orgWeeklyTrend, loading, error } = usePerformanceEd(
  year,
  quarter
);
```

**8b.** In the loading skeleton, change the outer wrapper and inner grid:

```tsx
<div className="text-foreground space-y-4 lg:space-y-0 lg:grid lg:grid-cols-[300px_1fr] lg:gap-8 lg:items-start">
```

and

```tsx
<div className="space-y-2 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4">
```

**8c.** In the main return, change the outer wrapper:

```tsx
<div className="text-foreground space-y-5 lg:space-y-0 lg:grid lg:grid-cols-[300px_1fr] lg:gap-8 lg:items-start">
```

**8d.** Pass `weeklyTrend={orgWeeklyTrend}` to `<PerformanceHeroTile>`:

```tsx
<PerformanceHeroTile
  pct={pct}
  onTrackCount={onTrack}
  totalDepts={departments.length}
  doneActivities={doneActivities}
  totalActivities={totalActivities}
  trendDeltaPct={trendDeltaPct}
  status={overallStatus}
  weeklyTrend={orgWeeklyTrend}
/>
```

**8e.** Change the desktop grid:

```tsx
<div className="hidden lg:grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
```

(Keep `hidden lg:grid` so it only activates at lg+ — the `md:` and `xl:` breakpoints nested inside still work because md<lg<xl.)

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`
Expected: no new errors; previously-expected construction errors for `DepartmentSummary` should now originate only in the card component (Task 9).

- [ ] **Step 3: Commit**

```bash
git add src/components/performance/ed-home.tsx
git commit -m "fix(performance): responsive breakpoints for ED dashboard grid"
```

---

## Task 9: Enrich `DepartmentRowCard` panel variant

**Files:**
- Modify: `src/components/performance/department-row-card.tsx`

- [ ] **Step 1: Rewrite the file**

Replace the entire file contents with:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { Sparkline } from "./sparkline";
import type { DepartmentSummary } from "@/lib/types";

interface DepartmentRowCardProps {
  dept: DepartmentSummary;
  variant?: "row" | "panel";
}

function monogram(name: string): string {
  const words = name.replace(/&/g, "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return "??";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const STATUS = {
  on_track: {
    surfacePanel:
      "bg-card border border-border",
    badgeBg: "bg-perf-surface-ontrack",
    accent: "text-perf-accent-ontrack",
    pillLabel: "ON TRACK",
    sparkColor: "text-perf-accent-ontrack",
  },
  at_risk: {
    surfacePanel:
      "bg-perf-surface-atrisk border border-perf-border-atrisk",
    badgeBg: "bg-perf-surface-atrisk",
    accent: "text-perf-accent-atrisk",
    pillLabel: "AT RISK",
    sparkColor: "text-perf-accent-atrisk",
  },
  behind: {
    surfacePanel:
      "bg-perf-surface-behind border border-perf-border-behind",
    badgeBg: "bg-perf-surface-behind",
    accent: "text-perf-accent-behind",
    pillLabel: "BEHIND",
    sparkColor: "text-perf-accent-behind",
  },
} as const;

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function DepartmentRowCard({ dept, variant = "row" }: DepartmentRowCardProps) {
  const router = useRouter();
  const s = STATUS[dept.status];
  const total = dept.done_count + dept.pending_count + dept.overdue_count;

  if (variant === "panel") {
    return (
      <button
        type="button"
        onClick={() => router.push(`/performance/${dept.id}`)}
        className={`w-full text-left rounded-2xl p-4 flex flex-col gap-2.5 h-full transition-transform active:scale-[0.99] ${s.surfacePanel}`}
      >
        {/* Header: monogram + status pill */}
        <div className="flex items-center justify-between gap-2">
          <div
            className={`size-10 rounded-xl flex items-center justify-center font-extrabold text-[14px] ${s.badgeBg} ${s.accent}`}
          >
            {monogram(dept.name)}
          </div>
          <span
            className={`text-[9px] tracking-[1px] font-bold px-2 py-0.5 rounded-full ${s.badgeBg} ${s.accent}`}
          >
            {s.pillLabel}
          </span>
        </div>

        {/* Name */}
        <div className="text-[15px] font-bold text-foreground truncate">
          {dept.name}
        </div>

        {/* Manager */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
          {dept.manager_avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dept.manager_avatar_url}
              alt=""
              className="size-5 rounded-full object-cover"
            />
          ) : (
            <div className="size-5 rounded-full bg-muted" />
          )}
          <span className="truncate">
            {dept.manager_name ?? (
              <span className="italic text-muted-foreground/70">
                No manager assigned
              </span>
            )}
          </span>
        </div>

        {/* Sparkline */}
        {dept.weekly_trend.length >= 2 && (
          <Sparkline values={dept.weekly_trend} accentClassName={s.sparkColor} height={32} />
        )}

        {/* Progress bar + inline % */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-[#5BBF3A]"
              style={{ width: `${dept.progress_pct}%` }}
            />
          </div>
          <div
            className={`text-[15px] font-extrabold tracking-tight tabular-nums ${s.accent}`}
          >
            {dept.progress_pct}%
          </div>
        </div>

        {/* Footer: next-due + overdue/on-schedule */}
        <div className="flex items-center justify-between gap-2 min-w-0 mt-auto">
          <div className="text-[11px] text-muted-foreground truncate min-w-0">
            {dept.next_activity
              ? `Next · ${dept.next_activity.title} · ${formatShortDate(
                  dept.next_activity.due_date
                )}`
              : total === 0
              ? "No activities"
              : "Nothing upcoming"}
          </div>
          {dept.overdue_count > 0 ? (
            <span className="shrink-0 text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded-full bg-perf-surface-behind text-perf-accent-behind">
              {dept.overdue_count} OVERDUE
            </span>
          ) : (
            <span className="shrink-0 text-[10px] text-muted-foreground">
              On schedule
            </span>
          )}
        </div>
      </button>
    );
  }

  // row variant — mobile
  const subLine =
    dept.overdue_count > 0
      ? `${dept.done_count}/${total} done · ${dept.overdue_count} overdue`
      : `${dept.done_count} of ${total} activities complete`;

  return (
    <button
      type="button"
      onClick={() => router.push(`/performance/${dept.id}`)}
      className={`w-full text-left rounded-2xl p-4 flex items-center gap-3.5 transition-transform active:scale-[0.99] ${s.surfacePanel}`}
    >
      <div
        className={`size-11 rounded-2xl flex items-center justify-center font-extrabold text-[15px] ${s.badgeBg} ${s.accent}`}
      >
        {monogram(dept.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-bold text-foreground truncate">
          {dept.name}
        </div>
        <div className={`text-[11px] mt-0.5 ${s.accent}`}>{subLine}</div>
      </div>
      <div className="text-right shrink-0">
        <div className={`text-[20px] font-extrabold tracking-tight tabular-nums ${s.accent}`}>
          {dept.progress_pct}%
        </div>
        <div className={`text-[9px] tracking-[1px] font-bold ${s.accent}`}>
          {s.pillLabel}
        </div>
      </div>
    </button>
  );
}
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`
Expected: 0 errors remaining in the performance module.

- [ ] **Step 3: Commit**

```bash
git add src/components/performance/department-row-card.tsx
git commit -m "feat(performance): enrich department panel card with owner, trend, next-due"
```

---

## Task 10: Enrich `GoalProgressCard`

**Files:**
- Modify: `src/components/performance/goal-progress-card.tsx`

- [ ] **Step 1: Rewrite the file**

Replace the entire file contents with:

```tsx
"use client";

import { Sparkline } from "./sparkline";
import type { GoalWithActivities } from "@/lib/types";

interface GoalProgressCardProps {
  goal: GoalWithActivities;
}

const STATUS = {
  on_track: {
    accent: "text-perf-accent-ontrack",
    surface: "bg-card border border-border",
    spark: "text-perf-accent-ontrack",
  },
  at_risk: {
    accent: "text-perf-accent-atrisk",
    surface: "bg-perf-surface-atrisk border border-perf-border-atrisk",
    spark: "text-perf-accent-atrisk",
  },
  behind: {
    accent: "text-perf-accent-behind",
    surface: "bg-perf-surface-behind border border-perf-border-behind",
    spark: "text-perf-accent-behind",
  },
} as const;

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function GoalProgressCard({ goal }: GoalProgressCardProps) {
  const s = STATUS[goal.status];
  const total = goal.activities.length;
  const done = goal.activities.filter((a) => a.status === "done").length;
  const overdue = goal.activities.filter((a) => a.status === "overdue").length;

  return (
    <div className={`rounded-2xl p-4 flex flex-col gap-2.5 ${s.surface}`}>
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="text-[14px] font-semibold text-foreground truncate">
          {goal.title}
        </div>
        <div className={`text-sm font-bold tabular-nums ${s.accent}`}>
          {goal.progress_pct}%
        </div>
      </div>

      {goal.weekly_trend.length >= 2 && (
        <Sparkline values={goal.weekly_trend} accentClassName={s.spark} height={28} />
      )}

      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-[#5BBF3A]"
          style={{ width: `${goal.progress_pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px] min-w-0">
        <div className="text-muted-foreground truncate min-w-0">
          {goal.next_activity
            ? `Next · ${goal.next_activity.title} · ${formatShortDate(
                goal.next_activity.due_date
              )}`
            : total === 0
            ? "No activities"
            : "Nothing upcoming"}
        </div>
        {overdue > 0 ? (
          <span className="shrink-0 text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded-full bg-perf-surface-behind text-perf-accent-behind">
            {overdue} OVERDUE
          </span>
        ) : (
          <span className="shrink-0 text-muted-foreground tabular-nums">
            {done}/{total} done
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/performance/goal-progress-card.tsx
git commit -m "feat(performance): enrich GoalProgressCard with trend and next-due"
```

---

## Task 11: Tokenize `ActivityCard` colors

**Files:**
- Modify: `src/components/performance/activity-card.tsx`

- [ ] **Step 1: Replace the `borderClass` computation**

Find the current definition:

```tsx
const borderClass =
  activity.status === "overdue"
    ? "border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-900"
    : activity.status === "done"
    ? "border-green-200 bg-green-50/30 dark:bg-green-950/20 dark:border-green-900"
    : "border-border/60 bg-card";
```

Replace it with:

```tsx
const borderClass =
  activity.status === "overdue"
    ? "border-perf-border-behind bg-perf-surface-behind"
    : activity.status === "done"
    ? "border-perf-border-ontrack bg-perf-surface-ontrack/50"
    : "border-border/60 bg-card";
```

Also replace `text-red-600` on the overdue due-line with `text-perf-accent-behind` and `text-red-500` on the Clock icon with `text-perf-accent-behind`, and `text-green-500` on the CheckCircle2 icon with `text-perf-accent-ontrack`.

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/performance/activity-card.tsx
git commit -m "style(performance): tokenize ActivityCard status colors"
```

---

## Task 12: Manager dashboard — sidebar shell + underlined tabs

**Files:**
- Modify: `src/components/performance/manager-dashboard.tsx`

- [ ] **Step 1: Read the file to locate the render block**

Read the full file to understand its current return JSX (the header, the hero tile block, the tabs, and the tab content areas). Do not skip this read — the skeleton of the JSX below needs to match what's there.

- [ ] **Step 2: Wrap the hero + KPIs in a sidebar and tabs content in a main column**

Convert the top-level return to:

```tsx
return (
  <div className="text-foreground space-y-5 lg:space-y-0 lg:grid lg:grid-cols-[300px_1fr] lg:gap-8 lg:items-start">
    {/* ── Left sidebar ── */}
    <div className="space-y-5 lg:sticky lg:top-6">
      {/* existing header (back button, dept name, QuarterChip) stays here */}
      {/* existing <PerformanceHeroTile ... /> stays here */}
      {/* existing <StatusSegmentedBar ... /> stays here */}
      {/* existing KPI chips block stays here */}
    </div>

    {/* ── Right: tabs + content ── */}
    <div className="space-y-5">
      {/* tabs bar — replace existing tabs with underlined style */}
      <div className="flex gap-6 border-b border-border">
        {TABS.map((t) => {
          const active = t === activeTab;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTab(t)}
              className={`relative pb-2.5 text-sm font-semibold transition-colors ${
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
              {active && (
                <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-[#5BBF3A] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* existing per-tab content stays here, unchanged */}
    </div>
  </div>
);
```

Move the existing header, hero tile, segmented bar, and KPI chips into the left sidebar block (whatever their current JSX is — do not rewrite their internals). Keep the existing tab-body rendering in the right column.

If the manager dashboard currently renders a "Bell" / alerts button or "Back" button in the header, keep it in the sidebar header area where the current layout has it.

- [ ] **Step 3: Verify compile**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/performance/manager-dashboard.tsx
git commit -m "refactor(performance): sidebar shell + underlined tabs on manager dashboard"
```

---

## Task 13: Staff dashboard — header + token adoption

**Files:**
- Modify: `src/components/performance/staff-dashboard.tsx`

- [ ] **Step 1: Tighten the header**

Replace the existing header block (the `"Staff" eyebrow + My Performance + user name line"`) with:

```tsx
<div>
  <div className="text-xs text-muted-foreground">
    {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
  </div>
  <h1 className="text-2xl font-bold tracking-tight mt-0.5">My Performance</h1>
  <p className="text-sm text-muted-foreground mt-0.5">
    {user?.full_name}
    {department?.name ? ` · ${department.name}` : ""}
  </p>
</div>
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/performance/staff-dashboard.tsx
git commit -m "style(performance): tighten staff dashboard header to match ED"
```

---

## Task 14: Full verification pass

**Files:** none (verification only).

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: exit 0 with no errors. If there are warnings on files you touched, fix them.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: successful build.

- [ ] **Step 4: Visual verification at 3 widths, light mode**

Start the dev server with `preview_start`, navigate to `/performance` as an ED user, and capture screenshots via `preview_screenshot` at:
- 1024px wide
- 1280px wide
- 1536px wide

Confirm for each:
- Department name is on one line (no 3-line wrap).
- `%` value does not overlap any subline text.
- Org Health tile + segmented bar + 3 KPI chips all visible without scrolling on a 1080px-tall viewport.
- Sparkline renders in both the hero tile and each dept card when trend data exists.
- Owner avatar/name visible; "No manager assigned" shows italic when absent.

- [ ] **Step 5: Visual verification, dark mode**

Toggle dark mode (via the existing theme toggle) and repeat width 1280px. Confirm the status surfaces are legible and do not clash with card backgrounds.

- [ ] **Step 6: Manager + staff views**

Navigate to `/performance/[departmentId]` for a dept as a manager; confirm sidebar layout, underlined tabs, goal cards show trend + next-due.
Navigate as a staff user to `/performance/me`; confirm header matches ED pattern and activity cards use tokenized colors.

- [ ] **Step 7: Final commit if verification prompted any fixes**

If earlier steps required code changes, commit them under a single:

```bash
git commit -m "fix(performance): address visual verification findings"
```

Otherwise skip.

---

## Notes for the executing agent

- `AGENTS.md` states this repo uses a forked Next.js — if you need to touch page-level APIs (dynamic params, metadata, etc.), consult `node_modules/next/dist/docs/` first. This plan does not touch any page-level APIs; all edits are client components and hooks.
- When the plan says "rewrite the file," the new content *fully replaces* the old — do not merge.
- When the plan says "apply these edits," make minimal targeted edits preserving surrounding code.
- If `user_profiles.avatar_url` does not exist in this schema, treat the avatar as always null (drop the column from the managers select, set `avatar_url: null` in the map). Do not add a DB migration — that is out of scope for this polish.
- Commit after every task — no batching.
