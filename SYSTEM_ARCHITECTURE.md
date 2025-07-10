# Workflow-Bolt System Architecture

**Version**: 1.0  
**Last Updated**: 2025-07-03  
**Document Type**: Master System Architecture  
**Classification**: Internal Technical Documentation

## Executive Summary

Workflow-Bolt is a comprehensive healthcare workflow management system that integrates with Tebra EHR (Electronic Health Record) system to provide real-time patient scheduling, appointment management, and clinical workflow optimization. The system employs a modern, microservices-based architecture with strong security controls, HIPAA compliance, and multi-tier proxy patterns for reliable external API integration.

**Key Capabilities:**

- HIPAA-compliant patient data management
- Real-time Tebra EHR integration via SOAP API
- Multi-tenant authentication using Auth0
- Redis-based inter-service communication
- Comprehensive CLI testing framework
- Advanced monitoring and debugging capabilities

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          WORKFLOW-BOLT SYSTEM ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐         │
│  │   React Frontend │    │   CLI Framework  │    │  AI Agent System │         │
│  │   (TypeScript)   │    │   (OCLIF/Node)   │    │   (Python)       │         │
│  │                  │    │                  │    │                  │         │
│  │ • Patient UI     │    │ • Test Runner    │    │ • Redis Client   │         │
│  │ • Dashboard      │    │ • Health Checks  │    │ • File Manager   │         │
│  │ • Debug Tools    │    │ • Integration    │    │ • Collaboration  │         │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘         │
│           │                        │                        │                  │
│           │                        │                        │                  │
│           ▼                        ▼                        ▼                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                         AUTHENTICATION LAYER                                │ │
│  │                                                                             │ │
│  │  ┌──────────────┐              ┌──────────────┐              ┌──────────────┐ │
│  │  │    Auth0     │              │   Firebase   │              │    Redis     │ │
│  │  │   Identity   │◄────────────►│     Auth     │              │ Event Bus    │ │
│  │  │              │              │              │              │              │ │
│  │  └──────────────┘              └──────────────┘              └──────────────┘ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                       │                                          │
│                                       ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                       FIREBASE FUNCTIONS LAYER                              │ │
│  │                                                                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │ │
│  │  │   tebraProxy │  │ exchangeAuth0│  │  syncSchedule│  │  dailyPurge  │   │ │
│  │  │   (Unified)  │  │    Token     │  │              │  │              │   │ │
│  │  │              │  │              │  │              │  │              │   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                       │                                          │
│                                       ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                          DATA PERSISTENCE LAYER                             │ │
│  │                                                                             │ │
│  │  ┌──────────────┐              ┌──────────────┐              ┌──────────────┐ │
│  │  │   Firestore  │              │ Secret Mgr   │              │  Redis Store │ │
│  │  │   Database   │              │   (GSM)      │              │  (Upstash)   │ │
│  │  │              │              │              │              │              │ │
│  │  │ • Patients   │              │ • API Keys   │              │ • Cache      │ │
│  │  │ • Sessions   │              │ • Secrets    │              │ • Pub/Sub    │ │
│  │  │ • Logs       │              │ • Configs    │              │ • Coord      │ │
│  │  └──────────────┘              └──────────────┘              └──────────────┘ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                       │                                          │
│                                       ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                       EXTERNAL INTEGRATIONS LAYER                           │ │
│  │                                                                             │ │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                 │ │
│  │  │ Cloud Run    │    │   Tebra EHR  │    │   Gemini AI  │                 │ │
│  │  │ PHP Service  │◄──►│   SOAP API   │    │   (Google)   │                 │ │
│  │  │              │    │              │    │              │                 │ │
│  │  │ • Rate Limit │    │ • Patients   │    │ • Chat Bot   │                 │ │
│  │  │ • Transform  │    │ • Appts      │    │ • Analysis   │                 │ │
│  │  │ • Security   │    │ • Providers  │    │ • Debug      │                 │ │
│  │  └──────────────┘    └──────────────┘    └──────────────┘                 │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Core Service Architecture

### 1. Frontend Layer (React/TypeScript)

**Primary Components:**

- **React Application** (`src/App.tsx`)
  - Single-page application with context-based state management
  - TypeScript for type safety and better developer experience
  - Tailwind CSS for responsive design

**Key Modules:**

- **Dashboard System** (`src/components/Dashboard.tsx`)
  - Patient management interface
  - Real-time appointment scheduling
  - Debug and monitoring tools
  
- **Context Management** (`src/context/`)
  - `PatientContext`: Patient data state management
  - `TimeContext`: Time-based operations and scheduling
  - `FirebaseContext`: Firebase service integration

- **Service Layer** (`src/services/`)
  - `tebraFirebaseApi.ts`: Unified proxy for Tebra integration
  - `authBridge.ts`: Auth0 to Firebase authentication bridge
  - `secureStorage.ts`: HIPAA-compliant local storage

### 2. CLI Framework (OCLIF/Node.js)

**Architecture:** (`src/cli/`)

- **Command System** (`src/cli/commands/`)
  - `health-check.ts`: System health verification
  - `import.ts`: Data import and validation
  - `verify.ts`: Integration testing and validation
  - `redis-test.ts`: Redis connectivity testing

- **Test Orchestration** (`src/cli/lib/`)
  - `TestOrchestrator.ts`: Coordinates integration tests
  - `BrowserController.ts`: Headless browser automation
  - `RedisTestFramework.ts`: Redis-based testing utilities

**Key Features:**

- Integration testing with real API endpoints
- Headless browser automation for UI testing
- Redis-based coordination for multi-service testing
- Health check monitoring across all services

### 3. Firebase Functions Backend

**Architecture:** (`functions/`)

- **Unified Proxy Pattern** (`functions/index.js`)
  - Single `tebraProxy` function handles all Tebra operations
  - Reduces function count and simplifies maintenance
  - Centralized error handling and logging

**Core Functions:**

- **`tebraProxy`**: Routes all Tebra API calls to PHP Cloud Run service
- **`exchangeAuth0Token`**: Converts Auth0 JWT to Firebase custom tokens
- **`syncSchedule`**: Automated schedule synchronization from Tebra
- **`dailyPurge`**: HIPAA-compliant data cleanup and archival

**Security Features:**

- JWT verification with Auth0 JWKS
- Rate limiting (100 requests/15 minutes per IP)
- HIPAA-compliant audit logging
- Credential verification middleware

### 4. AI Agent Coordination System

**Architecture:** (`ai-agents/luknerlumina/`)

- **Multi-Agent Framework** (Python)
  - `hipaa_workflow_agent.py`: HIPAA compliance automation
  - `patient_manager.py`: Patient data management
  - `ai_agent_collaboration.py`: Inter-agent coordination

- **Redis Integration** (`secure_redis_client.py`)
  - Secure Redis client with Google Secret Manager integration
  - HIPAA-compliant patient data storage
  - Pub/Sub messaging for agent coordination

**Key Features:**

- Workspace-based collaboration
- Secure file management with encryption
- Redis-based message passing between agents
- HIPAA audit trail for all operations

## Data Flow Architecture

### 1. Authentication Flow

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐
│   Frontend  │───►│    Auth0     │───►│ Firebase        │───►│  Protected   │
│   (React)   │    │   (JWT)      │    │ Functions       │    │  Resources   │
│             │    │              │    │ (JWT->Custom)   │    │              │
└─────────────┘    └──────────────┘    └─────────────────┘    └──────────────┘
       │                                          │                    │
       │                                          │                    │
       ▼                                          ▼                    ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐
│ Local       │    │ Auth0        │    │ Firebase Auth   │    │ Firestore    │
│ Storage     │    │ Domain       │    │ Custom Token    │    │ Access       │
│ (Secure)    │    │ Validation   │    │ Generation      │    │ Control      │
└─────────────┘    └──────────────┘    └─────────────────┘    └──────────────┘
```

### 2. Tebra API Integration Flow

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐
│   Frontend  │───►│   Firebase   │───►│   Cloud Run     │───►│  Tebra EHR   │
│   Request   │    │   Function   │    │   PHP Service   │    │  SOAP API    │
│             │    │ (tebraProxy) │    │                 │    │              │
└─────────────┘    └──────────────┘    └─────────────────┘    └──────────────┘
       │                    │                    │                    │
       │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐
│ Auth Check  │    │ Request      │    │ SOAP Request    │    │ Patient Data │
│ Rate Limit  │    │ Validation   │    │ Processing      │    │ Appointments │
│ Logging     │    │ Forwarding   │    │ Data Transform  │    │ Providers    │
└─────────────┘    └──────────────┘    └─────────────────┘    └──────────────┘
```

### 3. Redis Event Bus Flow

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐
│ AI Agents   │───►│    Redis     │───►│   CLI Tests     │───►│  Dashboard   │
│ (Python)    │    │  Event Bus   │    │   (Node.js)     │    │   (React)    │
│             │    │              │    │                 │    │              │
└─────────────┘    └──────────────┘    └─────────────────┘    └──────────────┘
       │                    │                    │                    │
       │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────┐
│ Patient     │    │ Pub/Sub      │    │ Test Results    │    │ Real-time    │
│ Processing  │    │ Messages     │    │ Coordination    │    │ Updates      │
│ Workflow    │    │ Task Queue   │    │ Status Updates  │    │ Alerts       │
└─────────────┘    └──────────────┘    └─────────────────┘    └──────────────┘
```

## Technology Stack

### Frontend Stack

- **React 18.3.1**: UI framework with hooks and context
- **TypeScript 5.3.3**: Type safety and enhanced developer experience
- **Tailwind CSS 3.4.1**: Utility-first CSS framework
- **Vite 6.3.5**: Build tool and development server
- **Firebase SDK 11.8.1**: Client-side Firebase integration
- **Auth0 React SDK 2.3.0**: Authentication integration
- **Lucide React**: Icon library for UI components

### Backend Stack

- **Node.js 20**: Runtime environment for Firebase Functions
- **Firebase Functions 6.3.2**: Serverless compute platform
- **Firebase Admin SDK 12.0.0**: Server-side Firebase integration
- **Express.js 4.18.2**: Web framework for HTTP endpoints
- **JWT/JWKS**: JSON Web Token authentication
- **Axios 1.7.2**: HTTP client for external API calls

### PHP Cloud Run Service

- **PHP 8.1+**: Runtime for Tebra SOAP API integration
- **SOAP Client**: Native PHP SOAP implementation
- **Google Cloud Run**: Containerized hosting platform
- **Docker**: Containerization for consistent deployments

### AI Agent Stack

- **Python 3.13**: Runtime for AI agents
- **Redis 5.5.6**: Event bus and caching layer
- **Google Secret Manager**: Secure credential storage
- **IORedis**: Redis client with async support

### CLI Framework

- **OCLIF 3.26.0**: Command-line interface framework
- **Jest 30.0.0**: Testing framework
- **Puppeteer 23.10.2**: Headless browser automation
- **Inquirer 12.3.3**: Interactive command-line prompts

### Database & Storage

- **Cloud Firestore**: NoSQL document database
- **Google Secret Manager**: Secure credential storage
- **Redis (Upstash)**: Caching and pub/sub messaging
- **Firebase Hosting**: Static site hosting

## Integration Patterns

### 1. Auth0 + Firebase Integration

**Pattern**: JWT Bridge Authentication

- Frontend authenticates with Auth0
- Firebase Functions validate Auth0 JWT
- Custom Firebase tokens generated for Firestore access
- Single sign-on across all services

**Configuration**:

- Auth0 Domain: `dev-uex7qzqmd8c4qnde.us.auth0.com`
- Audience: `https://api.patientflow.com`
- Client ID: `I8ZHr1uCjPkO4ePgY6S421N9HQ0nnN7A`

### 2. Three-Tier Tebra Integration

**Pattern**: Firebase Functions → Cloud Run → Tebra API

- React frontend calls Firebase Functions
- Firebase Functions proxy to PHP Cloud Run service
- PHP service handles SOAP communication with Tebra
- Response data flows back through the chain

**Why This Architecture**:

- Tebra SOAP API works reliably only with PHP
- Firebase Functions provide authentication and business logic
- Cloud Run offers scalable PHP hosting
- Clear separation of concerns for maintainability

### 3. Redis Event Bus Pattern

**Pattern**: Multi-Service Coordination

- AI agents publish events to Redis
- CLI tests subscribe to coordination messages
- Dashboard receives real-time updates via Redis
- Pub/Sub messaging for loose coupling

**Use Cases**:

- Test coordination across multiple services
- Real-time dashboard updates
- AI agent collaboration workflows
- System health monitoring

## Security & Compliance Architecture

### 1. HIPAA Compliance Framework

**Data Encryption**:

- **At Rest**: AES-256 encryption for all patient data
- **In Transit**: TLS 1.3 for all API communications
- **Client Storage**: CryptoJS for browser-based encryption

**Access Controls**:

- Role-based access control (RBAC) through Auth0
- Multi-factor authentication (MFA) enforcement
- Session management with automatic timeout
- Audit logging for all PHI access

**Key Management**:

- Google Secret Manager for credential storage
- Automated key rotation (90-day cycle)
- Separate encryption keys per environment
- Hardware security module (HSM) backing

### 2. Security Monitoring

**Audit Logging**:

- All PHI access logged with user attribution
- API call tracking with rate limiting
- Failed authentication attempt monitoring
- Security incident alerting via Gmail

**Threat Detection**:

- Anomaly detection in API usage patterns
- Automated security report generation
- Real-time alerting for suspicious activities
- Correlation ID tracking across services

### 3. Data Privacy Controls

**Patient Data Handling**:

- Minimal data collection principle
- Automated data purging (daily cleanup)
- Consent management integration
- Data anonymization for testing

**Secure Communication**:

- Certificate pinning for external APIs
- Request signing for integrity verification
- Rate limiting to prevent abuse
- IP whitelisting for administrative access

## Deployment Architecture

### 1. Environment Strategy

**Development**:

- Local Firebase emulators for testing
- Environment-specific configuration
- Hot reload for rapid development
- Comprehensive logging for debugging

**Staging**:

- Pre-production environment mirroring production
- Integration testing with real APIs
- Performance testing and optimization
- Security scanning and validation

**Production**:

- Multi-region deployment for availability
- Auto-scaling based on demand
- Monitoring and alerting
- Disaster recovery procedures

### 2. CI/CD Pipeline

**Build Process**:

- TypeScript compilation and type checking
- Jest unit and integration testing
- ESLint code quality checks
- Security vulnerability scanning

**Deployment Steps**:

- Secret verification and synchronization
- Firebase Functions deployment
- Cloud Run service updates
- Frontend build and hosting deployment

**Quality Gates**:

- All tests must pass
- Security scan approval
- Performance benchmarks met
- Code review approval

### 3. Monitoring & Observability

**Application Monitoring**:

- Firebase Performance Monitoring
- Google Cloud Monitoring integration
- Custom metrics for business logic
- Real-time alerting for failures

**Log Management**:

- Structured logging with correlation IDs
- Centralized log aggregation
- HIPAA-compliant log retention
- Automated log analysis and alerting

**Health Checks**:

- Endpoint health monitoring
- Database connectivity checks
- External API availability
- Service dependency validation

## Development Workflow

### 1. Local Development Setup

**Prerequisites**:

- Node.js 20+ with npm
- Python 3.13 with virtual environment
- Firebase CLI with authentication
- Docker for Cloud Run local testing

**Environment Configuration**:

```bash
# Install dependencies
npm install && cd functions && npm install

# Set up environment variables
cp .env.local.template .env.local

# Start Firebase emulators
firebase emulators:start

# Start Redis locally
docker-compose -f docker-compose.redis.yml up

# Run development server
npm run dev
```

### 2. Testing Strategy

**Unit Tests**:

- Jest for JavaScript/TypeScript components
- React Testing Library for component testing
- Python unittest for AI agent testing
- PHPUnit for Cloud Run service testing

**Integration Tests**:

- End-to-end API testing
- Database integration testing
- External API mock testing
- Multi-service coordination testing

**CLI Testing Framework**:

- Automated health checks
- Integration test orchestration
- Performance benchmarking
- Security validation

### 3. Code Quality Standards

**TypeScript Standards**:

- Strict type checking enabled
- ESLint with TypeScript rules
- Prettier for code formatting
- JSDoc for public API documentation

**Security Standards**:

- No secrets in source code
- Input validation on all endpoints
- SQL injection prevention
- XSS protection mechanisms

**Documentation Standards**:

- Comprehensive README files
- API documentation with examples
- Architecture decision records
- Troubleshooting guides

## Performance Characteristics

### 1. Scalability Metrics

**Frontend Performance**:

- Initial load time: < 2 seconds
- Time to interactive: < 3 seconds
- Bundle size: < 500KB (gzipped)
- Lighthouse score: > 90

**Backend Performance**:

- API response time: < 500ms (P95)
- Cold start time: < 2 seconds
- Concurrent users: 1000+
- Database queries: < 100ms average

**External API Performance**:

- Tebra API calls: < 2 seconds
- Rate limiting: 100 requests/15 minutes
- Success rate: > 99%
- Error recovery: < 30 seconds

### 2. Resource Utilization

**Memory Usage**:

- Frontend: < 100MB heap
- Firebase Functions: < 256MB
- Cloud Run: < 512MB
- Redis: < 100MB cache

**CPU Usage**:

- Average: < 20% utilization
- Peak: < 80% utilization
- Scaling threshold: 70%
- Auto-scaling range: 1-10 instances

### 3. Availability & Reliability

**Service Level Objectives**:

- Uptime: 99.9% availability
- Recovery time: < 5 minutes
- Data durability: 99.999999999%
- Backup frequency: Every 24 hours

**Disaster Recovery**:

- Regional failover capability
- Database backup and restore
- Configuration backup
- Service health monitoring

## Future Architecture Considerations

### 1. Planned Enhancements

**Microservices Evolution**:

- Service mesh implementation
- API gateway integration
- Event-driven architecture
- Distributed tracing

**AI/ML Integration**:

- Enhanced AI agent capabilities
- Machine learning for patient insights
- Predictive analytics for scheduling
- Natural language processing

**Mobile Support**:

- React Native mobile app
- Offline synchronization
- Push notifications
- Mobile-optimized UI

### 2. Scalability Roadmap

**Horizontal Scaling**:

- Multi-region deployment
- Load balancing optimization
- Database sharding strategy
- Cache layer expansion

**Performance Optimization**:

- CDN implementation
- Image optimization
- Code splitting enhancement
- Database query optimization

**Security Enhancements**:

- Zero-trust architecture
- Advanced threat detection
- Automated security testing
- Compliance automation

## Conclusion

The Workflow-Bolt system represents a sophisticated, production-ready healthcare workflow management platform with strong emphasis on security, compliance, and maintainability. The architecture provides a solid foundation for current operations while supporting future growth and enhancement needs.

**Key Strengths**:

- HIPAA-compliant by design
- Scalable microservices architecture
- Comprehensive testing framework
- Strong security controls
- Extensive monitoring and observability

**Areas for Continued Development**:

- Enhanced AI/ML capabilities
- Mobile platform support
- Advanced analytics and reporting
- Multi-tenant architecture
- International compliance support

This architecture documentation serves as the master reference for system design decisions, implementation guidelines, and operational procedures. It should be updated regularly to reflect system evolution and architectural changes.

---

**Document Control**:

- **Created**: 2025-07-03
- **Next Review**: 2025-10-03
- **Approval**: System Architecture Team
- **Distribution**: Development Team, DevOps, Security Team
