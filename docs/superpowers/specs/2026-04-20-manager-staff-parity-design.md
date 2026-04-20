# Manager + Staff Dashboard Parity (PR C)

**Date:** 2026-04-20
**Branch:** `claude/compassionate-einstein-ec759e`
**Depends on:** `2026-04-19-performance-ed-redesign-design.md` (introduces the shared primitives)

## Goal

Apply the shared Performance primitives (`PerformanceHeroTile`, `StatusSegmentedBar`, `QuarterChip`) and the unified token/color system to `manager-dashboard.tsx` and `staff-dashboard.tsx` so all three role views speak the same visual language.

## Color decision

- **Green `#5BBF3A`** — system color for progress and active states (hero %, progress bars, active tab underline, active quarter/week chip). Applied uniformly across ED / Manager / Staff.
- **Purple `#6B2D7B`** — reduced to a quiet role marker: a small eyebrow label in the header (`MANAGER · {dept}`, `STAFF · {dept}`) and a border tint on the Staff dept-goal banner. No longer used for tab underlines, active chips, or stat accents.
- **Status colors** (green / amber / red) — unchanged across hero gradients and the segmented bar.

## Changes

### `src/components/performance/manager-dashboard.tsx`

1. **Header eyebrow** — add `MANAGER · {dept name}` in small purple uppercase above the existing dept title. Keep back button and bell.
2. **Hero tile** — replace the inline pct / overdue subline with `PerformanceHeroTile`:
   - `pct` = current `pct` calculation
   - `status` = current `deptStatus`
   - `onTrackCount` / `totalDepts` — adapt to goals (on-track goals of total goals) OR pass activity-level counts; use goal-level for Manager since they manage goals
   - `doneActivities` / `totalActivities` = current counts
   - `trendDeltaPct` = `null` (no quarter-over-quarter data yet in Manager hook)
3. **Segmented bar** — add `StatusSegmentedBar` below hero using goal statuses (count of on-track / at-risk / behind goals).
4. **Quarter chip** — replace `QuarterSelector` with `QuarterChip`, right-aligned in a small row.
5. **Tab bar** — swap `#6B2D7B` → `#5BBF3A` for active text and underline. Alert badge stays red.
6. **Inner tab files** — `goals-activities-tab.tsx`, `staff-progress-tab.tsx`, `alerts-panel.tsx`: audit for hex literals, migrate to semantic tokens (`bg-card`, `text-foreground`, `border-border`, `bg-muted`). Replace any remaining `#6B2D7B` accents with `#5BBF3A`.

### `src/components/performance/staff-dashboard.tsx`

1. **Header eyebrow** — add `STAFF · {dept name}` in small purple uppercase above `My Performance`.
2. **Hero tile** — replace the 4-stat grid with `PerformanceHeroTile`:
   - `pct` = `myPct`
   - `status` derived from `myPct`: `≥80` → `on_track`, `≥50` → `at_risk`, else `behind`
   - Subline prop usage: `onTrackCount` = `done`, `totalDepts` = `activities.length`, `doneActivities` = `done`, `totalActivities` = `activities.length` — OR extend hero tile with an optional `subline` prop if the default phrasing doesn't fit. Decide during implementation.
   - `trendDeltaPct` = `null`
3. **Segmented bar** — add below hero showing activity-level counts: done (green) / pending (amber-ish via `at_risk` slot) / overdue (red). Labels: `{done} DONE`, `{pending} PENDING`, `{overdue} OVERDUE`.
4. **Week navigator** — pill-ify to match `QuarterChip` shape: `rounded-full`, `bg-muted`, chevron affordance. Keep existing week-range logic and callback.
5. **Dept goal banner** — keep purple border tint (`border-[#6B2D7B]/20`) as role marker. Swap `bg-purple-50/50` → `bg-card` with appropriate `dark:` variant. Progress bar stays green.
6. **`activity-card.tsx`** — audit for hex literals, migrate to semantic tokens.

### Out of scope

- ECharts dark-mode color palette (`chart-builders.ts`)
- Data-entry form restructure (ES / VU / Hangout / ABSA)
- Role-aware landing page
- Executive Dashboard mobile polish

## Implementation order

1. Manager header + hero + segmented bar + quarter chip (visible skeleton)
2. Manager tab bar color swap + inner-tab token migration
3. Staff header + hero + segmented bar
4. Staff week navigator pill + dept goal banner + activity card token migration
5. Typecheck, visual check in light + dark mode, commit per dashboard

## Testing

- `npm run typecheck` clean
- Manual visual: ED (`/performance`), Manager (`/performance/[id]` as non-admin), Staff (`/performance` as staff user); light + dark mode
- Preview server verification — attempt but auth issue from prior PRs may persist; flag explicitly if blocked

## Commit plan

Two commits on existing branch `claude/compassionate-einstein-ec759e`:

- `feat(performance): apply shared primitives to manager dashboard`
- `feat(performance): apply shared primitives to staff dashboard`

Push after both land. PR still needs manual creation (gh CLI unavailable) against `master`.

## Risks / open questions

- **Hero tile subline phrasing for Staff** — current props are org-flavored. May need a small optional `subline` prop override. Will introduce only if needed.
- **Goal-level vs activity-level counts in Manager hero** — spec picks goal-level for semantic fit (Manager manages goals). If the hero wording reads awkwardly, fall back to activity-level.
- **Unverified visual state** — prior PRs couldn't be eye-checked in preview due to auth; the same constraint likely applies. Typecheck remains the primary gate.
