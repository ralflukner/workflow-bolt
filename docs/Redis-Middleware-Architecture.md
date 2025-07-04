# Redis Middleware Architecture for workflow-bolt

## 🎯 **Executive Summary**

This document outlines the Redis-first architecture that will replace 80% of workflow-bolt's fragile infrastructure, based on comprehensive analysis from Opus, Sider.AI implementation, and current system assessment.

## 📊 **Current System Analysis**

### **Pain Points Identified:**

- **86 auth files** creating dependency web
- **5-layer failure chain**: Frontend → Auth0 → Firebase → PHP → Tebra
- **756 test files** but scattered testing strategies
- **Multiple storage layers**: localStorage, Firebase, React Query
- **Complex authentication**: Auth0 + Firebase token exchange

### **Existing Assets:**

- ✅ **oclif CLI framework** operational (`src/cli/`)
- ✅ **Comprehensive Jest setup** with TypeScript
- ✅ **756 test files** covering unit/integration/real-api
- ✅ **Redis Streams** already operational for agent coordination

## 🏗️ **Redis Middleware Architecture**

### **Core Components:**

```
┌─────────────────────────────────────────────────────────────┐
│                    REDIS MIDDLEWARE LAYER                   │
├─────────────────────────────────────────────────────────────┤
│  RedisAuthManager     │  PatientStateManager  │  EventBus   │
│  - Session mgmt       │  - Patient workflow   │  - Pub/Sub  │
│  - JWT validation     │  - Real-time updates  │  - Streams  │
│  - Permission cache   │  - State persistence  │  - Logging  │
├─────────────────────────────────────────────────────────────┤
│  CircuitBreaker       │  WorkflowOrchestrator │  AuditLog   │
│  - Service health     │  - Process management │  - HIPAA    │
│  - Failure recovery   │  - Job queues         │  - Tracking │
│  - Cache management   │  - Task scheduling    │  - Events   │
└─────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  TebraService        │  NotificationService  │  ReportSvc  │
│  - API calls         │  - Real-time alerts   │  - Analytics│
│  - Circuit protected │  - WebSocket/SSE      │  - Export   │
│  - Queue processing  │  - Push notifications │  - Metrics  │
└─────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL APIS                           │
├─────────────────────────────────────────────────────────────┤
│     Tebra SOAP API   │   Email Services     │  Storage     │
│     - Patient data   │   - Notifications    │  - Files     │
│     - Appointments   │   - Alerts           │  - Backups   │
│     - Providers      │   - Reports          │  - Archive   │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 **Implementation Strategy**

### **Phase 1: Redis Foundation (Week 1)**

```typescript
// Core Redis middleware setup
export class RedisMiddleware {
  private redis: Redis;
  private authManager: RedisAuthManager;
  private stateManager: PatientStateManager;
  private eventBus: RedisEventBus;
  
  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
    this.authManager = new RedisAuthManager(this.redis);
    this.stateManager = new PatientStateManager(this.redis);
    this.eventBus = new RedisEventBus(this.redis);
  }
  
  // Express middleware integration
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      req.redis = this.redis;
      req.auth = this.authManager;
      req.patientState = this.stateManager;
      req.events = this.eventBus;
      next();
    };
  }
}
```

### **Phase 2: CLI Integration (Week 2)**

```typescript
// Redis-enabled CLI commands
export class RedisCliCommands {
  
  // Health check with Redis
  async healthCheck(): Promise<HealthReport> {
    const redisStatus = await this.redis.ping();
    const circuitBreakers = await this.getCircuitBreakerStatus();
    const queueLengths = await this.getQueueMetrics();
    
    return {
      redis: redisStatus ? 'healthy' : 'failed',
      services: circuitBreakers,
      queues: queueLengths,
      timestamp: new Date().toISOString()
    };
  }
  
  // Patient workflow testing
  async testPatientWorkflow(scenario: string): Promise<TestResult> {
    const testPatient = await this.createTestPatient();
    
    // Execute workflow steps via Redis
    await this.redis.xadd('patient_workflow', '*', {
      action: 'check_in',
      patient_id: testPatient.id,
      timestamp: Date.now()
    });
    
    // Verify state transitions
    const finalState = await this.waitForWorkflowCompletion(testPatient.id);
    return this.validateWorkflowResult(finalState, scenario);
  }
}
```

### **Phase 3: Testing Framework (Week 3)**

```typescript
// Redis-based test infrastructure
export class RedisTestFramework {
  
  // Test environment setup
  async setupTestEnvironment(): Promise<void> {
    // Create isolated Redis namespace for tests
    this.testRedis = new Redis(`${process.env.REDIS_URL}/test`);
    
    // Pre-populate test data
    await this.seedTestPatients();
    await this.setupMockServices();
  }
  
  // Integration test helpers
  async testEndToEndFlow(scenario: TestScenario): Promise<TestResult> {
    // Start workflow
    const workflowId = await this.startTestWorkflow(scenario);
    
    // Monitor via Redis streams
    const results = await this.monitorWorkflowProgress(workflowId);
    
    // Validate results
    return this.validateTestResults(results, scenario.expectations);
  }
  
  // Performance testing
  async performanceTest(loadConfig: LoadConfig): Promise<PerformanceReport> {
    const startTime = Date.now();
    
    // Simulate concurrent patient workflows
    const promises = Array(loadConfig.concurrent).fill(null).map(() => 
      this.simulatePatientWorkflow()
    );
    
    await Promise.all(promises);
    
    return {
      duration: Date.now() - startTime,
      throughput: loadConfig.concurrent / ((Date.now() - startTime) / 1000),
      errors: this.getErrorCount(),
      queueMetrics: await this.getQueueMetrics()
    };
  }
}
```

## 🧪 **Enhanced CLI Testing Commands**

### **New Redis-Enabled Commands:**

```bash
# Redis infrastructure testing
workflow-test redis:health                    # Redis connectivity & health
workflow-test redis:performance --load=100    # Load testing via Redis
workflow-test redis:queues --monitor          # Queue monitoring
workflow-test redis:streams --tail            # Live stream monitoring

# Patient workflow testing
workflow-test patient:workflow --scenario=checkin     # Test patient check-in flow
workflow-test patient:realtime --concurrent=10        # Real-time update testing
workflow-test patient:state --validate               # State consistency testing

# Integration testing
workflow-test integration:tebra --via-redis          # Tebra API via Redis queues
workflow-test integration:auth --redis-sessions      # Redis session testing
workflow-test integration:full --end-to-end          # Complete system test

# Performance & reliability
workflow-test performance:baseline               # Performance benchmarking
workflow-test reliability:circuit-breaker        # Circuit breaker testing
workflow-test reliability:failover              # Failover scenario testing
```

### **Test Coverage Enhancement:**

```typescript
// Coverage targets for Redis middleware
export const RedisCoverageTargets = {
  unit: {
    redisAuthManager: '95%',
    patientStateManager: '95%',
    circuitBreaker: '90%',
    eventBus: '90%'
  },
  integration: {
    redisMiddleware: '85%',
    workflowOrchestrator: '85%',
    serviceLayer: '80%'
  },
  endToEnd: {
    patientWorkflows: '100%',
    authenticationFlows: '100%',
    tebraIntegration: '90%',
    performanceTargets: '100%'
  }
};
```

## 📈 **Migration Benefits**

### **Reliability Improvements:**

- **Current**: 60% uptime (5 failure points)
- **Target**: 95%+ uptime (Redis-first architecture)

### **Performance Gains:**

- **Current**: 30-second polling for updates
- **Target**: <100ms real-time pub/sub updates

### **Cost Reduction:**

- **Current**: $200+/month (Firebase + Auth0 + Functions)
- **Target**: $20-50/month (Redis Cloud instance)

### **Complexity Reduction:**

- **Current**: 86 auth files, 5-layer chain
- **Target**: Single Redis middleware layer

### **Testing Improvements:**

- **Current**: 756 scattered test files
- **Target**: Unified Redis-based testing framework

## 🎯 **Success Metrics**

### **Technical Metrics:**

- Redis connection reliability: >99.9%
- Workflow completion rate: >95%
- Real-time update latency: <100ms
- Test execution time: <50% of current
- Authentication failure rate: <0.1%

### **Business Metrics:**

- Patient check-in time: <2 minutes
- Staff productivity: +30%
- System availability: >99%
- Error resolution time: <5 minutes
- Integration deployment time: <1 hour

## 🤝 **CLI Interaction with Redis Middleware**

The `oclif` CLI will play a crucial role in managing and interacting with the Redis middleware. New and enhanced CLI commands will provide developers and operations teams with tools for:

- **Health Monitoring:** Commands to check the status of Redis connections, queues, streams, and the overall health of services integrated with Redis.
- **Data Management:** Utilities for inspecting, modifying, and clearing data within Redis (e.g., patient states, session data, event streams).
- **Workflow Orchestration:** Commands to trigger, monitor, and debug patient workflows that leverage Redis Streams and queues.
- **Testing and Diagnostics:** Specialized commands for running Redis-specific unit, integration, and performance tests, as well as diagnosing connectivity or data consistency issues.

This integration will ensure that the CLI remains the primary interface for managing the `workflow-bolt` application, with full visibility and control over the new Redis-centric architecture.

## 🚀 **Next Steps**

1. **Immediate**: Deploy Redis PatientStateManager POC alongside existing system
2. **Week 1**: A/B test Redis vs Firebase for patient state management
3. **Week 2**: Implement Redis CLI testing commands
4. **Week 3**: Migrate authentication to Redis sessions
5. **Week 4**: Replace Firebase Functions with Express + Redis
6. **Week 5**: Performance testing and optimization
7. **Week 6**: Production cutover and monitoring

## 📋 **Action Items**

- [ ] **o3 MAX + Claude**: Finalize Redis middleware API design
- [ ] **Sider.AI**: Deploy PatientStateManager POC for testing
- [ ] **Opus + Gemini**: Redis connectivity resolution and testing
- [ ] **All Agents**: Review and approve architecture document
- [ ] **DevOps**: Redis Cloud production instance setup
- [ ] **QA**: Redis testing framework implementation

---

**Status**: Architecture designed, ready for implementation approval and POC deployment.
