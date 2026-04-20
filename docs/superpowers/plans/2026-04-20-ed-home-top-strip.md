# ED Home Top-Strip Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `EdHome` from a cramped single-column (or sidebar) layout into a desktop top-strip layout so the department grid gets the full content width.

**Architecture:** Pure UI restructure of one file. The outer dashboard shell already provides a 256px nav sidebar (`lg:ml-64`) — stacking another sidebar inside the page crushes the department grid. The fix: vertical stack of header → top-strip (hero + KPI chips + status bar) → full-width department grid. `DepartmentRowCard`'s existing `variant="panel"` is reused without changes.

**Tech Stack:** Next.js, React, Tailwind, TypeScript. No test framework — verification is `npx tsc --noEmit` + visual check at 1024px/1280px/1440px/375px.

**Spec:** [docs/superpowers/specs/2026-04-20-ed-home-top-strip.md](../specs/2026-04-20-ed-home-top-strip.md)

**Base file (pre-change) to reference:** [src/components/performance/ed-home.tsx](../../../src/components/performance/ed-home.tsx). If the worktree base includes the earlier sidebar layout (from PR #18, commit range `93674d6`), the destination state is the same — replace whatever is there with the code in Task 2.

---

## File Map

**Modify:**
- `src/components/performance/ed-home.tsx` — restructure return, add top-strip, widen grid, update loading skeleton

**No changes:**
- `src/components/performance/department-row-card.tsx` — `variant="panel"` already exists
- `src/components/performance/performance-hero-tile.tsx`, `status-segmented-bar.tsx`, `quarter-chip.tsx` — unchanged
- `src/app/(dashboard)/performance/page.tsx` — container already width-constrained
- All hooks and lib

---

## Task 1: Confirm panel variant exists

**Files:**
- Read: `src/components/performance/department-row-card.tsx`

- [ ] **Step 1: Verify panel variant**

Open `src/components/performance/department-row-card.tsx`. Confirm the component accepts a `variant?: "row" | "panel"` prop and renders a vertical card when `variant === "panel"`. If it does NOT, stop and escalate — this plan assumes the panel variant from the prior ED home work already exists in the worktree. If it does, proceed to Task 2.

No code change in this task.

---

## Task 2: Replace EdHome return with top-strip layout

**Files:**
- Modify: `src/components/performance/ed-home.tsx`

- [ ] **Step 1: Replace the file contents**

Overwrite the entire file `src/components/performance/ed-home.tsx` with the following. This preserves all existing state, data, and derived values; only the render tree and skeleton change.

```tsx
"use client";

import { useState } from "react";
import { PerformanceHeroTile } from "./performance-hero-tile";
import { StatusSegmentedBar } from "./status-segmented-bar";
import { DepartmentRowCard } from "./department-row-card";
import { QuarterChip } from "./quarter-chip";
import { usePerformanceEd } from "@/hooks/use-performance-ed";

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function EdHome() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [quarter, setQuarter] = useState(Math.ceil((now.getMonth() + 1) / 3));

  const { departments, trendDeltaPct, loading, error } = usePerformanceEd(
    year,
    quarter
  );

  if (error) {
    return (
      <div className="rounded-2xl bg-destructive/10 border border-destructive/40 p-5 text-sm text-destructive">
        Failed to load performance data: {error}
      </div>
    );
  }

  const onTrack = departments.filter((d) => d.status === "on_track").length;
  const atRisk = departments.filter((d) => d.status === "at_risk").length;
  const behind = departments.filter((d) => d.status === "behind").length;

  const totalActivities = departments.reduce(
    (s, d) => s + d.done_count + d.pending_count + d.overdue_count,
    0
  );
  const doneActivities = departments.reduce((s, d) => s + d.done_count, 0);
  const pct =
    totalActivities === 0
      ? 0
      : Math.round((doneActivities / totalActivities) * 100);

  const overallStatus: "on_track" | "at_risk" | "behind" =
    behind > 0 ? "behind" : atRisk > 0 ? "at_risk" : "on_track";

  if (loading) {
    return (
      <div className="space-y-5 text-foreground">
        <div className="h-8 w-40 rounded-lg bg-muted animate-pulse" />
        <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-6 lg:items-stretch">
          <div className="h-40 rounded-3xl bg-muted animate-pulse" />
          <div className="flex flex-col gap-3">
            <div className="hidden lg:grid lg:grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
            <div className="h-6 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
        <div className="space-y-2 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-[72px] lg:h-36 rounded-2xl bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const kpiChips = [
    { value: departments.length, label: "Departments" },
    { value: totalActivities, label: "Activities" },
    { value: onTrack, label: "On Track" },
  ] as const;

  return (
    <div className="space-y-5 text-foreground">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">{formatDate(now)}</div>
          <h1 className="text-2xl font-bold tracking-tight mt-0.5">
            Performance
          </h1>
        </div>
        <QuarterChip
          year={year}
          quarter={quarter}
          onYearChange={setYear}
          onQuarterChange={setQuarter}
        />
      </div>

      {/* Top strip — desktop two-column, mobile stacked */}
      <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-6 lg:items-stretch">
        <PerformanceHeroTile
          pct={pct}
          onTrackCount={onTrack}
          totalDepts={departments.length}
          doneActivities={doneActivities}
          totalActivities={totalActivities}
          trendDeltaPct={trendDeltaPct}
          status={overallStatus}
        />

        <div className="flex flex-col gap-3 lg:h-full lg:justify-between">
          {/* KPI chips — desktop only, 3-up row */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-2">
            {kpiChips.map(({ value, label }) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3"
              >
                <span className="text-2xl font-extrabold text-foreground">
                  {value}
                </span>
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          <StatusSegmentedBar
            onTrack={onTrack}
            atRisk={atRisk}
            behind={behind}
          />
        </div>
      </div>

      {/* Department grid */}
      {departments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No departments yet.
        </div>
      ) : (
        <>
          {/* Mobile: row cards */}
          <div className="lg:hidden space-y-2.5">
            {departments.map((dept) => (
              <DepartmentRowCard key={dept.id} dept={dept} />
            ))}
          </div>

          {/* Desktop: panel cards, full width */}
          <div className="hidden lg:grid grid-cols-1 xl:grid-cols-3 gap-4">
            {departments.map((dept) => (
              <DepartmentRowCard key={dept.id} dept={dept} variant="panel" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

Note on the grid columns: `hidden lg:grid grid-cols-1 xl:grid-cols-3 gap-4`. At `lg` (1024–1279px) this renders 1 column by default; the real multi-column layout kicks in at `xl` (1280+) with 3 columns. Since most users will be at `xl` or wider (1280+) and this component sits inside a `lg:ml-64` shell, a 2-column at `lg` would cram cards to ~300px each — better to show 1 wide column at `lg` and 3 at `xl`. This matches the spec's card-width table for `xl` (~350px) and `2xl` (~430px).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors. If errors reference `variant` on `DepartmentRowCard`, Task 1 was skipped — stop and address.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no new errors. Pre-existing errors in `use-performance-staff.ts` and `middleware.ts` are acceptable.

- [ ] **Step 4: Commit**

```bash
git add src/components/performance/ed-home.tsx
git commit -m "feat(performance): ED home top-strip layout"
```

---

## Task 3: Visual verification

- [ ] **Step 1: Start dev server**

Run: `npm run dev` (or use the preview tooling if available).

- [ ] **Step 2: Check desktop at 1440px**

Navigate to `/performance` as an Executive Director. Confirm:
- Hero tile on the left, KPI chips (3-up row) + status bar stacked on the right.
- Department cards render in 3 columns, each wide enough that names like "Admin & HR" render on one line.
- No horizontal scrollbar.

- [ ] **Step 3: Check desktop at 1024px (lg)**

Resize to 1024px. Confirm:
- Top strip still two columns (hero + right stack).
- Department cards render in 1 wide column.
- KPI chips still visible in the right stack.

- [ ] **Step 4: Check mobile at 375px**

Resize to 375px. Confirm:
- Single-column stack: header → hero → status bar → row cards.
- KPI chips are hidden.
- No layout regressions vs. the previous mobile version.

- [ ] **Step 5: Check empty state**

If a test account with zero departments is available, confirm the dashed "No departments yet." block renders in place of the grid. If no such account, skip and note that this code path wasn't visually verified.

---

## Task 4: Push branch

- [ ] **Step 1: Push**

```bash
git push origin claude/unruffled-almeida-963196
```

Expected: push succeeds. If `gh` is available, open a PR; otherwise provide the user the compare URL for manual PR creation.

---

## Self-Review

**Spec coverage:**
- ✅ Problem (double-sidebar, cramped cards) → Task 2 removes sidebar wrapper, widens grid
- ✅ Section 1 page structure (vertical stack) → Task 2 return JSX
- ✅ Section 2 top strip (two-column grid, hero + chips/bar) → Task 2 top-strip block
- ✅ KPI labels "Departments / Activities / On Track" → Task 2 `kpiChips` array (note: "Activities" shortened from "Total Activities" per spec)
- ✅ Section 3 department grid (1 col mobile, 1 col lg, 3 col xl) → Task 2 grid classes
- ✅ Section 4 loading skeleton mirrors real layout → Task 2 early return
- ✅ Mobile unchanged (`lg:hidden` row list, KPI chips hidden) → Task 2
- ✅ Non-goal: no `DepartmentRowCard` changes → Task 1 verifies only
- ✅ Verification plan → Task 3

**Placeholder scan:** None found. All code blocks are complete. No "TBD" or "similar to".

**Type consistency:**
- `variant="panel"` matches the existing `variant?: "row" | "panel"` prop on `DepartmentRowCard`.
- All props on `PerformanceHeroTile`, `StatusSegmentedBar`, `QuarterChip` preserved from the original file.
- `overallStatus` type annotation (`"on_track" | "at_risk" | "behind"`) preserved.

**Scope:** One file, three tasks (verify + implement + visually confirm + push). Appropriate for a single implementation session.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-20-ed-home-top-strip.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
