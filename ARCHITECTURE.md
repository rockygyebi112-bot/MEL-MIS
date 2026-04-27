# Clean Architecture — MEL MIS

## Goal
Separate concerns, increase modularity, and reduce coupling without changing runtime behavior.

## Folder Structure

```
src/
  app/                  # Next.js routes (thin layer — no business logic)
  features/             # Self-contained feature modules
    projects/
      domain/           # Pure TypeScript — types & business rules
        types.ts
        status.ts
      data/             # Data access — Supabase queries & mutations
        queries.ts
        mutations.ts
      hooks/            # React hooks that compose domain + data
        use-projects.ts
        use-project-activities.ts
        use-project-activities-map.ts
      index.ts          # Public API barrel export
  components/
    ui/                 # shadcn/ui primitives
    layout/             # Shared layout components
  lib/                  # Cross-cutting concerns
    supabase/           # Client/server/admin Supabase configs
    utils.ts            # Generic utilities
    constants.ts        # App constants
    types.ts            # Shared cross-feature types
```

## Dependency Rules

```
app/  →  features/  →  components/ui/  →  lib/
         ↓            ↓
         domain/      hooks/
         (pure TS)    (React + data)
```

- **Domain** must be pure TypeScript — no React, no Supabase.
- **Data** depends only on Domain and `lib/supabase`.
- **Hooks** depend on Data and Domain.
- **Components** depend on Hooks, Domain, and shared UI.
- **App** (pages/routes) orchestrates features.

## What Changed

### 1. Feature Modules (`src/features/projects`)
Created a self-contained `projects` feature with clear layers:
- **Domain**: `types.ts`, `status.ts` — all business logic (status computation, progress, overdue counts).
- **Data**: `queries.ts`, `mutations.ts` — Supabase interactions abstracted behind feature interfaces.
- **Hooks**: `useProjects`, `useProjectActivities`, `useProjectActivitiesMap` — encapsulate loading/error states and caching.

### 2. Shared UI Components
- **`AsyncBoundary`** — declarative loading / error / empty states with ARIA roles.
- **`StatusBadge`** — accessible, theme-aware status pill reused across project views.
- **`SkeletonCard`** — accessible skeleton loader with proper `role="status"` and `aria-busy`.

### 3. Refactored Pages & Components
- `src/app/(dashboard)/projects/page.tsx` now delegates to `useProjects` + `useProjectActivitiesMap` and renders via `AsyncBoundary` instead of inline loading/null checks.
- `src/components/projects/project-card.tsx` imports domain logic from `@/features/projects` and uses `StatusBadge`.
- `src/components/projects/status-pill.tsx` now delegates to `StatusBadge` for consistency.
- `src/lib/projects/index.ts` re-exports from `features/projects` for backward compatibility during migration.

### 4. Bug Fix
- Fixed `activity-side-panel.tsx` temporal dead zone error where `submitUpdate` was used in a `useEffect` dependency array before its `useCallback` declaration.

## How to Migrate Another Feature

1. Move types to `features/<name>/domain/types.ts`.
2. Move pure logic to `features/<name>/domain/`.
3. Move Supabase queries/mutations to `features/<name>/data/`.
4. Create hooks in `features/<name>/hooks/` that expose `{ data, loading, error, refresh }`.
5. Export a barrel `index.ts`.
6. Update page components to use the new hooks + `AsyncBoundary`.
7. Add `src/lib/<name>/index.ts` re-export if you need backward compatibility.

## Production UI Principles Applied

- **Loading states**: SkeletonCard with reduced motion awareness potential.
- **Error states**: `AsyncBoundary` provides retry actions and ARIA alerts.
- **Empty states**: Consistent empty UI via `AsyncBoundary`.
- **Accessibility**: All badges include `title`, skeletons include `aria-busy`/`role="status"`, error banners use `role="alert"` and `aria-live`.
- **Responsive**: Page filters remain scrollable on mobile (`overflow-x-auto`) and wrap on desktop.
