# ED Home — Top-Strip Layout Redesign

**Date:** 2026-04-20
**Status:** Approved
**Supersedes:** [2026-04-20-ed-home-desktop-design.md](./2026-04-20-ed-home-desktop-design.md) (sidebar + panel grid)

## Problem

The previous desktop redesign put a 320px sticky sidebar beside the department grid. The outer dashboard shell (`src/app/(dashboard)/layout.tsx`) already reserves a 256px left nav (`lg:ml-64`) plus `px-10` padding inside a `max-w-[1440px]` wrapper. Stacking a second 320px sidebar inside the page leaves ~750px for the department grid on a 1440px viewport and far less at `lg`. The 3-column panel grid collapses to ~240px per card, causing department names like "Admin & HR" to wrap across three lines and defeating the whole point of the panel variant.

## Goal

Replace the inner sidebar with a horizontal top strip so the department grid gets the full content width. Keep mobile unchanged. Preserve all existing components and the panel card variant.

## Architecture

Pure UI restructure of `src/components/performance/ed-home.tsx`. The component's data, hooks, and child components are untouched. `DepartmentRowCard` is not modified — its existing `variant="panel"` is reused as-is. The outer page container (`src/app/(dashboard)/performance/page.tsx`) already constrains width; no change needed there.

No new files. No new props. No data changes.

---

## Section 1: Page Structure

### Mobile (`< lg`, unchanged)

Single-column vertical stack: header → hero tile → segmented bar → department row list. KPI chips remain hidden on mobile as they are today.

### Desktop (`lg:` and up)

Vertical stack of three regions, each full content width:

1. **Header row** — date + "Performance" title on the left, `QuarterChip` on the right. `flex items-start justify-between gap-3`.
2. **Top strip** — two-column grid: hero tile on the left, KPI chips + segmented bar stacked on the right.
3. **Department grid** — responsive card grid filling the full content width below.

No sticky positioning. The entire page scrolls as one.

```
┌─────────────────────────────────────────────────────────┐
│  Date · Performance                       [Q2 2026 ▾]  │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────┬──────┬──────┐           │
│  │  Hero tile      │  │  5   │  12  │  3   │           │
│  │  (pct + trend)  │  │Depts │Acts  │OnTrk │           │
│  │                 │  └──────┴──────┴──────┘           │
│  │                 │  ┌───────────────────────┐         │
│  │                 │  │ Status segmented bar  │         │
│  └─────────────────┘  └───────────────────────┘         │
├─────────────────────────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌────────┐                      │
│  │ Dept 1 │ │ Dept 2 │ │ Dept 3 │                      │
│  └────────┘ └────────┘ └────────┘                      │
│  ┌────────┐ ┌────────┐                                 │
│  │ Dept 4 │ │ Dept 5 │                                 │
│  └────────┘ └────────┘                                 │
└─────────────────────────────────────────────────────────┘
```

---

## Section 2: Top Strip

### Outer grid

`hidden lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-6 lg:items-stretch`

Two columns, with the right column slightly wider (`1.2fr`) to give the chips + segmented bar a comfortable horizontal rhythm. `items-stretch` lets the right column match the hero's intrinsic height.

### Left column: hero

Existing `PerformanceHeroTile` component, unchanged. Renders as one tall card.

### Right column: chips + bar

`flex flex-col gap-3 lg:h-full lg:justify-between`.

**KPI row** — 3-up horizontal grid: `grid grid-cols-3 gap-2`. Chip markup is unchanged (`rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3`). Chip contents:

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 5  Departments│ │ 12  Activities│ │ 3  On Track  │
└──────────────┘ └──────────────┘ └──────────────┘
```

Labels shortened for the horizontal layout:
- "Departments" (unchanged)
- "Activities" (was "Total Activities")
- "On Track" (unchanged)

**Segmented bar** — existing `StatusSegmentedBar` component directly below the KPI row.

### Mobile fallback

At `< lg` the top-strip grid is hidden. The existing mobile stack continues to render hero + segmented bar in vertical order (KPI chips stay hidden on mobile, matching current behavior).

---

## Section 3: Department Grid

### Mobile (`< lg`)

Unchanged: `lg:hidden space-y-2.5` with row-variant `DepartmentRowCard`s.

### Desktop (`lg:` and up)

`hidden lg:grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4` with panel-variant cards.

Note: the `md:grid-cols-2` inside a `hidden lg:grid` wrapper has no effect at `md` (the wrapper is hidden there); it's included for readability. The effective breakpoints on this grid are:

| Breakpoint  | Columns | Approx card width (1440 viewport, outer nav expanded) |
|-------------|---------|-------------------------------------------------------|
| lg (1024+)  | 2       | ~520px                                                |
| xl (1280+)  | 3       | ~350px                                                |
| 2xl (1536+) | 3       | ~430px                                                |

Card component, content, and status surface classes are unchanged from the existing panel variant.

---

## Section 4: Loading Skeleton

The loading-state early return mirrors the real layout:

- Header skeleton: one `h-8 w-40` pulse bar.
- Top-strip skeleton at `lg`: two-column grid matching the real strip. Left = one `h-40` rounded block. Right = three `h-14` chip skeletons in a 3-col row + one `h-6` bar skeleton.
- Department grid skeleton: same responsive column classes as the real grid, five `h-36` rounded blocks.
- Mobile skeleton stays single-column stack as today.

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/performance/ed-home.tsx` | Replace `lg:grid-cols-[320px_1fr]` wrapper and sticky sidebar with vertical stack: header → top strip → full-width grid. Update loading skeleton to match. |

No other files modified. `DepartmentRowCard`'s panel variant is reused without changes.

---

## Non-Goals

- No changes to `DepartmentRowCard` or any other component.
- No new data, hooks, or routing.
- No changes to the manager or staff dashboards (will be addressed separately if needed).
- No changes to mobile layout.
- No sticky behavior. The strip scrolls with the page.

---

## Verification

- `npx tsc --noEmit` — no new errors.
- Visual check at 1024px, 1280px, 1440px: department cards should be wide enough that "Admin & HR" renders on one line.
- Visual check at 375px: mobile layout identical to current behavior.
