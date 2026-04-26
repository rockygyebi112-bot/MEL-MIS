# Springboard MIS - Architecture Audit Report

**Date:** April 2026  
**Scope:** Full codebase analysis for structural integrity, maintainability, and performance

---

## 1. Architecture Summary

### Tech Stack
- **Framework:** Next.js 16.2.2 with React 19.2.4
- **Styling:** Tailwind CSS 4.x with shadcn/ui components
- **Backend:** Supabase (PostgreSQL + Auth)
- **Charts:** Apache ECharts 6.x
- **State:** React hooks (no global state manager)
- **PWA:** next-pwa for offline capabilities

### Directory Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group (login, signup, pending)
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API routes (minimal usage)
│   └── auth/              # Auth callback handlers
├── components/
│   ├── dashboard/         # 20 chart/dashboard components
│   ├── data-entry/        # 10 form components
│   ├── indicators/        # 2 indicator management
│   ├── layout/            # 7 layout/shell components
│   ├── programs/          # 1 program-specific
│   ├── projects/          # 12 project management
│   ├── settings/          # 4 settings components
│   └── ui/                # 17 shadcn/ui components
├── hooks/                 # Global hooks (2 files)
├── lib/
│   ├── hooks/             # Lib-scoped hooks (1 file)
│   ├── supabase/          # Client/server/admin clients
│   ├── projects/          # Project queries/mutations
│   ├── portfolio/         # Portfolio queries
│   ├── notifications/     # Notification system
│   ├── constants.ts       # 208 lines of constants
│   ├── types.ts           # 158 lines of types
│   └── utils.ts           # Utility functions
└── proxy.ts               # Auth middleware
```

### Data Flow
1. **Auth:** Middleware (`proxy.ts`) validates sessions via Supabase SSR
2. **Data Fetching:** Client components use `createClient()` from `@/lib/supabase/client`
3. **Forms:** Direct Supabase inserts/updates with optimistic UI
4. **Charts:** Data aggregated client-side from Supabase queries
5. **State:** Local component state + URL params for filters

---

## 2. Problem Areas Identified

### 2.1 Critical: Code Duplication

#### A. Form Duplication (Lines of Code Wasted: ~300+)
**Location:** `src/components/data-entry/`

Both `enterprise-spotlight-form.tsx` and `absa-onboarding-form.tsx` share identical patterns:
- Disability status/type handling (lines 110-135 in both)
- Age bracket calculation
- Form submission boilerplate
- Option merging logic

**Evidence:**
```typescript
// enterprise-spotlight-form.tsx:110-135
useEffect(() => {
  if (editEntry) {
    const storedType = editEntry.disability_type ?? "";
    const isPreset = !storedType || disabilityTypeOptions.includes(storedType);
    setForm({
      // ... 20 lines of mapping
    });
  }
}, [editEntry]);

// absa-onboarding-form.tsx:70-89 - nearly identical
```

#### B. Chart Function Duplication (Lines: ~100)
**Location:** `src/components/dashboard/chart-builders.ts:171-277`

`barChartOption()` and `horizontalBarChartOption()` are 95% identical:
- Same title/toolbox/tooltip configuration
- Same styling constants
- Only difference: axis orientation

#### C. Utility Function Duplication
**Functions found in multiple places:**
- `getAgeBracket()` - in `utils.ts` AND `bulk-upload.tsx:135-143`
- Option normalization logic - in 3+ files

### 2.2 High: Structural Issues

#### A. Hook Organization Inconsistency
```
src/hooks/                    (2 files - global)
src/lib/hooks/                (1 file - lib-scoped)
```

**Problem:** Unclear separation of concerns. `use-user.ts` uses Supabase (lib concern) but lives in global hooks.

#### B. Table Mapping Duplication
**Location:** `src/lib/types.ts:150-156` AND `src/components/data-entry/bulk-upload.tsx:127-133`

Two separate `TABLE_MAP` constants for the same purpose.

#### C. Type-Unsafe Database Access
Pattern found across 15+ files:
```typescript
const { data } = await supabase
  .from("enterprise_spotlight_entries")  // String table name
  .select("*");
setEntries((data as EnterpriseSpotlightEntry[]) ?? []);  // Type cast required
```

### 2.3 Medium: Maintainability Risks

#### A. Large Component Files
| File | Lines | Risk Level |
|------|-------|------------|
| `executive-dashboard.tsx` | 624 | High - Multiple concerns |
| `bulk-upload.tsx` | 583 | High - Validation + UI + parsing |
| `chart-builders.ts` | 607 | Medium - Should split |
| `media-program-form.tsx` | 486 | Medium - Business logic + UI |

#### B. Inline Data Aggregation
**Location:** `executive-dashboard.tsx:141-209`

Complex `useMemo` hooks with nested loops for data counting:
```typescript
const genderCounts = useMemo(() => {
  const counts: Record<string, number> = {};
  if (showES) {
    for (const e of esEntries) {
      if (e.gender) counts[e.gender] = (counts[e.gender] || 0) + 1;
    }
  }
  // Repeated for each program... (40+ lines)
}, [/* 8 dependencies */]);
```

#### C. Magic Numbers & Strings
- Date formats: `"YYYY-MM-DD"` repeated 12+ times
- Table names hardcoded in 20+ places
- `T23:59:59` timestamp suffix repeated

### 2.4 Low: Performance Concerns

#### A. Unnecessary Re-renders
`useUser()` hook fetches permissions on every mount without caching.

#### B. Client-Side Aggregation
Large datasets are fetched fully then aggregated client-side (executive dashboard).

---

## 3. Refactoring Strategies

### 3.1 Create Shared Form Abstractions

**New Files:**
- `src/lib/forms/demographic-fields.tsx` - Reusable disability/age/gender fields
- `src/lib/forms/use-form-submission.ts` - Shared submission logic
- `src/lib/forms/types.ts` - Common form types

### 3.2 Consolidate Chart Builders

**Refactor:** `chart-builders.ts`
- Merge `barChartOption` + `horizontalBarChartOption`
- Extract shared configurations
- Add factory function for chart types

### 3.3 Centralize Database Access

**New File:** `src/lib/db/tables.ts`
```typescript
export const TABLES = {
  enterpriseSpotlight: 'enterprise_spotlight_entries',
  // ... typed table names
} as const;

export type TableName = typeof TABLES[keyof typeof TABLES];
```

### 3.4 Extract Dashboard Data Logic

**New Files:**
- `src/lib/dashboard/aggregations.ts` - Data counting utilities
- `src/lib/dashboard/hooks.ts` - Data fetching hooks
- `src/components/dashboard/gender-chart.tsx` - Single-purpose component

### 3.5 Move Hooks to Consistent Location

**Action:** Move all hooks to `src/hooks/` with clear naming:
- `use-user.ts` → `use-auth.ts` (rename for clarity)
- `use-core-indicator-options.ts` → `src/hooks/use-indicator-options.ts`

---

## 4. Priority Matrix

| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| Form duplication | High | Medium | **P0** |
| Chart builder merge | Medium | Low | **P1** |
| Table mapping centralization | Medium | Low | **P1** |
| Dashboard decomposition | High | High | **P2** |
| Hook reorganization | Low | Low | **P3** |

---

## 5. Implementation Plan

1. **Phase 1:** Create shared utilities (no functional changes)
2. **Phase 2:** Refactor forms to use shared components
3. **Phase 3:** Consolidate chart builders
4. **Phase 4:** Decompose large components
5. **Phase 5:** Add performance optimizations

---

*Report generated for codebase quality improvement initiative.*
