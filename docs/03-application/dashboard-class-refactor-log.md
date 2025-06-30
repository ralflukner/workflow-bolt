# Dashboard Hook-to-Class Migration Log

_Updated: 2025-06-23_

## Context
* Phase 1 requires **zero React hooks** in production code.
* The former `useTebraDebugDashboard.ts` hook handled polling & metrics.
* We introduced `TebraDebugDashboardContainer.tsx`, a **pure class component** with lifecycle methods, to replace that hook.

## Steps Completed
1. **Deleted experimental hooks**
   * `src/hooks/useHealthChecks.ts`
   * `src/hooks/useTebraDebugDashboard.ts`
2. **Created** `src/components/TebraDebugDashboardContainer.tsx`
   * Holds all dashboard state (`dataFlowSteps`, `metrics`, `recentErrors`).
   * Uses `componentDidMount`, `componentDidUpdate`, `componentWillUnmount` for the 30-second polling interval; _no `useEffect`_.
   * Exposes manual `Refresh Now` button and auto-refresh toggle.
   * Renders existing presentational atoms `MetricsCard` and `DataFlowStepCard`—so visual layout is unchanged.
3. **Wired PatientContext** via the `contextType` static so we can read `patients.length` without hooks.
4. **Temporarily stubbed** real health-check calls with placeholders; functional parity will be re-added incrementally.

## Next Fixes (tracked in Phase 1 plan)
* Type clean-up (union status, JSX namespace) and tsconfig inclusion.
* Replace `useClickOutside` hook with class-based HOC.
* Point routing to the new container and delete the legacy monolith component.
* Restore real `tebraDebugApi` checks inside `runHealthChecks()`.
* Add Jest tests for the new container via React Testing Library + JSDOM.

––– 