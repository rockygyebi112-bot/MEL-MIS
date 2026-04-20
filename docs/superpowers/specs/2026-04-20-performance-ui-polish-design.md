# Performance Module UI Polish — Design Spec

**Date:** 2026-04-20
**Scope:** Performance module (ED home, manager dashboard, staff dashboard, shared components)
**Status:** Approved for plan-writing

## Problem

The Executive Director performance dashboard (`src/components/performance/ed-home.tsx`) renders poorly at viewports between ~1024px and ~1440px:

- Department panel cards compress to ~230px wide, causing names like "Admin & HR" to wrap across three lines.
- The department percentage value overlaps the "activities complete" subline.
- The Org Health hero tile dominates the viewport with a saturated red surface and an oversize "0%" figure, pushing KPI chips below the fold.
- Cards are under-informative relative to the real estate they consume — no trend, no owner, no "next due" context to help the ED decide where to intervene.

The same visual language is inconsistently applied across `manager-dashboard.tsx` and `staff-dashboard.tsx`, so polish applied to ED home should extend to the module.

## Goals

1. Fix responsive cramping so every viewport ≥1024px presents clean, readable cards.
2. Rebalance the Org Health tile so it informs rather than alarms.
3. Enrich department cards with trend, owner, and next-due context without crowding them.
4. Establish shared card/tile tokens so the manager and staff dashboards inherit the same visual grammar.

## Non-goals

- Redesigning modals (add-goal, add-activity, proof-of-work).
- Redesigning the drilldown route (`/performance/[departmentId]`) beyond inheriting shared card styles.
- New data models, new routes, or new navigation.
- Dark mode palette overhaul (existing dark tokens stay, only adjust where the new palette introduces tokens).

## Design

### 1. Responsive layout fix (ED home)

**Root cause:** `lg:grid-cols-2 xl:grid-cols-3` inside a `[320px_1fr]` shell produces ~230px cards between 1024px and 1280px wide.

**Changes to `ed-home.tsx`:**
- Shell: `lg:grid-cols-[300px_1fr]` (was `320px`).
- Right-side grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` (3-col only at ≥1280px; no 4-col tier).
- Loading skeleton grid matches the same breakpoints.

**Changes to `department-row-card.tsx` panel variant:**
- Bottom row: wrap with `flex-wrap gap-y-1` so the % can drop to its own line if space is tight.
- Add `min-w-0` on all flex children that contain truncatable text.
- Department name: `truncate` (single line, ellipsize) — no more 3-line wraps.

**Result:** At 1280px, three ~355px cards; at 1024–1279px, two ~460px cards. No overlap at any width.

### 2. Org Health tile rebalance (`performance-hero-tile.tsx`)

- Reduce "0%" from ~96px to ~64px font-size; tile padding `p-5` → `p-4`.
- Replace saturated red gradient with softer surfaces driven by tokens (see §5):
  - `behind`: muted rose gradient
  - `at_risk`: muted amber gradient
  - `on_track`: subtle brand-green gradient (#5BBF3A at ~85% opacity)
- Compress the two-line subline to one line using `·` separators and `tabular-nums`.
- Add an 8-week org-level sparkline at the bottom of the tile, 28px tall, stroked in the accent color with a low-opacity area fill and an emphasized last-point dot. If fewer than 2 data points are available, omit the sparkline (don't render a placeholder).
- Tile height shrinks ~30%; sidebar fits above the fold on a 1080p laptop.

**Data:** `usePerformanceEd` returns a new `orgWeeklyTrend: number[]` (up to 8 entries, each the org-wide % done for that week). Existing hook already aggregates departments — extend the same query to group by ISO week.

### 3. Enriched department card (panel variant only)

Row variant (mobile) is unchanged. Panel variant structure top-to-bottom:

1. Header row: monogram (unchanged) + right-aligned status pill.
2. Department name — `truncate`, one line.
3. Owner line: 20px avatar + manager name, `text-xs text-muted-foreground`. Italic "No manager assigned" when null.
4. Sparkline — 8-week dept trend of % complete, 32px tall, full card width, stroked in status accent, subtle area fill, emphasized last point. Omit if <2 points.
5. Progress bar `h-2` with the `%` label inline to its right (not below).
6. Footer row, two micro-stats:
   - Left: `Next due · {title} · {short date}` — truncates. Show "Nothing upcoming" if null.
   - Right: overdue count as a red chip (`{n} overdue`) if >0, else "On schedule" in muted text.

Card height grows from ~144px to ~200px.

**Data additions to `DepartmentSummary`:**
- `manager_name: string | null`
- `manager_avatar_url: string | null`
- `weekly_trend: number[]` (up to 8 entries)
- `next_activity: { title: string; due_date: string } | null`

These are filled by `usePerformanceEd`. Backend query shape decided at plan time.

### 4. Manager dashboard

- Adopt the ED home shell (`lg:grid-cols-[300px_1fr]`) so hero + KPIs stay anchored while tabs change.
- `GoalProgressCard` receives the same enrichment pattern as the dept panel card: sparkline (8-week weekly progress of the goal), owner line, "next due" footer. Uses the same shared tokens.
- Tabs bar restyled to an underlined-tab pattern (no pill backgrounds).
- Hero tile is the shared `PerformanceHeroTile` (already the case) but inherits the rebalanced look automatically.

### 5. Staff dashboard

- Hero tile inherits the rebalanced look automatically.
- `ActivityCard` restyled to use shared card tokens (same rounding, same status-colored surface, `h-2` progress where applicable).
- Header tightened to match ED's "Monday, April 20 / Performance" pattern — no other layout change.
- Week navigator: visual tightening only, no behavior change.

### 6. Shared tokens

Add to Tailwind theme (`tailwind.config` or global `@theme`):

| Token | Light | Dark |
|---|---|---|
| `--perf-surface-ontrack` | soft green tint | existing dark on-track surface |
| `--perf-surface-atrisk` | soft amber tint | existing dark at-risk surface |
| `--perf-surface-behind` | soft rose tint | existing dark behind surface |
| `--perf-accent-ontrack` | #16A34A | #4ADE80 |
| `--perf-accent-atrisk` | #B45309 | #FBBF24 |
| `--perf-accent-behind` | #B91C1C | #FCA5A5 |

Replace scattered `bg-amber-50 / bg-red-50 / text-green-700` etc. in `department-row-card.tsx`, `performance-hero-tile.tsx`, `activity-card.tsx`, and `goal-progress-card.tsx` with the token classes. Exact token names/values finalized at plan time; goal is one palette change cascades everywhere.

### Sparkline component

Introduce a small shared component `src/components/performance/sparkline.tsx`:
- Props: `values: number[]`, `accentColor: string`, `height?: number`.
- Renders inline SVG (no chart library — already have ECharts elsewhere but sparklines don't justify the bundle cost).
- Handles <2 points by rendering nothing.

## Components touched

- `src/components/performance/ed-home.tsx` — breakpoints, skeleton.
- `src/components/performance/department-row-card.tsx` — panel variant enrichment, tokenized colors.
- `src/components/performance/performance-hero-tile.tsx` — shrink, detune, add sparkline slot.
- `src/components/performance/manager-dashboard.tsx` — sidebar shell, underlined tabs.
- `src/components/performance/goal-progress-card.tsx` — enrichment mirror of dept card.
- `src/components/performance/staff-dashboard.tsx` — shared tokens, header tightening.
- `src/components/performance/activity-card.tsx` — tokenized colors, shared rounding.
- `src/components/performance/sparkline.tsx` — **new**.
- `src/hooks/use-performance-ed.ts` — return `orgWeeklyTrend`, and per-dept `manager_name`, `manager_avatar_url`, `weekly_trend`, `next_activity`.
- `src/hooks/use-performance-manager.ts` — return `weekly_trend` per goal and `next_activity`.
- `src/lib/types.ts` — extend `DepartmentSummary` and goal types.
- Tailwind theme — add `--perf-surface-*` / `--perf-accent-*` tokens.

## Risks

- **Backend query cost.** Adding 8-week trends per department could be an expensive aggregation. Plan must validate with real query EXPLAIN before assuming it's free. Fallback: compute trend client-side if we already fetch the raw activity completions.
- **Next.js version specifics.** `AGENTS.md` warns this is a fork with breaking changes — the plan must check `node_modules/next/dist/docs/` for any affected conventions before touching page-level files.
- **Dark mode regressions.** Tokenizing colors could shift dark-mode appearance. Plan includes a visual sweep of every touched component in both themes.

## Success criteria

- At every viewport from 1024px up, no text wraps awkwardly and no elements overlap.
- Org Health tile + StatusSegmentedBar + KPI chips all fit above the fold on a 1080p laptop.
- A single palette token change updates every performance surface in one place.
- No new data fetches beyond the extended hook shape; no N+1 queries introduced.
- Manager and staff dashboards visually match the ED home without bespoke styling per screen.
