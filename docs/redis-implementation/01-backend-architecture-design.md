# Backend Architecture Design

**Version**: 0.1 (Draft)
**Date**: 2025-07-04
**Author**: o3 MAX (Backend Architecture Lead)
**Status**: Draft – Awaiting peer review

---

## 1. Current State Analysis

### 1.1 Technology Stack (Today)
- **Frontend**: React 18 + Vite + Firebase hosting (static)
- **Authentication**: Auth0 → Firebase Custom Token exchange (HIPAA compliant)
- **Serverless Backend**: Firebase Functions (Node 18) – multiple endpoints
- **PHP Service Layer**: Cloud-Run-hosted `tebra-php-api` bridging to Tebra SOAP
- **Data Store**: Firestore + Realtime DB for session/state; limited querying
- **Message Bus**: None (React Context polling) – leads to ⌀ real-time updates
- **Pain Points**
  - Latency: Function cold-starts (200-800 ms) + PHP hop
  - Complexity: 4 different auth hand-offs for a single request
  - Cost: Firebase >$200/mo, Cloud Run spikes on bursts
  - Reliability: 60 % uptime during peak due to chained failures
  - Scalability: Firestore queries ↔ HIPAA PHI limits

### 1.2 Failure Modes Observed
| Layer | Symptom | Root Cause |
|-------|---------|------------|
| Firebase Fn | 404 / CORS | Function not deployed / missing IAM | 
| PHP API | 502 / 504 | Container cold-start or unhandled exception |
| Tebra SOAP | 429 | Rate-limit at vendor side |
| Firestore | Hot-document contention | Front-end polling in tight loop |

---

## 2. Redis Middleware Architecture (Target)

### 2.1 High-Level Diagram
```
┌─────────┐      HTTPS       ┌─────────────┐      Redis Streams       ┌──────────────┐
│ Frontend│ ───────────────▶ │ Express API │ ───────────────────────▶ │   Workers    │
└─────────┘  WebSockets ▲    └─────────────┘                             │  (Tebra)   │
                 │            ▲         ▲                                └──────────────┘
                 └────────────┴─────────┘
                     TLS-Redis Cluster (HA)
```

### 2.2 Components
1. **Express API Gateway** (Node 18)
   • Routes: `/api/v1/*` (REST) + `/ws` (Socket.IO)
   • Auth Middleware: Verify Auth0 JWT (skip Firebase), attach user claims
   • Rate Limiter: Redis token-bucket per IP+UID
   • Circuit Breaker: Proxy state to Redis key `cb:tebra`; open after 3 failures
2. **Redis Cluster (HA)**
   • Primary + Replica on Memorystore Enterprise (HIPAA)
   • Streams: `agent_updates`, `tasks`, `task_results`, `audit`
   • Hashes: Patient state, config cache
3. **Worker Pool**
   • Typescript workers (BullMQ) pulling from `tasks`
   • SOAP interactions with Tebra → results to `task_results`
4. **Audit Logger**
   • Subscribes to all streams, writes signed JSON lines to Cloud Logging (HIPAA)

### 2.3 Data Flow (Sync Schedule Example)
1. Front-end POST `/api/v1/schedule/sync?date=2025-07-04`
2. API validates & XADDs task `{action:"sync_schedule",date:..}` to `tasks`
3. Worker consumes, calls Tebra SOAP, XADDs result to `task_results`
4. API (via consumer group) pushes WebSocket event `schedule_synced` back
5. React updates dashboard in <100 ms end-to-end.

---

## 3. Circuit Breaker Implementation
| Metric | Threshold | Action |
|--------|-----------|--------|
| `tebra:error_5xx` | 3 errors in 60 s | Open breaker (stop traffic 1 min) |
| `tebra:latency_p95` | >3 s for 2 mins | Half-open, sample 1 in 10 |
| Manual override | Ops flag `cb:force_open` | Open until cleared |

Redis Keys
```
cb:tebra = { state: "closed" | "open" | "half", opened_at, last_fail }
```

---

## 4. Data Flow Diagrams

### 4.1 Current vs Target
_current & target diagrams will be rendered as Mermaid in appendix._

### 4.2 State Transition (Patient)
1. scheduled → arrived → appt-prep → ready-for-md → with-doctor → completed
2. Stored in Redis Hash `patient:{id}:{date}`

---

## 5. Interface Specifications

REST Endpoints (subset)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/providers` | Cached list (Redis TTL 1 h) |
| GET | `/api/v1/appointments` | Query by date range |
| POST | `/api/v1/schedule/sync` | Trigger schedule sync task |
| GET | `/api/v1/schedule/status/:date` | Retrieve latest sync metrics |

Redis Stream Schemas
```
agent_updates  *  sender  string  action  string  payload  JSON
tasks          *  task_id ULID    action  string  params   JSON
```

Error Response (JSON)
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT",
    "message": "Too many requests"
  },
  "timestamp": "2025-07-04T12:34:56Z"
}
```

---

## 6. Security Design
- **Auth**: Auth0 JWT + JWKS caching (60 s) – no Firebase hop
- **Transport**: TLS 1.3 only; HSTS 1 year
- **Data-at-Rest**: Redis Enterprise encryption; Google CMEK
- **PHI Handling**: Minimal persisted PHI (only hashed patient id in Redis keys)
- **Audit Logs**: Signed JSON lines → Cloud Logging sink → BigQuery

---

## 7. Performance Requirements
- **Latency**: <100 ms P95 for dashboard update events
- **Throughput**: 1k schedule-sync tasks / hr peak
- **Scalability**: Horizontally scale workers via Cloud Run jobs (max 20)
- **Cost Target**: <$150 mo infra (Redis Enterprise + Cloud Run)

---

## 8. Implementation Plan

| Phase | Duration | Milestones |
|-------|----------|------------|
| P1 – Prototype | 1 wk | Express gateway + Redis cluster up, Sync Schedule task implemented |
| P2 – Migration | 2 wks | Front-end switches to new API; old Firebase path read-only |
| P3 – Cut-over  | 1 wk | All traffic through Redis path, deprecate Firebase Functions |
| P4 – Cleanup   | 1 wk | Remove PHP layer, teardown Firestore writes |

Rollback: Blue/Green via Cloud Run revisions, DNS switch.

Monitoring: Cloud Monitoring dashboards (latency, error%, stream lag), PagerDuty alerts.

Success Metrics: 99.9 % uptime, <1 s end-to-end sync.

---

## 9. Open Questions & Next Steps
1. Final decision: Memorystore Enterprise vs Redis Cloud HIPAA.
2. Data retention policy for Redis Streams (history vs capped length).
3. Contract for cross-agent task envelope (`payload` schema alignment).

**Next Milestones**
- [ ] Team review of this draft within 48 hours.
- [ ] Prototype Express gateway + `/health` endpoint.
- [ ] Define shared message envelope with Claude Code & Opus.

---

_Tracked via Redis Streams `design_docs_progress` with ID `design-backend-architecture-001`. Please XADD updates with fields `section`, `status`, `comment`._ 