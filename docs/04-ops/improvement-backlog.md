---
title: Operational Improvement Backlog
lastUpdated: "2025-06-29"
status: active
tags:
  - improvement
  - backlog
  - testing
  - monitoring
---

# 🛠️ Operational Improvement Backlog

_A living list of follow-up tasks that emerged from recent incidents and retrospectives.  Owners are provisional; update during sprint planning._

## 📑 Index
1. [Immediate Action Items](#immediate-action-items)
2. [Long-Term Enhancements](#long-term-enhancements)
3. [Monitoring &amp; Observability](#monitoring--observability)
4. [Process Improvements](#process-improvements)

---

## Immediate Action Items

| # | Task | Owner | Priority | Effort | Status |
|---|------|-------|----------|--------|--------|
| 1 | Console-error sentinel in Jest setup | QA | 🔴 High | 2–4 h | ⬜ To Do |
| 2 | Optimise `npm test` scripts (`--runInBand`, CI reporter) | Dev Ops | 🟠 Med | 1–2 h | ⬜ To Do |
| 3 | Runtime-error smoke test for `<App/>` | Front-end | 🟠 Med | 2–3 h | ⬜ To Do |
| 4 | Weekly coverage report ≥ 80 % util / 50 % UI | QA | 🟡 Low | 3–4 h | ⬜ To Do |

<details><summary>📄 Reference snippets</summary>

```ts
// jest.setup.ts – console sentinel
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    if (/Not wrapped in act/.test(args[0])) return; // allow RTL act warnings
    throw new Error('Console error:\n' + args.join(' '));
  });
});
```

```jsonc
// package.json – script optimisations
{
  "scripts": {
    "test":     "cross-env NODE_OPTIONS='--experimental-vm-modules' jest --runInBand",
    "test:watch": "npm test -- --watch",
    "test:ci":   "npm test -- --ci --reporters=default --reporters=jest-junit"
  }
}
```

</details>

---

## Long-Term Enhancements

| # | Theme | Description | Priority | Effort |
|---|-------|-------------|----------|--------|
| L-1 | Utility extraction | Move status mapping, time utils, metrics to `src/utils/` | 🟠 Med | 1–2 w |
| L-2 | End-to-end tests   | Cypress / Playwright for full patient workflow | 🔴 High | 2–3 w |
| L-3 | Perf monitoring    | Automated regression tests & bundle-size guard | 🟠 Med | 1–2 w |
| L-4 | Security scanning  | Dependabot / Snyk + HIPAA checks in CI | 🔴 High | 1 w |

---

## Monitoring & Observability

* **Function health check** – `test-functions-properly.cjs` ✅ Implemented
* **Error tracking (Sentry / Cloud Error Reporting)** – 🔄 Planned
* **Performance baselines** – 🔄 Planned

---

## Process Improvements

Task | Status | Notes
---- | ------ | -----
Documentation standards | 🟡 In Progress | Adopt Markdown-lint + front-matter template
Code-review checklist  | ⬜ Planned | Define mandatory items (tests, docs, security)
Deployment run-books   | ⬜ Planned | Formalise Cloud Run / Functions promotion steps

---

_Last review: 2025-06-29 • Next review: next sprint retro_