# Wait Time Calculations & Persistence Issues - Revised Action Plan

## Issues Identified Through Investigation

### 1. Wait Time Update Problems
- **Root Cause**: Wait times depend on `getCurrentTime()` from TimeContext, but UI isn't re-rendering when time changes
- **Symptoms**: Wait times appear frozen or don't update in real-time
- **Key Areas**: TimeContext integration, tick counter mechanism, component re-rendering

### 2. Firebase Persistence Failures
- **Root Cause**: Multiple potential issues in persistence pipeline
- **Symptoms**: Patient data doesn't persist between sessions
- **Key Areas**: Authentication, service selection, auto-save timing, data flags

### 3. Test Infrastructure Problems
- **Root Cause**: Jest mock hoisting and service mocking issues
- **Symptoms**: Tests fail to run properly
- **Key Areas**: Mock setup, test isolation, service simulation

## Revised Implementation Plan

### Phase 1: Immediate Diagnostics (HIGH PRIORITY)

#### 1.1 Create Firebase Persistence Diagnostic Component
```typescript
// src/components/DiagnosticPanel.tsx
// Real-time display of:
// - Firebase auth status
// - isFirebaseConfigured value
// - hasRealData flag
// - Last save/load attempts
// - Current storage service in use
```

#### 1.2 Create Wait Time Diagnostic Component  
```typescript
// src/components/WaitTimeDiagnostic.tsx
// Real-time display of:
// - getCurrentTime() output
// - tickCounter value
// - Individual patient wait time calculations
// - Time progression tracking
```

#### 1.3 Fix Test Infrastructure
- Resolve Jest mock hoisting issues
- Create proper Firebase service mocks
- Establish working test baseline

### Phase 2: Wait Time Fixes (MEDIUM PRIORITY)

#### 2.1 TimeContext Integration Issues
**Investigation Points**:
- Verify `getCurrentTime()` is being called correctly
- Check if `tickCounter` increments properly
- Ensure UI components subscribe to context changes

**Potential Fixes**:
- Add proper useEffect dependencies for time updates
- Implement React.memo with proper comparison functions
- Add explicit re-render triggers for wait time components

#### 2.2 Real-time Update Mechanism
**Investigation Points**:
- Check if setInterval in PatientContext is working
- Verify tick counter triggers component updates
- Ensure wait time calculations refresh on time changes

**Potential Fixes**:
```typescript
// In components displaying wait times
const { tickCounter, getCurrentTime, getWaitTime } = usePatientContext();

// Force re-calculation on tick or time change
const waitTime = useMemo(() => {
  return getWaitTime(patient);
}, [patient, tickCounter, getCurrentTime]);
```

### Phase 3: Persistence Fixes (HIGH PRIORITY)

#### 3.1 Authentication Pipeline
**Diagnostic Steps**:
1. Check `useFirebaseAuth().ensureFirebaseAuth()` status
2. Verify Firebase token validity
3. Test manual authentication trigger

**Implementation**:
```typescript
// Add authentication status to diagnostic panel
const { ensureFirebaseAuth } = useFirebaseAuth();
const [authStatus, setAuthStatus] = useState('checking');

useEffect(() => {
  ensureFirebaseAuth().then(success => {
    setAuthStatus(success ? 'authenticated' : 'failed');
  });
}, []);
```

#### 3.2 Service Selection Logic
**Diagnostic Steps**:
1. Verify `isFirebaseConfigured` returns correct value
2. Check which storage service is actually being used
3. Validate service method calls

**Implementation**:
```typescript
// In PatientContext, add logging
console.log('Firebase configured:', isFirebaseConfigured);
console.log('Using storage service:', storageType);
console.log('Service methods:', Object.keys(storageService));
```

#### 3.3 Auto-save Mechanism
**Diagnostic Steps**:
1. Check `hasRealData` flag updates
2. Verify auto-save debounce timing
3. Test manual save operations

**Implementation**:
```typescript
// Add save attempt logging
useEffect(() => {
  if (!persistenceEnabled || isLoading || !hasRealData) {
    console.log('Auto-save skipped:', { persistenceEnabled, isLoading, hasRealData });
    return;
  }
  
  console.log('Auto-save triggered for:', patients.length, 'patients');
  // ... existing save logic
}, [patients, persistenceEnabled, isLoading, hasRealData]);
```

### Phase 4: Testing Infrastructure (MEDIUM PRIORITY)

#### 4.1 Fix Jest Mock Setup
```typescript
// Proper mock structure for services
const mockDailySessionService = {
  loadTodaysSession: jest.fn(),
  saveTodaysSession: jest.fn(),
  getSessionStats: jest.fn(),
};

jest.doMock('../../services/firebase/dailySessionService', () => ({
  dailySessionService: mockDailySessionService,
}));
```

#### 4.2 Comprehensive Test Scenarios
- Firebase vs localStorage selection
- Authentication failure handling
- Auto-save timing and triggers
- Wait time progression simulation
- Data consistency across save/load cycles

### Phase 5: Production Hardening (LOW PRIORITY)

#### 5.1 Error Recovery Mechanisms
- Automatic retry for failed Firebase operations
- Graceful fallback from Firebase to localStorage
- User notification for persistence issues

#### 5.2 Performance Optimizations
- Debounced wait time calculations
- Memoized expensive operations
- Optimized re-render patterns

## Implementation Priority Order

### Week 1: Critical Fixes
1. **Create diagnostic components** (1-2 hours)
2. **Investigate Firebase auth status** (2-3 hours)
3. **Fix service selection logic** (1-2 hours)
4. **Resolve auto-save issues** (2-4 hours)

### Week 2: Wait Time Issues
1. **Fix TimeContext integration** (2-3 hours)
2. **Implement proper re-render triggers** (2-3 hours)
3. **Add wait time update tests** (2-3 hours)

### Week 3: Test Infrastructure
1. **Fix Jest mock issues** (2-3 hours)
2. **Create comprehensive test suite** (4-6 hours)
3. **Add integration tests** (3-4 hours)

## Success Criteria

### Persistence Success:
- [ ] Patient data persists between browser sessions
- [ ] Firebase authentication works consistently  
- [ ] Auto-save triggers within 2 seconds of changes
- [ ] Manual save operations complete successfully
- [ ] Error states are handled gracefully

### Wait Time Success:
- [ ] Wait times update in real-time (every second in simulation, every 5 minutes in real-time)
- [ ] Wait times are calculated accurately
- [ ] UI reflects current wait times without page refresh
- [ ] Edge cases (invalid times, future times) are handled

### Testing Success:
- [ ] All tests pass consistently
- [ ] Persistence failures are caught by tests
- [ ] Wait time edge cases are covered
- [ ] Integration tests validate real-world scenarios

## Debugging Commands

### Immediate Diagnostic Commands:
```bash
# Check Firebase configuration
npm run build && grep -r "isFirebaseConfigured" dist/

# Test authentication
curl -X POST [firebase-functions-url]/ensureAuth

# Check localStorage contents
# (In browser console): localStorage.getItem('daily_session_2024-01-15')
```

### Development Testing:
```bash
# Run specific test groups
npm test -- --testNamePattern="persistence"
npm test -- --testNamePattern="wait.*time"

# Run with detailed logging
NODE_ENV=test npm test -- --verbose
```

This revised plan addresses the specific issues we discovered and provides a clear path forward for resolving both the wait time and persistence problems. 