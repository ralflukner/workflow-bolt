# Phase 1 – Dashboard Refactor & Test-Suite Repair

_Updated: 2025-06-23_

## Objective

Refactor the oversized `TebraDebugDashboard.tsx` into a modular, maintainable structure **without altering runtime behaviour**, _and_ restore a green test/CI pipeline.

## Branch Workflow

```bash
# create long-lived integration branch for Phase 1 work
$ git checkout -b phase1-refactor-testing
```

All stacked PRs will merge into this branch until Phase 1 acceptance criteria are met.

## Work Breakdown

| Δ | Scope | Key Tasks |
|---|-------|----------|
| **A** | _Module skeleton_ | • Create `src/constants/`, `src/services/`, `src/hooks/`, `src/components/TebraDebug/`<br/>• Move **only** shared types/constants to `constants/tebraDebug.ts` |
| **B** | _API wrapper_ | • Add `services/tebraDebugApi.ts` (Firebase callable wrappers)<br/>• Switch one existing call path to prove wiring |
| **C** | _Health-check hook_ | • Implement `hooks/useHealthChecks.ts`<br/>• Unit-test with mocked API service |
| **D** | _Dashboard state hook & atoms_ | • Introduce `useTebraDebugDashboard.ts`<br/>• Create `MetricsCard`, `StatusIndicator`, `DataFlowStepCard` components<br/>• Use them _inside_ existing monolith for now |
| **E** | _Delete monolith & wire new UI_ | • Build new `components/TebraDebugDashboard.tsx` presentation layer<br/>• Remove legacy file & update imports |
| **F** | _Testing/CI repairs_ | 1. **Type errors** — fix undefined imports, unused vars, invalid casts.<br/>2. **Jest v30 updates** — `jest.MockInstance`, ESM transform.<br/>3. **CI scripts** — add `npm run test:unit`, flag-guarded integration jobs.<br/>4. Ensure `npx tsc --noEmit` & `npm run test:unit` pass. |

## Acceptance Criteria

* ✅ `npx tsc --noEmit` → 0 errors
* ✅ `npm run test:unit` green locally & in CI
* ✅ `npm run test:integration` passes when `RUN_INTEGRATION_TESTS=true`
* ✅ New modular files match the architecture in `tebra-debug-dashboard-refactor.md`
* ✅ No visual/functional regression in the dashboard

## CI Matrix (GitHub Actions)

```yaml
jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:unit

  integration:
    needs: unit
    runs-on: ubuntu-latest
    env:
      RUN_INTEGRATION_TESTS: true
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:integration
```

## Migration Notes

1. Delete legacy file **only** after new dashboard renders correctly.
2. Update Storybook stories and route exports to point at the new component.
3. Keep Phase 1 branch open until QA confirms parity.

## Owners

* Frontend lead: _you@
* Dev-ops contact: _ops@

–––
