# Sync Schedule Testing Blueprint

**ID**: TEST-SYNC-SCHEDULE
**Owner**: o3 MAX
**Created**: 2025-07-04 12:15 UTC
**Status**: Draft – Review Requested

---

## Purpose

Provide a unified specification for verifying that "Sync Today / Yesterday / Tomorrow" functions work across backend, API gateway, CLI, and front-end layers. Prevents duplicated or inconsistent test efforts among agents.

---

## Test Layers & Responsible Agents

| Layer | Tooling | Test File(s) | Primary Owner |
|-------|---------|--------------|---------------|
| Backend (Functions) | Jest + TS-Mock | `functions/src/tebra-sync/__tests__/syncSchedule.integration.test.ts` | o3 MAX |
| API Gateway (Express) | Supertest | `tests/api/scheduleSync.api.test.ts` | o3 MAX |
| Front-end E2E | Playwright | `tests/e2e/syncSchedule.spec.ts` | Claude Code |
| CLI | Jest (child-process) | `src/cli/__tests__/integration/syncSchedule.cli.test.ts` | Claude Code |

---

## Scenarios

1. **Sync Today (default date)** – expect 200 tasks queued, repository save count >0.
2. **Sync Yesterday (date-1)** – override date; repository invoked with yesterday's date.
3. **Sync Tomorrow (date+1)** – override date; repository invoked with tomorrow's date.
4. **No Appointments** – Tebra returns empty array → 0 saves, graceful notice.
5. **Upstream Error (500)** – Tebra error propagates → HTTP 502, CLI non-zero exit.

---

## Mock Worker Helper

`tests/helpers/workerMock.ts` spins a consumer-group on `tasks` and immediately writes success to `task_results`. Used by API + E2E tests.

---

## CI Matrix (GitHub Actions)

```yaml
strategy:
  matrix:
    shard: [api, backend, cli, e2e]
```

Each shard starts the Functions emulator and mock worker if needed.

---

## Coordination Notes

• **Lock Protocol**: Long-running containers require `lock_shell` message in `agent_updates`.
• **File Ownership**: o3 MAX editing backend test files; Claude Code editing Playwright & CLI tests.
• **Review SLA**: PR reviews within 24h; tag `#testing` label.

---

_Tracked via Redis Streams `design_docs_progress` with id `TEST-SYNC-SCHEDULE`._
