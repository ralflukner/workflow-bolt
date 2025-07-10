# Development Workflow Guide

**Version**: 1.0  
**Last Updated**: 2025-07-03  
**Project**: workflow-bolt  

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Testing Strategy](#testing-strategy)
5. [Deployment Procedures](#deployment-procedures)
6. [Code Organization](#code-organization)
7. [Quality Assurance](#quality-assurance)
8. [Troubleshooting](#troubleshooting)
9. [Integration Patterns](#integration-patterns)
10. [Security & Compliance](#security--compliance)

---

## Development Environment Setup

### Prerequisites

**Required Software:**

- Node.js 20.x (matches Firebase Functions runtime)
- npm 10.x or later
- Firebase CLI (`npm install -g firebase-tools`)
- Python 3.9+ (for Redis coordination system)
- Git with proper SSH key setup

**Required Accounts:**

- Google Cloud Platform account with billing enabled
- Firebase project access
- Auth0 account for authentication
- Redis Cloud account (for production)

### Initial Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd workflow-bolt

# 2. Install root dependencies
npm install

# 3. Install Firebase Functions dependencies
cd functions
npm install
cd ..

# 4. Set up Python environment for Redis agents
cd ai-agents/luknerlumina
pip install -r requirements.txt  # If requirements.txt exists
pip install redis google-cloud-secret-manager
cd ../..

# 5. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 6. Authenticate with Firebase
firebase login
firebase use <your-project-id>

# 7. Set up Git hooks (if available)
chmod +x scripts/install-git-hooks.sh
./scripts/install-git-hooks.sh
```

### Environment Configuration

#### Frontend Environment Variables (.env)

```bash
# Auth0 Configuration
VITE_AUTH0_DOMAIN=dev-uex7qzqmd8c4qnde.us.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_REDIRECT_URI=http://localhost:5173
VITE_AUTH0_AUDIENCE=https://api.patientflow.com
VITE_AUTH0_SCOPE="openid profile email offline_access"

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Development Flags
VITE_ENABLE_DEBUG_LOGGING=true
VITE_ENABLE_MOCK_DATA=false
SKIP_GSM=1  # Skip Google Secret Manager in development
```

#### Backend Configuration (Google Secret Manager)

```bash
# Set up required secrets
./scripts/setup-required-secrets.sh

# Key secrets to configure:
# - AUTH0_DOMAIN
# - AUTH0_AUDIENCE
# - TEBRA_USERNAME
# - TEBRA_PASSWORD
# - TEBRA_WSDL_URL
# - PATIENT_ENCRYPTION_KEY
```

### Development Server Setup

```bash
# Start development server
npm run dev

# Start Firebase emulators (in separate terminal)
firebase emulators:start

# Start Redis development server (if needed)
./scripts/start-redis-local.sh

# Run tests in watch mode (in another terminal)
npm run test:watch
```

---

## Project Structure

### Architecture Overview

```
workflow-bolt/
├── src/                           # React frontend
│   ├── components/                # UI components
│   ├── services/                  # API services
│   ├── contexts/                  # React contexts
│   ├── hooks/                     # Custom hooks
│   ├── cli/                       # CLI tools
│   └── utils/                     # Utility functions
├── functions/                     # Firebase Functions
│   ├── src/                       # Functions source code
│   │   ├── services/              # Backend services
│   │   ├── tebra-sync/           # Tebra integration
│   │   └── utils/                # Utility functions
│   └── index.js                   # Functions entry point
├── ai-agents/                     # Multi-agent coordination
│   └── luknerlumina/             # Redis-based agents
│       ├── secure_redis_client.py # Redis client
│       └── tests/                # Agent tests
└── scripts/                      # Development scripts
```

### Key Directories

#### Frontend (`src/`)

```
src/
├── components/
│   ├── Dashboard.tsx                    # Main dashboard
│   ├── TebraDebugDashboardContainer.tsx # Tebra debug interface
│   ├── ImportSchedule.tsx               # Schedule import
│   ├── SecurityNotice.tsx               # HIPAA compliance UI
│   └── __tests__/                       # Component tests
├── services/
│   ├── tebraFirebaseApi.ts              # Tebra API service
│   ├── authBridge.ts                    # Auth0 bridge
│   ├── secureStorage.ts                 # HIPAA-compliant storage
│   └── encryption/                      # Encryption services
├── cli/
│   ├── commands/                        # CLI commands
│   ├── lib/                             # CLI utilities
│   └── __tests__/                       # CLI tests
└── hooks/
    ├── useRedisEventBus.ts              # Redis integration
    └── useTebraDebugDashboard.ts        # Debug dashboard
```

#### Backend (`functions/src/`)

```
functions/src/
├── services/
│   ├── emailService.js                  # Email integration
│   ├── firestoreDailySession.ts         # Session management
│   └── logger.ts                        # Logging service
├── tebra-sync/
│   ├── syncSchedule.ts                  # Schedule sync
│   ├── mappers.ts                       # Data mapping
│   └── __tests__/                       # Sync tests
├── config/
│   └── secrets.ts                       # Secret management
└── utils/
    └── credential-verification.js        # Credential validation
```

#### Multi-Agent System (`ai-agents/`)

```
ai-agents/luknerlumina/
├── secure_redis_client.py               # Redis client with encryption
├── simple_file_manager.py               # File management
├── tests/
│   ├── test_secure_redis_client.py      # Redis client tests
│   └── test_config.py                   # Test configuration
└── run_tests.py                         # Test runner
```

---

## Development Workflow

### Git Branching Strategy

#### Branch Types

```
main                 # Production-ready code
├── develop          # Integration branch
├── feature/         # New features
├── bugfix/          # Bug fixes
├── hotfix/          # Critical production fixes
├── refactor/        # Code refactoring
└── chore/           # Maintenance tasks
```

#### Branch Naming Convention

```bash
# Feature branches
feature/tebra-appointment-sync
feature/redis-event-bus
feature/hipaa-compliance-ui

# Bug fix branches
bugfix/auth0-token-refresh
bugfix/firebase-cors-issue

# Refactor branches
refactor/tebra-debug-dashboard
refactor/authentication-flow

# Hotfix branches
hotfix/security-patch-v1.2.3
```

### Development Process

#### 1. Starting New Work

```bash
# Create new branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/new-feature-name

# Start development
npm run dev
```

#### 2. Daily Development Cycle

```bash
# Run tests before starting work
npm run test:unit

# Make changes, test continuously
npm run test:watch

# Run integration tests periodically
npm run test:integration

# Check code quality
npm run lint
npm run lint:md
```

#### 3. Pre-commit Checklist

```bash
# Run full test suite
npm run test:all

# Check TypeScript compilation
npm run build
npm run build:cli

# Verify Firebase Functions
npm run deploy:check

# Check for secrets in code
./scripts/verify-no-secrets.sh

# Run security checks
npm run check:creds
```

#### 4. Code Review Process

1. **Create Pull Request** with descriptive title and body
2. **Assign Reviewers** (at least 2 for security-sensitive changes)
3. **Check CI/CD Pipeline** ensures all tests pass
4. **Address Feedback** from reviewers
5. **Merge** after approval (squash and merge for features)

### Commit Message Format

```
type(scope): description

body (optional)

footer (optional)

Examples:
feat(auth): add Auth0 token refresh mechanism
fix(tebra): resolve appointment sync timeout issue
refactor(storage): improve HIPAA-compliant encryption
docs(readme): update deployment instructions
test(redis): add comprehensive error handling tests
```

---

## Testing Strategy

### Test Architecture

The project uses a comprehensive testing strategy with multiple test types:

```
Testing Pyramid:
├── Unit Tests (Fast, Isolated)
├── Integration Tests (Component Integration)
├── CLI Tests (Command Line Interface)
├── Real API Tests (External Services)
└── E2E Tests (Full User Workflows) - Planned
```

### Test Configuration

#### Jest Configuration (`jest.config.cjs`)

```javascript
// Multiple test projects for different environments
projects: [
  {
    displayName: 'unit',
    testEnvironment: 'jsdom',
    testMatch: ['<rootDir>/src/**/*.test.(ts|tsx)'],
    testPathIgnorePatterns: ['.integration.test.', 'real-api']
  },
  {
    displayName: 'integration',
    testEnvironment: 'jsdom',
    testMatch: ['<rootDir>/src/**/*.integration.test.(ts|tsx)']
  },
  {
    displayName: 'cli',
    testEnvironment: 'node',
    testMatch: ['<rootDir>/src/cli/**/*.test.(ts|tsx)']
  },
  {
    displayName: 'real-api',
    testEnvironment: 'jsdom',
    testMatch: ['<rootDir>/src/**/**/real-api/**/*.test.(ts|tsx)']
  }
]
```

### Test Commands

```bash
# Run all unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run CLI tests
npm run test:cli

# Run real API tests (requires credentials)
npm run test:real-api

# Run all tests
npm run test:all

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:tebra-integration
npm run test:tebra-real
npm run test:tebra-all

# Run tests in watch mode
npm run test:watch
```

### Test Data Management

#### Mock Data Strategy

```typescript
// Test data isolated in dedicated files
src/
├── __tests__/
│   ├── mockPatientData.ts        # Patient test data
│   └── mockPatientData.tsx       # React component mocks
├── test/
│   ├── mockFactories.ts          # Data factories
│   └── contextMocks.ts           # Context mocks
└── __mocks__/
    ├── secretManagerBrowserStub.ts # Secret Manager mock
    └── gcp-metadata.ts           # GCP metadata mock
```

#### Environment-Specific Test Data

```bash
# Development testing
export TEST_ENV=development
export TEST_REDIS_URL="redis://localhost:6379/15"

# Integration testing
export RUN_INTEGRATION_TESTS=true
export TEST_TIMEOUT=30000

# Real API testing (requires valid credentials)
export RUN_REAL_API_TESTS=true
```

### Testing Best Practices

#### Unit Tests

```typescript
// Example unit test structure
describe('TebraDebugDashboard', () => {
  beforeEach(() => {
    // Clean setup for each test
    jest.clearAllMocks();
  });

  it('should render connection status correctly', () => {
    // Arrange
    const mockProps = { connectionStatus: 'connected' };
    
    // Act
    render(<TebraDebugDashboard {...mockProps} />);
    
    // Assert
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });
});
```

#### Integration Tests

```typescript
// Example integration test
describe('Tebra Integration', () => {
  it('should complete full appointment sync workflow', async () => {
    // Test full workflow from UI to backend
    const result = await tebraFirebaseApi.syncSchedule({
      date: '2025-07-03'
    });
    
    expect(result.success).toBe(true);
    expect(result.data.appointments).toBeDefined();
  });
});
```

#### Redis Agent Tests

```python
# Python test for Redis agents
class TestSecureRedisClient:
    def test_store_patient_data_with_encryption(self):
        """Test secure storage of patient data"""
        # Arrange
        client = SecureRedisClient()
        patient_data = TEST_PATIENT_DATA
        
        # Act
        result = client.store_patient_data("test123", patient_data)
        
        # Assert
        assert result is True
        # Verify encryption was applied
        stored_data = client.get_raw_data("test123")
        assert "Test Patient" not in stored_data  # Should be encrypted
```

---

## Deployment Procedures

### Environment Overview

```
Development → Staging → Production
     ↓           ↓         ↓
  Emulators → Firebase → Firebase
  Local DB  → Test DB  → Prod DB
```

### Pre-Deployment Checks

#### Automated Pre-Deploy Script

```bash
# Run comprehensive pre-deployment check
npm run deploy:check

# This script runs:
# 1. TypeScript compilation
# 2. ESLint checks
# 3. Test suite execution
# 4. Secret scanning
# 5. Credential verification
# 6. Build verification
```

#### Manual Pre-Deploy Checklist

```bash
# 1. Verify all tests pass
npm run test:all

# 2. Check Firebase Functions build
cd functions && npm run build

# 3. Verify secret manager configuration
npm run check:creds

# 4. Check for environment variable conflicts
./scripts/check-env-conflicts.sh

# 5. Verify Secret Manager consistency
./scripts/check-env-gsm-consistency-v2.js

# 6. Run security scan
./scripts/verify-no-secrets.sh
```

### Firebase Functions Deployment

#### Safe Deployment Process

```bash
# 1. Deploy with safety checks
npm run deploy:safe

# This runs:
# - Pre-deployment checks
# - Firebase Functions deployment
# - Post-deployment verification

# 2. Deploy specific functions
firebase deploy --only functions:exchangeAuth0Token
firebase deploy --only functions:tebraProxy
firebase deploy --only functions:syncSchedule

# 3. Deploy with specific configurations
cd functions
firebase deploy --only functions --project staging
firebase deploy --only functions --project production
```

#### Deployment Verification

```bash
# Verify deployment
npm run deploy:verify

# Test deployed functions
./scripts/test-firebase-tebra-endpoint.sh

# Check function logs
firebase functions:log
```

### React Application Deployment

#### Build Process

```bash
# Development build (with GSM skip)
npm run dev:build

# Production build
npm run build

# Build CLI tools
npm run build:cli
```

#### Deployment to Firebase Hosting

```bash
# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy to specific environment
firebase deploy --only hosting --project staging
firebase deploy --only hosting --project production
```

### Rollback Procedures

#### Firebase Functions Rollback

```bash
# List recent deployments
firebase functions:log --limit 50

# Rollback to previous version
firebase functions:delete functionName
git checkout HEAD~1 functions/
firebase deploy --only functions:functionName
```

#### Emergency Rollback

```bash
# Complete rollback script
./scripts/emergency-rollback.sh

# Steps performed:
# 1. Revert to last known good commit
# 2. Deploy previous version
# 3. Verify rollback success
# 4. Notify team
```

### Environment-Specific Deployment

#### Development

```bash
# Use emulators for development
firebase emulators:start

# Deploy to development project
firebase use development
firebase deploy
```

#### Staging

```bash
# Deploy to staging
firebase use staging
firebase deploy

# Run staging tests
npm run test:staging
```

#### Production

```bash
# Deploy to production (requires additional approval)
firebase use production
firebase deploy --confirm

# Monitor deployment
firebase functions:log --project production
```

---

## Code Organization

### TypeScript Configuration

#### Main TypeScript Config (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"],
  "exclude": ["src/**/__tests__/**/*", "src/**/*.test.*"]
}
```

#### CLI TypeScript Config (`tsconfig.cli.json`)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "noEmit": false,
    "module": "ES2020",
    "target": "ES2020"
  },
  "include": ["src/cli/**/*", "src/types/cli.ts"]
}
```

### Component Architecture

#### Component Structure

```typescript
// Standard component structure
interface ComponentProps {
  // Props interface
}

interface ComponentState {
  // State interface
}

export const Component: React.FC<ComponentProps> = ({ 
  prop1, 
  prop2 
}) => {
  // Hooks
  const [state, setState] = useState<ComponentState>();
  
  // Effects
  useEffect(() => {
    // Side effects
  }, []);
  
  // Handlers
  const handleEvent = useCallback(() => {
    // Event handling
  }, []);
  
  // Render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};
```

#### Context Pattern

```typescript
// Context definition
interface ContextValue {
  // Context value type
}

// Context provider
export const ContextProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  // Context implementation
  return (
    <Context.Provider value={contextValue}>
      {children}
    </Context.Provider>
  );
};

// Custom hook
export const useCustomContext = () => {
  const context = useContext(Context);
  if (!context) {
    throw new Error('useCustomContext must be used within ContextProvider');
  }
  return context;
};
```

### API Design Patterns

#### Service Layer Pattern

```typescript
// Abstract service interface
interface ApiService {
  get<T>(endpoint: string): Promise<ApiResponse<T>>;
  post<T>(endpoint: string, data: any): Promise<ApiResponse<T>>;
}

// Concrete implementation
class TebraApiService implements ApiService {
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    // Implementation
  }
}
```

#### Firebase Functions Pattern

```typescript
// Callable function pattern
export const functionName = functions.https.onCall(async (data, context) => {
  // Authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    // Business logic
    const result = await processData(data);
    return { success: true, data: result };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

### File Naming Conventions

```
Components:           PascalCase.tsx
Services:             camelCase.ts
Utilities:            camelCase.ts
Types:                camelCase.ts
Test files:           *.test.ts, *.integration.test.ts
Mock files:           *.mock.ts, __mocks__/
Constants:            UPPER_CASE.ts
```

---

## Quality Assurance

### Code Quality Standards

#### ESLint Configuration

```javascript
// eslint.config.js
export default [
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': typescript,
      'import': importPlugin,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      'import/no-unresolved': 'error',
    },
  },
];
```

#### Code Quality Commands

```bash
# Linting
npm run lint                    # ESLint for TypeScript
npm run lint:md                 # Markdown linting

# Code formatting (if Prettier is configured)
npm run format

# Type checking
npx tsc --noEmit               # TypeScript compilation check
```

### Security Review Procedures

#### Pre-commit Security Checks

```bash
# Run security scan
./scripts/verify-no-secrets.sh

# Check for sensitive data patterns
./scripts/check-staged-for-secrets.sh

# Verify credential configuration
npm run check:creds
```

#### Security Audit Process

1. **Code Review**: Security-focused code review for sensitive changes
2. **Dependency Audit**: Regular npm audit for vulnerability scanning
3. **Secret Scanning**: Automated scanning for leaked credentials
4. **Access Control**: Review of authentication and authorization
5. **Data Protection**: HIPAA compliance verification

### HIPAA Compliance Verification

#### Compliance Checklist

```bash
# Run HIPAA compliance tests
npm run test -- --testNamePattern="hipaa"

# Verify encryption implementation
npm run test -- --testNamePattern="encryption"

# Check audit logging
npm run test -- --testNamePattern="audit"

# Security storage validation
npm run test -- --testNamePattern="secureStorage"
```

#### Compliance Features

- **Data Encryption**: AES-256-GCM encryption for sensitive data
- **Access Control**: Role-based access with audit logging
- **Audit Trail**: Comprehensive logging of all PHI access
- **Data Retention**: Automatic expiration and secure deletion
- **Security Notifications**: User education and compliance alerts

### Performance Monitoring

#### Performance Metrics

```typescript
// Performance monitoring hooks
export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    apiResponseTime: 0,
    renderTime: 0
  });

  // Implementation
};
```

#### Performance Benchmarks

| Operation | Target | Acceptable | Critical |
|-----------|---------|------------|----------|
| Page Load | < 2s | < 3s | > 5s |
| API Response | < 1s | < 2s | > 3s |
| Database Query | < 500ms | < 1s | > 2s |
| File Upload | < 5s | < 10s | > 15s |
| Export/Import | < 10s | < 20s | > 30s |

---

## Troubleshooting

### Common Development Issues

#### 1. Authentication Issues

**Problem**: Auth0 token exchange failing with 401 errors

**Symptoms**:

```
JWT verification failed: jwt audience invalid
```

**Solution**:

```bash
# Check environment configuration
cat .env | grep AUTH0

# Verify Secret Manager values
gcloud secrets versions access latest --secret="AUTH0_DOMAIN"
gcloud secrets versions access latest --secret="AUTH0_AUDIENCE"

# Fix mismatches
echo -n "dev-uex7qzqmd8c4qnde.us.auth0.com" | gcloud secrets versions add AUTH0_DOMAIN --data-file=-
echo -n "https://api.patientflow.com" | gcloud secrets versions add AUTH0_AUDIENCE --data-file=-

# Redeploy functions
firebase deploy --only functions:exchangeAuth0Token
```

#### 2. Firebase Functions CORS Issues

**Problem**: CORS 403 errors when calling Firebase Functions

**Symptoms**:

```
Access to fetch at 'https://...' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solution**:

```typescript
// Use Firebase SDK callable functions, not HTTP fetch
import { httpsCallable } from 'firebase/functions';

// ✅ Correct approach
const tebraProxy = httpsCallable(functions, 'tebraProxy');
const result = await tebraProxy(data);

// ❌ Wrong approach - causes CORS issues
fetch('https://us-central1-project.cloudfunctions.net/tebraProxy', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

#### 3. Redis Connection Issues

**Problem**: Redis client connection failures

**Symptoms**:

```
redis.exceptions.ConnectionError: Error connecting to Redis
```

**Solution**:

```bash
# Check Redis configuration
./scripts/check-redis-config.sh

# Start local Redis for development
./scripts/start-redis-local.sh

# Verify Redis client configuration
python ai-agents/luknerlumina/run_tests.py --unit --verbose
```

#### 4. Build/Deployment Issues

**Problem**: TypeScript compilation errors during build

**Symptoms**:

```
error TS2307: Cannot find module '@/components/Dashboard'
```

**Solution**:

```bash
# Check TypeScript path mapping
cat tsconfig.json | grep -A 5 "paths"

# Verify file exists
ls -la src/components/Dashboard.tsx

# Clean build
rm -rf dist/ node_modules/
npm install
npm run build
```

### Debug Tools and Techniques

#### Browser Console Debugging

```javascript
// Available in development mode
window.tebraDebug = {
  testConnection: () => tebraFirebaseApi.tebraTestConnection(),
  healthCheck: () => tebraFirebaseApi.tebraHealthCheck(),
  getToken: () => auth0Client.getTokenSilently()
};

// Usage
await tebraDebug.testConnection();
```

#### Firebase Functions Debugging

```bash
# View function logs
firebase functions:log

# Stream logs in real-time
firebase functions:log --follow

# Filter logs by function
firebase functions:log --only functions:tebraProxy

# Debug specific function
firebase functions:shell
```

#### Redis Debugging

```bash
# Test Redis connection
redis-cli ping

# Monitor Redis operations
redis-cli monitor

# Check Redis memory usage
redis-cli info memory

# Test Python Redis client
python ai-agents/luknerlumina/run_tests.py --debug
```

### Log Analysis

#### Application Logs

```bash
# View recent logs
firebase functions:log --limit 100

# Search logs for specific patterns
firebase functions:log | grep "ERROR"
firebase functions:log | grep "JWT verification"

# Export logs for analysis
firebase functions:log --format json > logs.json
```

#### Performance Profiling

```bash
# Profile build performance
npm run build -- --profile

# Analyze bundle size
npm run build -- --analyze

# Profile test performance
npm run test -- --profile
```

---

## Integration Patterns

### React Frontend + Firebase Functions

#### Authentication Integration

```typescript
// Auth0 → Firebase Functions flow
export class AuthBridge {
  private auth0Client: Auth0Client;
  
  async exchangeAuth0Token(): Promise<string> {
    // Get Auth0 token
    const auth0Token = await this.auth0Client.getTokenSilently();
    
    // Exchange for Firebase token
    const exchangeFunction = httpsCallable(functions, 'exchangeAuth0Token');
    const result = await exchangeFunction({ auth0Token });
    
    return result.data.firebaseToken;
  }
}
```

#### Data Synchronization

```typescript
// Real-time data sync pattern
export const useRealtimeSync = () => {
  const [data, setData] = useState();
  
  useEffect(() => {
    // Set up real-time listener
    const unsubscribe = onSnapshot(
      doc(db, 'collection', 'document'),
      (doc) => setData(doc.data())
    );
    
    return unsubscribe;
  }, []);
  
  return data;
};
```

### Firebase Functions + External APIs

#### Tebra API Integration

```typescript
// Unified proxy pattern
export const tebraProxy = functions.https.onCall(async (data, context) => {
  // Authenticate user
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }
  
  // Route to appropriate handler
  switch (data.action) {
    case 'getPatients':
      return await getPatients(data.params);
    case 'getAppointments':
      return await getAppointments(data.params);
    default:
      throw new functions.https.HttpsError('invalid-argument', 'Unknown action');
  }
});
```

#### Error Handling Pattern

```typescript
// Consistent error handling
export const handleApiError = (error: unknown): never => {
  if (error instanceof Error) {
    console.error('API Error:', error.message);
    throw new functions.https.HttpsError('internal', error.message);
  } else {
    console.error('Unknown error:', error);
    throw new functions.https.HttpsError('internal', 'Unknown error occurred');
  }
};
```

### Multi-Agent Coordination

#### Redis Event Bus Pattern

```typescript
// Frontend Redis event subscription
export const useRedisEventBus = () => {
  const [events, setEvents] = useState<RedisEvent[]>([]);
  
  useEffect(() => {
    const eventBus = new RedisEventBus();
    
    eventBus.subscribe('patient-update', (event) => {
      setEvents(prev => [...prev, event]);
    });
    
    return () => eventBus.unsubscribe();
  }, []);
  
  return events;
};
```

#### Agent Communication

```python
# Python agent communication pattern
class SecureRedisClient:
    def publish_event(self, channel: str, event: dict):
        """Publish event to Redis channel"""
        encrypted_event = self.encrypt_sensitive_data(event)
        self.redis.publish(channel, json.dumps(encrypted_event))
    
    def subscribe_to_events(self, channels: List[str]):
        """Subscribe to Redis channels"""
        pubsub = self.redis.pubsub()
        pubsub.subscribe(channels)
        
        for message in pubsub.listen():
            if message['type'] == 'message':
                event = json.loads(message['data'])
                decrypted_event = self.decrypt_sensitive_data(event)
                self.handle_event(decrypted_event)
```

### CLI Integration

#### Command Structure

```typescript
// CLI command pattern
export class ImportCommand extends Command {
  static description = 'Import schedule data';
  
  static flags = {
    file: Flags.string({ description: 'Input file path' }),
    format: Flags.string({ options: ['tsv', 'json'], default: 'tsv' }),
    validate: Flags.boolean({ default: true })
  };
  
  async run(): Promise<void> {
    const { flags } = await this.parse(ImportCommand);
    
    try {
      const importer = new ScheduleImporter();
      const result = await importer.import(flags.file, flags.format);
      
      this.log(`Successfully imported ${result.count} records`);
    } catch (error) {
      this.error(error.message);
    }
  }
}
```

---

## Security & Compliance

### HIPAA Compliance Implementation

#### Data Protection

```typescript
// HIPAA-compliant data handling
export class SecureStorage {
  private encryptionKey: CryptoKey;
  
  async storePatientData(patientId: string, data: PatientData): Promise<void> {
    // Encrypt sensitive fields
    const encryptedData = await this.encryptSensitiveFields(data);
    
    // Store with expiration
    this.storage.set(patientId, {
      data: encryptedData,
      timestamp: Date.now(),
      expiresAt: Date.now() + (8 * 60 * 60 * 1000) // 8 hours
    });
    
    // Audit log
    this.auditLog.log('STORE', patientId, 'Patient data stored');
  }
  
  private async encryptSensitiveFields(data: PatientData): Promise<EncryptedData> {
    const sensitiveFields = ['name', 'phone', 'dob', 'ssn'];
    const encrypted = { ...data };
    
    for (const field of sensitiveFields) {
      if (encrypted[field]) {
        encrypted[field] = await this.encrypt(encrypted[field]);
      }
    }
    
    return encrypted;
  }
}
```

#### Audit Logging

```typescript
// HIPAA-compliant audit logging
export class AuditLogger {
  log(action: string, resource: string, details: string): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      resource: this.sanitizeResource(resource),
      details: this.sanitizeDetails(details),
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId()
    };
    
    // Store audit log (encrypted)
    this.storeAuditLog(logEntry);
  }
  
  private sanitizeResource(resource: string): string {
    // Remove PHI from resource identifiers
    return resource.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
                  .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE]');
  }
}
```

### Security Best Practices

#### Secret Management

```bash
# Store secrets in Google Secret Manager
echo -n "secret-value" | gcloud secrets versions add SECRET_NAME --data-file=-

# Access secrets in code
const secret = await getSecret('SECRET_NAME');

# Rotate secrets regularly
./scripts/rotate-secrets.sh
```

#### Authentication Security

```typescript
// Secure authentication implementation
export class AuthService {
  async authenticateUser(token: string): Promise<User> {
    // Validate JWT token
    const decoded = await this.verifyJWT(token);
    
    // Check token expiration
    if (decoded.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }
    
    // Validate audience
    if (decoded.aud !== this.expectedAudience) {
      throw new Error('Invalid audience');
    }
    
    return this.getUserFromToken(decoded);
  }
}
```

#### Data Encryption

```typescript
// Client-side encryption for sensitive data
export class DataEncryption {
  async encryptData(data: string, password: string): Promise<EncryptedData> {
    // Derive key from password
    const key = await this.deriveKey(password);
    
    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt data
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(data)
    );
    
    return {
      encrypted: new Uint8Array(encrypted),
      iv,
      salt: this.salt
    };
  }
}
```

### Compliance Monitoring

#### Regular Security Audits

```bash
# Weekly security checks
./scripts/security-audit-weekly.sh

# Monthly compliance review
./scripts/hipaa-compliance-check.sh

# Quarterly security assessment
./scripts/security-assessment-quarterly.sh
```

#### Incident Response

```bash
# Security incident response
./scripts/security-incident-response.sh

# Data breach notification
./scripts/data-breach-notification.sh

# Recovery procedures
./scripts/security-recovery.sh
```

---

## Conclusion

This development workflow guide provides comprehensive coverage of the workflow-bolt project's development practices, from initial setup through deployment and maintenance. The guide emphasizes security, HIPAA compliance, and robust testing practices while maintaining developer productivity.

Key takeaways:

1. **Security First**: All development practices prioritize security and HIPAA compliance
2. **Comprehensive Testing**: Multi-layered testing strategy ensures reliability
3. **Automated Quality**: Automated checks and balances prevent issues
4. **Clear Processes**: Well-defined workflows for all development activities
5. **Documentation**: Thorough documentation for maintainability

For questions or clarifications, refer to the project documentation or contact the development team.

---

**Last Updated**: 2025-07-03  
**Version**: 1.0  
**Next Review**: 2025-08-03
