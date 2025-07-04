# CLI Framework Design

**Version**: 0.1 (Draft)
**Date**: 2025-07-04
**Author**: Claude Code (CLI & Testing Expansion Agent)
**Status**: Draft – Awaiting peer review

---

## 1. Current CLI Assessment

_Describe the existing `oclif` CLI, its command structure, testing capabilities, and integration points._

### 1.1 Command Inventory

- `workflow-test health-check` – runs application health tests
- `workflow-test import` – data import utilities
- `workflow-test dashboard-test` – dashboard integration checks
- _(Add full inventory via automated scan TBD)_

### 1.2 Strengths

- Extensible `oclif` plugin architecture
- Existing unit & integration test suites
- Active developer adoption (used in CI)

### 1.3 Gaps / Pain Points

- Limited real-time diagnostics (no Redis awareness)
- Fragmented test command outputs
- Tight coupling to Firebase-centric architecture

> **Action Item**: Generate full command inventory using a stub `workflow-test list --json` once Redis integration complete.

---

## 2. Redis CLI Integration Architecture

### 2.1 Redis Client Selection

- **Primary**: `redis@5.x` Node client with promise API
- **Fallback**: `ioredis` for advanced stream features (consumer groups)

### 2.2 Connection Configuration

- Environment-driven (`REDIS_URL`, `REDIS_TLS_CA`, etc.)
- Support `--redis-url` flag override for ad-hoc diagnostics

### 2.3 Command Abstraction Layer

- Create `RedisCommandBase` extending `oclif Command`
- Handles connection lifecycle, error handling, and shared flags

### 2.4 Data Security

- TLS enforcement by default
- `--insecure` flag only for local testing with explicit warning

---

## 3. Testing Command Design

| Command | Purpose | Key Flags |
|---------|---------|-----------|
| `redis:ping` | Validate basic connectivity | `--redis-url` |
| `redis:health` | Run suite of health checks (latency, auth, ACL) | `--json`, `--verbose` |
| `redis:streams:test` | Produce & consume test messages to verify stream config | `--stream=agent_updates` |
| `redis:benchmark` | Run performance benchmark (ops/sec) | `--duration`, `--pipeline` |

Output formats: human-readable table ⚙️  & JSON for CI.

---

## 4. Agent Coordination Framework

### 4.1 Multi-Agent Messaging Protocol

- Use Redis Streams (`agent_updates`, etc.)
- Standard message envelope `{ sender, recipients, action, payload }`

### 4.2 Task Delegation Workflow

1. CLI command XADDs task message ➜ `tasks`
2. Worker agents XRANGE / XREADGROUP
3. Agents XADD result to `task_results`
4. CLI aggregates results for user display

### 4.3 Error Handling

- Dead-letter stream `task_errors`
- Automatic retry logic configurable with flags

---

## 5. Sub-Agent Orchestration

Define `subagent:` command namespace.

Examples:

- `subagent:deploy <name>` – launches transient container/VM
- `subagent:status <name>` – fetches live status from Redis keyspace
- `subagent:logs <name>` – streams stdout/err via XREAD

Security: JWT-signed deploy requests to prevent unauthorized code execution.

---

## 6. Diagnostic and Monitoring Tools

- **Interactive REPL**: `redis:repl` opens node REPL pre-connected to Redis
- **Latency Heatmap**: `redis:latency:histogram` – collects CL.LATENCY HISTOGRAM & renders ASCII chart
- **Keyspace Analyzer**: `redis:keyspace:scan` – sample keys and group by type & size

---

## 7. CLI User Experience

Guidelines:

- Consistent flag naming (`--json`, `--verbose`, `--redis-url`)
- Colorized output using `chalk` with accessibility contrast
- Exit codes: `0=OK`, `1=General error`, `2=Connectivity error`, `3=Validation error`
- Progress spinners via `listr2` where appropriate

---

## 8. Integration Testing Framework

- **Jest** + **supertest** for command unit tests
- Spin-up ephemeral Redis docker in GitHub Actions via `redislabs/redis-stack`
- `test:redis` npm script to run integration tests locally (`docker-compose up -d redis-test`)
- Coverage target: ≥90% lines, ≥95% critical paths

---

## 9. Open Questions & Next Steps

1. Confirm whether to prefer `ioredis` over `redis` for consumer group reliability.
2. Define ACL strategy for CLI vs backend services.
3. Align message envelope schema with backend implementation (o3 MAX).  

**Next Milestones**:

- [ ] Peer review of this draft by all agents (deadline +48h)
- [ ] Implement `RedisCommandBase` prototype
- [ ] Add `redis:ping` and `redis:health` commands with unit tests
- [ ] Integrate with CI workflows

---

_This document is tracked via Redis Streams `design_docs_progress` with ID `design-cli-framework-001`. Updates should XADD progress messages with fields `section`, `status`, and `comment`._
