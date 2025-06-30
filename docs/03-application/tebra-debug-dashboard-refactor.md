Mo# Tebra Debug Dashboard Refactor – Production-Ready Design

_Updated: 2025-06-23_

## Background

The original `src/components/TebraDebugDashboard.tsx` had grown to **780+ lines** and mixed UI, business logic, API calls, constants, mock data and diagnostic utilities in a single file.  This made the component difficult to test, reason about and extend.

## Design Goals

* **Single-responsibility modules** – keep UI, state/logic and network concerns isolated.
* **Production hardening** – remove simulation code, hard-coded URLs and dev-only artefacts.
* **Improved observability** – centralise health-check intervals and error limits.
* **Re-usability & testability** – expose small hooks and components with well-typed contracts.

## High-level Architecture

```mermaid
flowchart TD
  UI[TebraDebugDashboard.tsx<br/>presentation layer]
  Hooks[useTebraDebugDashboard.ts<br/>state orchestration]
  HC[useHealthChecks.ts<br/>step-specific checks]
  API[services/tebraDebugApi.ts<br/>Firebase/Cloud Run wrapper]
  Const[constants/tebraDebug.ts
  (types + configuration)]

  UI --> Hooks --> HC --> API
  Hooks --> Const
  HC --> Const
  UI --> Const
```

## Module Breakdown

1. **`constants/tebraDebug.ts`**  
   • Centralised _all_ configuration (timeouts, max errors, polling interval).  
   • Declares shared **TypeScript types**: `DataFlowStep`, `TebraMetrics`, `StepId`, `StepStatus`, etc.

2. **`services/tebraDebugApi.ts`**  
   • Thin, testable wrapper around **Firebase Functions** & **Cloud Run**.  
   • Handles URL construction, time-outs and error parsing in _one_ place.

3. **`hooks/useHealthChecks.ts`**  
   • Encapsulates the logic that maps a `StepId` ➜ `StepStatus`.  
   • Pure function; easy to unit-test in isolation.

4. **`hooks/useTebraDebugDashboard.ts`**  
   • Orchestrates dashboard state, metrics aggregation, auto-refresh and diagnostics.  
   • No JSX – purely data management.

5. **Component library (`src/components/TebraDebug/*`)**  
   • `StatusIndicator`, `MetricsCard`, `DataFlowStepCard` – small, focused UI atoms.  
   • Re-used by **main dashboard** and any future admin screens.

6. **`components/TebraDebugDashboard.tsx` (new)**  
   • Presentation-only.  
   • Consumes hook outputs, composes sub-components, no direct API calls.

## Key Production Improvements

* **Environment-aware configuration** – secrets & URLs pulled from `import.meta.env`, _never_ hard-coded.
* **Reduced bundle size** – large conditional code and mock logic removed.
* **Type-safety end-to-end** – shared types guarantee contract alignment between layers.
* **Observability** – unified `generateCorrelationId()` and capped recent error list.
* **30 s polling** instead of aggressive 10 s Dev cadence.
* **Diagnostics Mode** – expensive deep checks are now opt-in (button toggle).

## Migration Notes

1. **Remove** legacy file after verifying parity:
   ```bash
   git rm src/components/TebraDebugDashboard.tsx
   ```
2. Re-export new dashboard from index routes or layout.
3. Update any import paths that referenced the monolith component.

## Future Work

* Add unit tests for `useHealthChecks` and `tebraDebugApi`.
* Wire into global error boundary to surface uncaught exceptions.
* Consider splitting `PhpDiagnostics` panel into its own route if it grows again.

–––

Maintainer: _DevOps/Frontend Guild_
