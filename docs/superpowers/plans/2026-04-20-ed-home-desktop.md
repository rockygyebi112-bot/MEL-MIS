# ED Home Desktop Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the cramped single-column ED home layout with a sticky sidebar + department panel grid on desktop (`lg: 1024px+`), leaving mobile unchanged.

**Architecture:** Pure UI change across two files. `DepartmentRowCard` gains a `variant="panel"` prop that renders a vertical card (no truncation, progress bar, status badge). `EdHome` restructures to a `lg:grid-cols-[320px_1fr]` two-column layout with the hero/bar/KPI chips in a sticky sidebar and the department grid on the right. Mobile uses `lg:hidden` / `hidden lg:grid` to keep both layouts in the DOM with CSS toggling — no JS breakpoint detection needed.

**Tech Stack:** Next.js, React, Tailwind, TypeScript. No test framework — verification is `npx tsc --noEmit` + visual check in preview.

**Spec:** [docs/superpowers/specs/2026-04-20-ed-home-desktop-design.md](../specs/2026-04-20-ed-home-desktop-design.md)

---

## File Map

**Modify:**
- `src/components/performance/department-row-card.tsx` — add `variant?: "row" | "panel"` prop; add panel JSX branch
- `src/components/performance/ed-home.tsx` — restructure return to sidebar + grid, update skeleton, pass `variant="panel"` to desktop cards

**No changes:**
- `src/app/(dashboard)/performance/page.tsx` — container already has `lg:max-w-6xl`, no change needed
- All hooks, lib, other components

---

## Task 1: DepartmentRowCard — panel variant

**Files:**
- Modify: `src/components/performance/department-row-card.tsx`

- [ ] **Step 1: Add `variant` prop to the interface**

Open `src/components/performance/department-row-card.tsx`.

Change the interface from:

```tsx
interface DepartmentRowCardProps {
  dept: DepartmentSummary;
}
```

To:

```tsx
interface DepartmentRowCardProps {
  dept: DepartmentSummary;
  variant?: "row" | "panel";
}
```

- [ ] **Step 2: Destructure `variant` in the component signature**

Change:

```tsx
export function DepartmentRowCard({ dept }: DepartmentRowCardProps) {
```

To:

```tsx
export function DepartmentRowCard({ dept, variant = "row" }: DepartmentRowCardProps) {
```

- [ ] **Step 3: Add panel JSX branch before the existing return**

After the `subLine` const, add a conditional panel return. Insert this block immediately before the existing `return (` statement:

```tsx
  if (variant === "panel") {
    return (
      <button
        type="button"
        onClick={() => router.push(`/performance/${dept.id}`)}
        className={`w-full text-left rounded-2xl p-4 flex flex-col gap-3 h-full transition-transform active:scale-[0.99] ${s.surface}`}
      >
        {/* Top row: monogram + status badge */}
        <div className="flex items-center justify-between">
          <div
            className={`size-11 rounded-2xl flex items-center justify-center font-extrabold text-[15px] ${s.badgeBg} ${s.badgeText}`}
          >
            {monogram(dept.name)}
          </div>
          <span
            className={`text-[9px] tracking-[1px] font-bold px-2 py-0.5 rounded-full ${s.badgeBg} ${s.pillText}`}
          >
            {s.pillLabel}
          </span>
        </div>

        {/* Department name — no truncate */}
        <div className="text-[15px] font-bold text-foreground">{dept.name}</div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-[#5BBF3A]"
            style={{ width: `${dept.progress_pct}%` }}
          />
        </div>

        {/* Bottom row: subline + pct */}
        <div className="flex items-center justify-between mt-auto">
          <div className={`text-[11px] ${s.subText}`}>{subLine}</div>
          <div className={`text-[20px] font-extrabold tracking-tight ${s.valueText}`}>
            {dept.progress_pct}%
          </div>
        </div>
      </button>
    );
  }
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/performance/department-row-card.tsx
git commit -m "feat(performance): add panel variant to DepartmentRowCard"
```

---

## Task 2: EdHome — sidebar + grid layout

**Files:**
- Modify: `src/components/performance/ed-home.tsx`

- [ ] **Step 1: Replace the entire return block**

Replace everything from `return (` to the closing `}` of the `EdHome` function with the following. (Keep all the variable declarations — `onTrack`, `atRisk`, `behind`, `totalActivities`, `doneActivities`, `pct`, `overallStatus` — unchanged above the return.)

```tsx
  if (loading) {
    return (
      <div className="text-foreground space-y-4 lg:space-y-0 lg:grid lg:grid-cols-[320px_1fr] lg:gap-8 lg:items-start">
        <div className="space-y-4">
          <div className="h-8 w-40 rounded-lg bg-muted animate-pulse" />
          <div className="h-40 rounded-3xl bg-muted animate-pulse" />
          <div className="h-6 rounded-full bg-muted animate-pulse" />
          <div className="hidden lg:flex lg:flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
            ))}
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

  return (
    <div className="text-foreground space-y-5 lg:space-y-0 lg:grid lg:grid-cols-[320px_1fr] lg:gap-8 lg:items-start">

      {/* ── Left sidebar ── */}
      <div className="space-y-5 lg:sticky lg:top-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground">{formatDate(now)}</div>
            <h1 className="text-2xl font-bold tracking-tight mt-0.5">Performance</h1>
          </div>
          <QuarterChip
            year={year}
            quarter={quarter}
            onYearChange={setYear}
            onQuarterChange={setQuarter}
          />
        </div>

        <PerformanceHeroTile
          pct={pct}
          onTrackCount={onTrack}
          totalDepts={departments.length}
          doneActivities={doneActivities}
          totalActivities={totalActivities}
          trendDeltaPct={trendDeltaPct}
          status={overallStatus}
        />

        <StatusSegmentedBar onTrack={onTrack} atRisk={atRisk} behind={behind} />

        {/* KPI chips — desktop only */}
        <div className="hidden lg:flex lg:flex-col gap-2">
          {(
            [
              { value: departments.length, label: "Departments" },
              { value: totalActivities, label: "Total Activities" },
              { value: onTrack, label: "On Track" },
            ] as const
          ).map(({ value, label }) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3"
            >
              <span className="text-2xl font-extrabold text-foreground">{value}</span>
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: department grid ── */}
      <div>
        {/* Mobile: row cards */}
        <div className="lg:hidden space-y-2.5">
          {departments.map((dept) => (
            <DepartmentRowCard key={dept.id} dept={dept} />
          ))}
        </div>

        {/* Desktop: panel cards */}
        <div className="hidden lg:grid grid-cols-2 xl:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <DepartmentRowCard key={dept.id} dept={dept} variant="panel" />
          ))}
        </div>
      </div>
    </div>
  );
```

Note: remove the old `loading` ternary block that was inside the single `return (` — it is now a separate early return above.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/performance/ed-home.tsx
git commit -m "feat(performance): ED home desktop sidebar + panel card grid"
```

---

## Task 3: Visual verification + push

- [ ] **Step 1: Final typecheck + lint**

Run: `npx tsc --noEmit` — expect no errors.
Run: `npm run lint` — expect no NEW errors beyond pre-existing ones in `use-performance-staff.ts` and `middleware.ts`.

- [ ] **Step 2: Try preview at three widths (if auth allows)**

If preview server starts and authenticates as Admin:
- Resize to **375px** — confirm mobile layout unchanged: row cards stack, no sidebar
- Resize to **1024px** — confirm sidebar appears on left (hero + bar + 3 KPI chips, sticky), department panel cards appear in 2-col grid on right, no name truncation
- Resize to **1280px+** — confirm panel grid shows 3 columns

If preview auth blocks: document that visual verification was not possible and rely on typecheck.

- [ ] **Step 3: Push branch**

```bash
git push origin claude/intelligent-jemison-00281d
```

---

## Self-Review

**Spec coverage:**
- ✅ Sidebar + main split → Task 2 (lg:grid-cols-[320px_1fr])
- ✅ Sticky sidebar → Task 2 (lg:sticky lg:top-6)
- ✅ KPI chips (Departments / Activities / On Track) → Task 2
- ✅ Panel card variant → Task 1 (variant="panel")
- ✅ No name truncation on panel → Task 1 (no `truncate` class)
- ✅ Progress bar on panel → Task 1
- ✅ Status badge on panel → Task 1
- ✅ Mobile unchanged → Task 2 (lg:hidden / hidden lg:grid)
- ✅ Loading skeleton responsive → Task 2 early-return skeleton

**Placeholder scan:** None found.

**Type consistency:** `variant="panel"` used in Task 2 matches `variant?: "row" | "panel"` defined in Task 1. `DepartmentRowCard` default `variant="row"` means mobile cards (no prop passed) stay unchanged.
