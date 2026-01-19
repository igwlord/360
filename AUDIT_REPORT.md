# CTO Level Audit: 360 Retail Media Command Center

**Date:** January 2026
**Version:** 1.0.0 (Alpha)
**Auditor:** Jules (CTO & Lead Architect)

## Executive Summary
The "360" system demonstrates a strong foundation in modern React development with a clear focus on UI/UX ("Glassmorphism"). However, the current architecture suffers from critical flaws in Data Integrity (offline persistence), Performance (Context Bloat), and Maintainability (Hardcoded values). The "Optimistic UI" implementation is fragile and risks data loss during offline-to-online transitions.

Below is the detailed audit report.

## Audit Findings

| Severity | File | Issue | Recommendation |
| :--- | :--- | :--- | :--- |
| 🔴 **Critical** | `DataContext.jsx` | **Data Loss Risk:** Offline changes to `campaigns`, `transactions`, etc., are stored in volatile `useState` (memory only), except for `calendarEvents`. On page reload, offline work is lost. | Implement `useLocalStorage` for ALL state entities or use a persistent store like IndexedDB/TanStack Query with persisters. |
| 🔴 **Critical** | `DataContext.jsx` | **Sync Overwrite:** `fetchData` naively overwrites local state (`setCalendarEvents([...mappedEvents])`) with server data. If a user creates an event offline, it is persisted to LS, but `fetchData` wipes it out when online without syncing it up first. | Implement a "Sync Queue" pattern. On load/online, push local changes to Supabase *before* fetching fresh data. |
| 🔴 **Critical** | `DataContext.jsx` | **Race Conditions:** `fetchData` has no cancellation logic. Rapid connectivity toggles or component remounts can cause race conditions where stale data overwrites fresh data. | Use `AbortController` or a library like TanStack Query (React Query) which handles cancellation and stale-while-revalidate out of the box. |
| 🟡 **Major** | `DataContext.jsx` | **Context Bloat:** The Context holds *everything* (Campaigns, Events, Billing, Notifications, UI State). Any update (e.g., a notification tick) re-renders ALL consumers (Calendar, Projects, etc.). | **Split Contexts:** `ProjectsContext`, `FinanceContext`, `CalendarContext`, `UIContext`. |
| 🟡 **Major** | `DataContext.jsx` | **Unstable Context Value:** The `value` object and `actions` object passed to `DataContext.Provider` are recreated on every render (not memoized). This forces re-renders of all consumers even if data hasn't changed. | Wrap `actions` and the `value` object in `useMemo`. |
| 🟡 **Major** | `Calendar.jsx` | **Expensive Render Logic:** `getEventsForDay` and `renderCalendarGrid` perform heavy filtering/date parsing (30-40 times per render). | Memoize processed events into a `Map<DateString, Events[]>` in the Context or a `useMemo` block to avoid O(N) filtering per cell. |
| 🟡 **Major** | `Projects.jsx` / `DataContext.jsx` | **Hardcoded Values:** Colors (`#db2777`, `bg-green-400`) and Strings (`'Planificación'`) are scattered. Changing a theme or status requires multi-file edits. | Move constants to `src/config/constants.js` and `src/theme/colors.js`. Use CSS variables or Tailwind classes mapped to config. |
| 🟡 **Major** | `App.jsx` | **No Error Boundary:** A crash in any component (e.g., `GlassTable` render error) crashes the entire app (White Screen of Death). | Wrap the `App` (or major routes) in a Global Error Boundary component to show a fallback UI. |
| 🟢 **Minor** | `Calendar.jsx` | **Fragile Dependencies:** `useEffect` depends on `getEventsForDay`, which depends on `calendarEvents`. A slight change in Context reference triggers `setSelectedDay` logic unnecessarily. | Refactor to use event-driven updates or stable selectors. |
| 🟢 **Minor** | `GlassTable.jsx` | **Theme Inconsistency:** Uses hardcoded `#E8A631` for accent instead of consuming `theme.accent`. | Replace hex codes with `theme.accent` from `ThemeContext`. |
| 🟢 **Minor** | `DataContext.jsx` | **Over-fetching:** `supabase.from(...).select('*')` retrieves all columns. | Select only necessary columns to reduce payload size and potential security exposure. |

## Refactoring Roadmap

This roadmap prioritizes data safety and stability before optimization.

### Phase 1: Data Safety (Immediate Action)
1.  **Fix Offline Persistence:** Switch `campaigns`, `transactions`, `providerGroups` to `useLocalStorage` (or better, `idb-keyval`) to survive reloads.
2.  **Implement Sync Queue:** Create a `SyncContext` that tracks offline mutations (`ADD_PROJECT`, `UPDATE_EVENT`). On `isOffline: false`, replay these mutations to Supabase sequentially.
3.  **Fix Fetch Logic:** Stop `fetchData` from blindly overwriting local state. Merge server data with local unsynced changes.

### Phase 2: Performance & Architecture (High Priority)
1.  **Split DataContext:** Extract `FinanceContext` (Transactions, RateCard) and `ProjectContext` (Campaigns) from `DataContext`. Keep `DataContext` for global/shared UI state or rename to `GlobalContext`.
2.  **Memoize Providers:** Wrap `value={...}` in `useMemo` in all providers to prevent unnecessary re-renders.
3.  **Optimize Calendar:** Refactor `Calendar.jsx` to pre-calculate the "Events by Date" map once per `calendarEvents` update, rather than filtering inside the render loop.

### Phase 3: Quality & Maintainability
1.  **Centralize Constants:** Create `constants/status.js`, `constants/colors.js`. Replace hardcoded strings/hexes.
2.  **Add Error Boundaries:** Implement `components/common/ErrorBoundary.jsx` and wrap routes.
3.  **Standardize Glassmorphism:** Create a generic `<GlassCard>` component and enforce theme usage (remove raw hex codes).

### Phase 4: Modernization
1.  **Migrate to TanStack Query:** Replace `useLocalStorage` + `fetchData` custom logic with React Query. It handles caching, offline support (via persisters), and race conditions natively. This effectively solves Phase 1 & 2 issues with standard library code.

---
*End of Audit Report*
