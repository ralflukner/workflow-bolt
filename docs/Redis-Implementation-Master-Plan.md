# Redis Implementation Master Plan

**Version**: 1.0  
**Date**: 2025-07-04  
**Authors**: Multi-Agent Team (Claude Code, o3 MAX, Sider.AI, Claude App, Opus)  
**Status**: Design Phase  

## Executive Summary

This document outlines the comprehensive plan for migrating workflow-bolt from a fragmented Firebase/Auth0/PHP architecture to a unified Redis-first system. The implementation follows a design-first approach with detailed documentation before any code implementation.

## Design-First Implementation Strategy

**PRINCIPLE**: All agents must complete design documentation before writing any code. No "wild-west cowboying" - every component must be architecturally planned, reviewed, and approved.

### Implementation Phases

1. **Phase 1: Design Documentation** (Current Phase)
2. **Phase 2: Design Review & Approval**
3. **Phase 3: Coordinated Implementation**
4. **Phase 4: Integration Testing**
5. **Phase 5: Production Deployment**

## Agent Design Document Assignments

### 🔵 o3 MAX - Backend Architecture Design

**Design Document**: `docs/redis-implementation/01-backend-architecture-design.md`

**Required Documentation**:

```markdown
# Backend Architecture Design

## 1. Current State Analysis
- Firebase Functions analysis (identify all 86 auth files)
- PHP service layer mapping
- Tebra API integration points
- Current failure modes and bottlenecks

## 2. Redis Middleware Architecture
- Express + Redis middleware layer design
- API endpoint specification (RESTful design)
- Authentication flow simplification
- Session management implementation

## 3. Circuit Breaker Implementation
- Tebra API failure detection algorithms
- Redis-based health monitoring
- Automatic failover mechanisms
- Recovery protocols

## 4. Data Flow Diagrams
- Current: Frontend → Auth0 → Firebase → Functions → PHP → Tebra
- Target: Frontend → Redis Middleware → Worker Services
- State transition diagrams
- Error handling workflows

## 5. Interface Specifications
- API endpoint contracts
- Redis data structures
- Message queue schemas
- Error response formats

## 6. Security Design
- Redis session security
- API authentication protocols
- HIPAA compliance measures
- Audit logging specifications

## 7. Performance Requirements
- Latency targets (<100ms for state updates)
- Throughput specifications
- Scalability planning
- Load testing scenarios

## 8. Implementation Plan
- Migration strategy (parallel vs sequential)
- Rollback procedures
- Monitoring and alerting
- Success metrics
```

**Deliverables**:

- Complete architectural design document
- API specification with OpenAPI/Swagger
- Data flow diagrams
- Security model documentation
- Performance benchmarking plan

---

### 🟠 Sider.AI - Production Infrastructure Design

**Design Document**: `docs/redis-implementation/02-production-infrastructure-design.md`

**Required Documentation**:

```markdown
# Production Infrastructure Design

## 1. Current Infrastructure Assessment
- Firebase/Auth0 cost analysis ($200+/month)
- Reliability issues (60% uptime analysis)
- Security audit of current implementation
- HIPAA compliance gaps

## 2. Redis Cloud Architecture
- Google Cloud Memorystore vs Redis Cloud comparison
- High availability configuration
- Backup and disaster recovery
- Geographic distribution strategy

## 3. HIPAA Compliance Design
- Encryption at rest and in transit
- Audit logging requirements
- Access control mechanisms
- Data retention policies

## 4. Deployment Architecture
- Google Cloud Run configuration
- Container orchestration design
- Auto-scaling policies
- Load balancing strategy

## 5. Monitoring and Observability
- Redis performance metrics
- Application health monitoring
- Alert escalation procedures
- Dashboard design specifications

## 6. Security Framework
- Network security design
- Authentication and authorization
- Certificate management
- Intrusion detection

## 7. Cost Optimization
- Resource allocation planning
- Cost comparison analysis
- Budget forecasting
- ROI calculations

## 8. Compliance Documentation
- HIPAA technical safeguards
- Audit trail implementation
- Risk assessment procedures
- Compliance validation testing
```

**Deliverables**:

- Infrastructure architecture document
- HIPAA compliance design
- Cost-benefit analysis
- Deployment automation scripts design
- Monitoring and alerting specifications

---

### 🟢 Claude App - Testing Framework Design

**Design Document**: `docs/redis-implementation/03-testing-framework-design.md`

**Required Documentation**:

```markdown
# Testing Framework Design

## 1. Current Testing Assessment
- Analysis of 756 existing test files
- Test coverage gaps identification
- Performance testing limitations
- Integration testing challenges

## 2. Redis Integration Testing Strategy
- Unit testing approach for Redis components
- Integration testing methodology
- End-to-end testing scenarios
- Performance benchmarking framework

## 3. Test Data Management
- Redis test database design
- Mock data generation strategies
- Test isolation mechanisms
- Data cleanup procedures

## 4. Performance Testing Design
- Load testing scenarios
- Stress testing protocols
- Redis performance benchmarks
- Comparison testing (Firebase vs Redis)

## 5. Reliability Testing Framework
- Failure scenario testing
- Circuit breaker validation
- Recovery testing procedures
- Chaos engineering approach

## 6. HIPAA Compliance Testing
- Security testing protocols
- Privacy validation procedures
- Audit trail verification
- Compliance reporting framework

## 7. Automated Testing Pipeline
- CI/CD integration design
- Test automation architecture
- Reporting and analytics
- Quality gates definition

## 8. Testing Tools and Utilities
- Custom testing utilities design
- Redis testing helpers
- Mock service implementations
- Test result analysis tools
```

**Deliverables**:

- Comprehensive testing strategy document
- Test automation framework design
- Performance benchmarking methodology
- HIPAA compliance testing procedures
- CI/CD integration specifications

---

### 🟣 Opus - Frontend Integration Design

**Design Document**: `docs/redis-implementation/04-frontend-integration-design.md`

**Required Documentation**:

```markdown
# Frontend Integration Design

## 1. Current Frontend Architecture Analysis
- React component dependency mapping
- Firebase integration points
- State management complexity
- Real-time update mechanisms

## 2. Redis Frontend Integration Strategy
- React hooks design for Redis connectivity
- Component update patterns
- State synchronization mechanisms
- Error handling and fallback strategies

## 3. Real-time Update Architecture
- WebSocket vs Server-Sent Events design
- Redis pub/sub integration
- Component subscription management
- Update batching and optimization

## 4. PatientContext Redesign
- Current context analysis
- Redis integration points
- State management optimization
- Performance improvements

## 5. WorkflowStatusTracker Enhancement
- Real-time status updates
- Redis stream integration
- Visual feedback mechanisms
- Error state handling

## 6. User Experience Design
- Loading state management
- Offline functionality
- Error messaging strategy
- Performance perception optimization

## 7. Component Architecture
- Redis-aware component patterns
- Reusable hook library design
- Event handling standardization
- Memory management optimization

## 8. Migration Strategy
- Gradual component migration
- A/B testing approach
- Rollback procedures
- User acceptance criteria
```

**Deliverables**:

- Frontend architecture design document
- React hooks library specification
- Component migration plan
- User experience enhancement design
- Performance optimization strategy

---

### 🔴 Claude Code - CLI Framework Design

**Design Document**: `docs/redis-implementation/05-cli-framework-design.md`

**Required Documentation**:

```markdown
# CLI Framework Design

## 1. Current CLI Assessment
- Existing oclif CLI analysis
- Command structure evaluation
- Testing capabilities inventory
- Integration points mapping

## 2. Redis CLI Integration Architecture
- Redis client integration design
- Command structure enhancement
- Multi-agent coordination protocols
- Sub-agent orchestration framework

## 3. Testing Command Design
- Redis health monitoring commands
- Patient workflow testing scenarios
- Performance benchmarking commands
- Integration testing automation

## 4. Agent Coordination Framework
- Multi-agent communication protocols
- Task delegation mechanisms
- Result aggregation strategies
- Error handling and recovery

## 5. Sub-Agent Orchestration
- Sub-agent deployment architecture
- Task distribution algorithms
- Result collection mechanisms
- Performance monitoring

## 6. Diagnostic and Monitoring Tools
- Redis connectivity diagnostics
- Performance monitoring commands
- Health check implementations
- Troubleshooting utilities

## 7. CLI User Experience
- Command interface design
- Output formatting standards
- Progress indication mechanisms
- Error messaging conventions

## 8. Integration Testing Framework
- Automated testing workflows
- Continuous integration support
- Result reporting mechanisms
- Quality assurance procedures
```

**Deliverables**:

- CLI framework design document
- Multi-agent coordination specification
- Sub-agent orchestration architecture
- Testing automation framework design
- Diagnostic tools specification

---

## Cross-Agent Coordination Requirements

### Design Review Process

1. **Individual Design Phase** (Week 1)
   - Each agent completes their design document
   - Internal architecture validation
   - Interface specification definition

2. **Cross-Agent Review Phase** (Week 2)
   - Design document peer review
   - Interface compatibility validation
   - Integration point verification
   - Conflict resolution

3. **Architecture Approval Phase** (Week 3)
   - Unified architecture document creation
   - Implementation plan finalization
   - Resource allocation planning
   - Timeline coordination

### Integration Points Documentation

**Required Cross-Agent Documentation**:

- API interface contracts between components
- Data flow specifications
- Event messaging protocols
- Error handling coordination
- Performance SLA agreements

### Quality Gates

**Design Phase Completion Criteria**:

- [ ] All design documents completed and reviewed
- [ ] Interface compatibility verified
- [ ] Integration points documented
- [ ] Performance requirements defined
- [ ] Security model approved
- [ ] HIPAA compliance validated
- [ ] Implementation timeline agreed

## Success Metrics

### Technical Metrics

- **Design Quality**: All interfaces specified and compatible
- **Documentation Coverage**: 100% of components documented
- **Review Completion**: All designs peer-reviewed and approved
- **Integration Planning**: All cross-agent dependencies mapped

### Implementation Readiness

- **Architecture Clarity**: Clear implementation path for each agent
- **Resource Planning**: Development timeline and resource allocation
- **Risk Mitigation**: Identified risks and mitigation strategies
- **Quality Assurance**: Testing strategy and validation procedures

## Current Status Update (2025-07-04 14:10)

### Redis 2FA & VPC Connectivity Progress

- **Redis Connection Refactor**: `redis-user-manager.py` now parameterized via `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_SSL` env vars (o3 MAX).
- **Memorystore Target Confirmed**: Host `10.161.35.147`, port `6379`, no TLS/auth. All serverless workloads must route through VPC.
- **VPC Connector**: `redis-connector` (Serverless VPC Access) confirmed READY in `us-central1` on `default` network.
- **Cloud Function Test**: `test-redis-connection` (Python 3.11, Gen-2) being deployed with `--vpc-connector redis-connector` to validate Memorystore access and basic read/write.
- **Local Dev Guidance**: Added checklist for Cloud Shell or IAP tunnel for laptops outside VPC.

### Task Board Snapshot

| ID | Task | Owner | Status |
|----|------|-------|--------|
| fix-redis-2fa | Parameterize connection & validate | o3 MAX | In Progress |
| vpc-verification | Confirm runtime connectivity via tests | o3 MAX & Claude-Opus | Pending |
| doc-consolidation | Central docs index | Claude App | Pending |
| git-actions-automation | CI & PM automation | Claude Code | Pending |
| redis-queue-arch | Finalise queue design | Sider.AI | Pending |
| add-risk-register | Risk/governance appendix | Sider.AI | Pending |
| gemini-assignment | Assign Gemini doc | User | Pending |
| setup-kanban | Shared Kanban board | Project Mgr | Pending |

### Immediate Next Steps (next 24 h)
1. Finish deploying `test-redis-connection` Cloud Function; confirm `PING`/set/get success.
2. Update infra README with env-var matrix & local-dev tunnelling instructions.
3. Mark `fix-redis-2fa` complete after successful function test; then start `vpc-verification`.
4. User to confirm Gemini's design-doc scope so task can move from Pending to Assigned.

### Risk Register Additions
- **Local Dev Access**: Memorystore private IP inaccessible from dev laptops ⇒ mitigated via Cloud Shell/IAP tunnel docs.
- **Env Drift**: Hard-coded hosts risk reappearing ⇒ mitigated via env-vars & CI linter rule.

---

## Update 2025-07-03 — Redis Streams Live 🚀 & Windsurf On-Boarding

The core message-queue infrastructure is now operational.

1. Redis Streams Go-Live
    • `agent_updates`, `standup:<date>` streams live in Redis Cloud (TLS).  
    • `RedisClient` and `redis_hello.py` utilities merged; markdown log retained as offline fallback.  
    • Unit-test suite (`ai-agents/tests/test_redis_client.py`) mocked Redis and passed in CI.

2. New AI Agent
    • **Windsurf** (Full-Stack) joined, published first greeting to `agent_updates`.  
    • Focus: plumbing Redis across CLI ↔ React ↑ Backend.

3. Expanded Workstreams (adds to Roadmap)

| Week | Stream | Owner(s) | Deliverable |
|------|--------|----------|-------------|
| W-1  | Redis front-end hook | Opus | `useRedisEventBus`, Dashboard live health feed |
| W-1  | CLI Redis health cmd | Claude Code | `workflow-test redis-test --health-check` writes to stream |
| W-2  | Tebra health → stream | o3 MAX | `tebraDebugApi` emits `health` msgs |
| W-2  | EHR sync design doc   | Gemini + o3 MAX | `06-openemr-rxnt-integration-design.md` |
| W-3  | EHR sync service PoC  | Gemini | `RedisEhrSyncService` + Dropbox doc service |
| W-3  | Dashboard EHR card    | Opus | "EHR Sync Status" component |
| W-4  | Stand-up automation   | Claude Code | `scripts/post-standup.js`, daily summary bot |

4. Immediate Next Steps (24 h)
    1. Windsurf – finish PR for Redis hello utility tests & merge.  
    2. Claude Code – tail `agent_updates`; reply `windsurf-kickoff-ok`.  
    3. All agents – switch status logging to Redis client helper.  
    4. User – confirm Opus priority (Redis UI vs legacy URL fixes).

5. Risk Register Additions
    • Browser WebSocket to Redis Cloud may be blocked → fallback SSE proxy.  
    • Stream key growth → daily trim policy (`MAXLEN ~ 10k`).

6. Communication Protocol Reminder
    • Publish coordination messages to `agent_tasks`.  
    • Daily stand-up in `standup:<YYYY-MM-DD>` by 16:00 UTC.  
    • Message schema reference in `docs/streams-key-conventions.md`.

---
