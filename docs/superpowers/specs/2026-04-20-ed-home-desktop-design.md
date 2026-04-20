# ED Home Desktop Layout — Design Spec

**Date:** 2026-04-20
**Status:** Approved

## Problem

The Executive Dashboard home view uses a single-column, mobile-first layout that looks broken on desktop:
- Department names truncate ("A...", "Fi...") because horizontal row cards are too narrow in a 3-column grid
- The hero tile dominates the full viewport width without using it effectively
- No sidebar — all content stacks vertically, wasting horizontal space on wide screens

## Goal

Add a responsive desktop layout (`lg: 1024px+`) to `ed-home.tsx` and `department-row-card.tsx` that:
- Splits the page into a sticky left sidebar + scrollable right grid
- Shows department cards as vertical panel cards on desktop (no truncation, progress bar visible)
- Adds 3 KPI stat chips to the sidebar below the segmented bar
- Leaves mobile layout (`< lg`) completely unchanged

## Architecture

**Pure UI change.** No hook, data, or routing changes. No new files — only `ed-home.tsx` and `department-row-card.tsx` are modified. The `DepartmentRowCard` receives a new optional `variant` prop (`"row" | "panel"`, default `"row"`) so mobile keeps the row shape and desktop uses the panel shape.

---

## Section 1: Page Layout (`ed-home.tsx`)

### Mobile (unchanged)
Single-column stack: header → hero tile → segmented bar → department list.

### Desktop (`lg:`)
Two-column split using `lg:grid lg:grid-cols-[320px_1fr] lg:gap-8 lg:items-start`:

**Left sidebar (320px, sticky):**
- Page header (date + "Performance" title + QuarterChip)
- PerformanceHeroTile
- StatusSegmentedBar
- 3 KPI stat chips (see below)

**Right content area:**
- Department grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4`
- Cards render as `variant="panel"` at `lg:+`

### KPI Stat Chips
Three small chips below the segmented bar, stacked vertically in the sidebar:

```
┌─────────────────────────┐
│  5   Departments        │
└─────────────────────────┘
┌─────────────────────────┐
│  1   Total Activities   │
└─────────────────────────┘
┌─────────────────────────┐
│  0   On Track           │
└─────────────────────────┘
```

Each chip: `rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3`
- Left: large bold number in `text-foreground`
- Right: label in `text-muted-foreground text-sm`

---

## Section 2: Department Panel Card (desktop variant)

New `variant="panel"` shape for `DepartmentRowCard`. Receives `variant?: "row" | "panel"` prop (default `"row"`).

**Panel card structure (vertical):**
```
┌──────────────────────────────┐
│  AH           [AT RISK badge]│  ← monogram + status badge top row
│  Admin & HR                  │  ← full name, no truncate
│                              │
│  ████░░░░░░░░░░░░░░          │  ← h-1.5 progress bar (green)
│                              │
│  0 of 0 activities done      │  ← subline
│                          0%  │  ← pct bottom-right
└──────────────────────────────┘
```

- Container: `rounded-2xl p-4 flex flex-col gap-3 h-full ${s.surface}` (same status surface classes as row)
- Top row: `flex items-center justify-between`
  - Left: monogram bubble (same `size-11 rounded-2xl` as row)
  - Right: status badge pill (`text-[9px] tracking-[1px] font-bold px-2 py-0.5 rounded-full ${s.badgeBg} ${s.pillText}`)
- Department name: `text-[15px] font-bold text-foreground` (no `truncate` — panel is wide enough)
- Progress bar: `w-full h-1.5 rounded-full bg-muted overflow-hidden` with inner div `bg-[#5BBF3A]`
- Bottom row: `flex items-center justify-between`
  - Left: subline `text-[11px] ${s.subText}`
  - Right: `text-[20px] font-extrabold ${s.valueText}`

---

## Section 3: Responsive Sidebar Stickiness

The sidebar uses `lg:sticky lg:top-6 lg:self-start` so it stays in view while the department grid scrolls. This requires `lg:items-start` on the outer grid (not `items-stretch`).

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/performance/ed-home.tsx` | Add `lg:grid lg:grid-cols-[320px_1fr]` wrapper, move header+hero+bar+chips into sidebar div, add KPI chips, pass `variant="panel"` to cards on desktop |
| `src/components/performance/department-row-card.tsx` | Add `variant?: "row" \| "panel"` prop, render panel JSX when `variant === "panel"` |

**No other files change.** Mobile layout in `ed-home.tsx` is preserved under the `lg:` breakpoint.

---

## Non-Goals

- No changes to manager dashboard, staff dashboard, or drilldown views
- No data changes or new hooks
- No dark mode rework (existing status surface dark: classes carry over unchanged)
- No animations beyond existing `active:scale-[0.99]`
