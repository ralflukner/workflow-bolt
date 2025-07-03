# Testing Refactor Plan – Hook-less Dashboard Branch

_Updated: 2025-06-23_

## Motivation

Our new class-only code path broke several Jest suites because:

1. Components use **TanStack React-Query**, which needs a `QueryClientProvider` during tests.
2. Several tests relied on legacy `@testing-library/react` `render` without providers.
3. We added exclusions to `tsconfig.json` that accidentally hid JSX types, now fixed.

To stabilise CI we are _rebuilding_ the test harness in three steps.

## Step 1 – Central test helper (DONE)

File: `src/test-utils.tsx`

* Wraps RTL's `render` with a singleton `QueryClientProvider`.
* Re-exports everything from RTL so callers can `import { render, screen } from '@/test-utils'`.
* Zero global overrides in `setupTests.ts`, avoiding TypeScript parser issues.

## Step 2 – Incremental test migration (IN PROGRESS)

| Test file | Status | Action |
|-----------|--------|--------|
| `src/__tests__/App.test.tsx` | Updated | Switched to `@/test-utils` render |
| `src/components/__tests__/WaitTimeDiagnostic.test.tsx` | Pending | Needs same import swap & any additional mock context |
| other suites needing React-Query | Pending | Update when they fail |

The migration is safe because pure DOM/unit tests can keep default RTL imports—they don't touch React-Query.

## Step 3 – Re-enable failing suites

1. For each failing test, wrap render with our helper **and** supply minimal context mocks (e.g., `PatientContext`).
2. Use `jest.useFakeTimers()` + `advanceTimersByTime()` where components poll.
3. Push when TSC + `npm run test:unit` are both green.

## Futures

* Integration tests will import `render` from `@/test-utils` as well; we'll add helpers to mount Firebase emulator when needed.
* Nightly Cypress run will stay separate.

–––
