# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working
with code in this repository.

## Commands

### Development

```bash
# Start the development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint

# Run type checking
npm run typecheck
```

### Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run real API tests only
npm run test:real-api

# Run tests with coverage
npm run test:coverage
```

### CLI Testing Framework

```bash
# Redis infrastructure testing
npx workflow-test redis:health                    # Redis connectivity & health
npx workflow-test redis:performance --load=100    # Load testing via Redis
npx workflow-test redis:queues --monitor          # Queue monitoring
npx workflow-test redis:streams --tail            # Live stream monitoring

# Patient workflow testing
npx workflow-test patient:workflow --scenario=checkin     # Test patient check-in flow
npx workflow-test patient:realtime --concurrent=10        # Real-time update testing
npx workflow-test patient:state --validate               # State consistency testing

# Integration testing
npx workflow-test integration:tebra --via-redis          # Tebra API via Redis queues
npx workflow-test integration:auth --redis-sessions      # Redis session testing
npx workflow-test integration:full --end-to-end          # Complete system test

# Performance & reliability
npx workflow-test performance:baseline               # Performance benchmarking
npx workflow-test reliability:circuit-breaker        # Circuit breaker testing
npx workflow-test reliability:failover              # Failover scenario testing

# Development utilities
npx workflow-test schedule:import --file=path/to/file.csv    # Import schedule data
npx workflow-test schedule:test --mock                      # Test with mock data
npx workflow-test schedule:validate --check-format          # Validate schedule format
```

## Code Architecture

### Project Overview

This is a Patient Flow Management dashboard built with Vite, React,
TypeScript, and Tailwind CSS. It provides an interface for managing patient
appointments and workflow in a clinical setting.

### Core Technologies

- Vite for build tooling

- React 18+ for UI components

- TypeScript for type safety

- Tailwind CSS for styling

- Auth0 for authentication

### State Management

The application uses React Context API for state management:

1. **TimeContext** (`src/context/TimeContext.tsx`):

   - Manages real or simulated time
   - Provides time simulation capabilities
   - Offers time formatting utilities

2. **PatientContext** (`src/context/PatientContext.tsx`):
   - Stores and manages patient data
   - Handles patient status transitions
   - Calculates metrics like wait times
   - Provides methods to add/update patients

### Key Data Types

1. **Patient** (`src/types/index.ts`):

   - Central data structure for patient information
   - Contains appointment details, status, and timestamps

2. **PatientApptStatus** (`src/types/index.ts`):
   - Combined type for internal workflow and external scheduling statuses
   - Statuses include: scheduled, arrived, appt-prep, ready-for-md,
     With Doctor, seen-by-md, completed

### Component Hierarchy

```text
App
├── TimeProvider
│   └── PatientProvider
│       └── Dashboard
│           ├── MetricsPanel
│           ├── TimeControl
│           ├── PatientList (multiple instances)
│           │   └── PatientCard (multiple instances)
│           ├── NewPatientForm (modal)
│           └── ImportSchedule (modal)

```

### Data Flow

1. The TimeContext provides current time (real or simulated)
2. The PatientContext maintains patient data and status
3. Components read from these contexts and dispatch actions
4. Patient status changes trigger timestamp updates
5. Components re-render based on context changes

## Authentication

The application uses Auth0 for authentication:

- Auth0Provider wraps the application in `src/auth/AuthProvider.tsx`

- Environmental variables configure the Auth0 connection

- LoginButton and LogoutButton components handle authentication actions

- ProtectedRoute component ensures content is only accessible to
  authenticated users

## Key Features

1. **Dashboard View**: Visualizes patients by status
2. **Time Simulation**: Allows for testing workflows by advancing time
3. **Metrics Panel**: Shows key performance indicators
4. **Patient Management**: Add, update, and track patients through various stages
5. **Redis Middleware**: Real-time patient state management and event streaming
6. **Multi-Agent CLI**: Sophisticated testing framework with agent coordination
7. **HIPAA Compliance**: Secure patient data handling and audit logging

## Redis Architecture

The application is migrating to a Redis-first architecture to replace 80% of fragile infrastructure:

### Core Redis Components

1. **RedisMiddleware** (`src/services/redis/RedisMiddleware.ts`):
   - Central coordination layer for all Redis operations
   - Provides Express middleware integration
   - Handles authentication, state management, and event bus

2. **PatientStateManager** (`src/services/redis/PatientStateManager.ts`):
   - Real-time patient workflow state in Redis
   - Atomic operations for state transitions
   - Pub/sub for instant UI updates

3. **RedisAuthManager** (`src/services/redis/RedisAuthManager.ts`):
   - Session management replacement for Auth0+Firebase complexity
   - Simplified authentication flow
   - Secure session storage

4. **CircuitBreaker** (`src/services/redis/CircuitBreaker.ts`):
   - Service failure protection for external APIs
   - Intelligent failure detection and recovery
   - Health monitoring and metrics

5. **RedisEventBus** (`src/services/redis/RedisEventBus.ts`):
   - Real-time event streaming with <100ms latency
   - Replace polling with pub/sub architecture
   - Multi-agent coordination support

### Redis Configuration

```bash
# Environment variables for Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_password
REDIS_TLS_ENABLED=true
REDIS_AUTH_TTL=3600
REDIS_CIRCUIT_BREAKER_THRESHOLD=5
REDIS_PATIENT_STATE_TTL=86400
```

### Migration Strategy

- **Phase 1**: Redis foundation and basic middleware
- **Phase 2**: Patient state management migration
- **Phase 3**: Authentication simplification
- **Phase 4**: Circuit breaker implementation
- **Phase 5**: Complete infrastructure replacement

## Multi-Agent System

The project uses a sophisticated multi-agent coordination system for development:

### Active Agents

1. **Claude Code** (Interactive): Frontend UI, React components, CLI integration
2. **o3 MAX**: EHR integration, Redis architecture design
3. **Gemini**: Python backend containerization, deployment
4. **Sider.AI**: FastAPI backend, HIPAA compliance, project management
5. **Opus**: Full-stack development, system integration

### Agent Communication

- **Redis Streams**: Real-time coordination via `agent_updates` stream
- **Structured JSON**: Standardized messaging protocol
- **Task Delegation**: Autonomous sub-agent deployment for specialized tasks
- **Status Tracking**: Continuous progress monitoring and updates

### Coordination Files

- `agent_comm_log.md`: Central communication log with timestamped updates
- `docs/Redis-Middleware-Architecture.md`: Comprehensive architecture document
- `docs/CLI_INTEGRATION_TESTING_DESIGN.md`: CLI testing framework design

## Development Workflow

### For New Features

1. Use `npx workflow-test` CLI to validate current state
2. Check `agent_comm_log.md` for current agent activities
3. Deploy sub-agents for specialized analysis if needed
4. Implement changes following Redis-first patterns
5. Test with comprehensive CLI testing framework
6. Update agent communication log with progress

### For Bug Fixes

1. Use CLI health checks to identify issues
2. Check Redis connectivity and service status
3. Review circuit breaker states for external API issues
4. Use real-time monitoring via Redis streams
5. Apply fixes with proper Redis state management

### For Testing

1. **Unit Tests**: Focus on individual Redis components
2. **Integration Tests**: Test Redis middleware interactions
3. **Real-API Tests**: Validate external service integrations
4. **CLI Tests**: Use workflow-test commands for comprehensive validation
5. **Performance Tests**: Redis-based load testing and monitoring
