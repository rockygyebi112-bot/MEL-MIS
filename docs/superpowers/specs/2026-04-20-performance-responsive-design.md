# Performance Dashboard Responsive Desktop Layout

**Date:** 2026-04-20
**Branch:** `claude/intelligent-jemison-00281d`
**Depends on:** `2026-04-20-manager-staff-parity-design.md` (PR C — assumes the shared primitives are already wired)

## Goal

Add responsive `md:` / `lg:` breakpoints so the Performance pages use desktop screen real estate effectively without losing the mobile-first experience. No new components, no separate desktop codebase — just responsive classes and lightweight container wrappers.

## Breakpoints

- `< md` (<768px): existing mobile layout, unchanged
- `md` (≥768px): tablet — 2-col grids, wider hero typography
- `lg` (≥1024px): desktop — 3-col grids where useful, split layouts on drilldown

## Page-by-page changes

### ED Home (`src/components/performance/ed-home.tsx`)

- Container: `mx-auto max-w-6xl` (wrapper div or added to root element).
- Hero: keep existing layout. Add `lg:` variants for the big number — `text-[64px] lg:text-[96px]` — and padding `p-5 lg:p-8`.
- Department row cards: wrap the list in a grid — `grid gap-3 md:grid-cols-2 lg:grid-cols-3`. Cards reshape into card-style layout at md+ (see `department-row-card.tsx` below).

### ED Drilldown (`src/app/(main)/performance/[id]/...` + `src/components/performance/ed-drilldown.tsx`)

- Container: `mx-auto max-w-5xl`.
- On lg: two-column split — left column (60%) = status hero + goals list; right column (40%) = overdue list + last submission. Use `lg:grid lg:grid-cols-[3fr_2fr] lg:gap-6`. Mobile still stacks.
- No sticky behavior for the right column in this pass (would require `position: sticky` + scroll testing; deferred).

### Manager dashboard (`src/components/performance/manager-dashboard.tsx`)

- Container: `mx-auto max-w-6xl`.
- Hero stays full-width of container.
- Tab content:
  - **Goals tab** (`goals-activities-tab.tsx`): goal rows wrap in a grid `md:grid-cols-2` when there are multiple goals. Kept simple — no side panel.
  - **Staff tab** (`staff-progress-tab.tsx`): grid `md:grid-cols-2 lg:grid-cols-3` for staff cards.
  - **Alerts tab** (`alerts-panel.tsx`): no grid — keep single-column reading flow, but cap the container width so rows don't stretch uncomfortably wide.

### Staff dashboard (`src/components/performance/staff-dashboard.tsx`)

- Container: `mx-auto max-w-3xl` (intentionally narrower — personal task list).
- Hero + segmented bar + week nav full-width of that container.
- Activity list stays single-column.

### `department-row-card.tsx`

- At mobile width: existing row layout (monogram left, text middle, chevron right).
- At md+: reshape slightly so it reads as a card in a grid — monogram on top-left, text below, progress bar full-width at the bottom. Specific change: add `md:flex-col md:items-start md:gap-2` on the flex container, and let the progress section wrap under the text.
- If this reshape adds too much complexity, fall back to keeping the existing row layout and just letting the grid place three rows side-by-side.

### `performance-hero-tile.tsx`

- Add responsive padding: `p-5 lg:p-8`.
- Add responsive big-number size: `text-[64px] lg:text-[96px]`.
- Subline: `text-[13px] lg:text-[15px]`.
- Eyebrow letter-spacing stays the same.

## Implementation notes

- Container wrappers should live at the **page level** (in `src/app/(main)/performance/...` files) so the dashboard components stay layout-agnostic. The `ed-home.tsx`, `manager-dashboard.tsx`, and `staff-dashboard.tsx` themselves don't need max-width — they render inside a page-level container.
- Where page-level wrapping isn't straightforward (e.g., dashboard dispatch happens inside `[departmentId]/page.tsx`), add the container to the dashboard component itself.
- All changes are additive `md:` / `lg:` classes. Mobile layout is never modified.

## Out of scope

- Executive Dashboard responsive polish (separate, flagged)
- Forms
- Sticky sidebar on drilldown (deferred — adds scroll complexity)
- `department-row-card.tsx` variant prop (too much for this pass — use responsive classes)

## Testing

- `npx tsc --noEmit` clean.
- Visual check in preview at 375px, 768px, 1280px if auth allows.
- Confirm mobile layout is unchanged at 375px.

## Commit plan

Single PR on branch `claude/intelligent-jemison-00281d`. Commits:

1. `feat(performance): add responsive container + hero typography` — page-level containers + hero tile scaling
2. `feat(performance): ED home department card grid` — grid layout for dept cards
3. `feat(performance): ED drilldown 2-col split on desktop` — grid split on drilldown
4. `feat(performance): Manager tab grids on tablet+` — goals + staff tab grids

## Risks

- **`department-row-card.tsx` reshape:** if responsive reshaping creates visual awkwardness at md width (neither true row nor true card), fall back to keeping row layout inside the grid. Flag during implementation.
- **ED drilldown split:** the existing `ed-drilldown.tsx` structure must be amenable to a grid wrapper. If it's a single flat list of sections, the split needs reworking — flag if it requires more than adding a wrapper.
- **Container location:** if the page files for performance routes are server components that don't easily accept a className wrapper, adjust by wrapping in the dashboard component directly.
