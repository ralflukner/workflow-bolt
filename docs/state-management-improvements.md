# State Management Improvements Plan

## Overview

This document outlines the plan for improving state management across the application, focusing on reducing inappropriate useState usage and implementing better patterns for state management.

## Current Issues

### 1. Scattered State Management

- Multiple useState calls in components
- Related state split across different variables
- Complex state logic mixed with UI components

### 2. Inconsistent Patterns

- Mix of local and global state
- Inconsistent error handling
- Varying approaches to loading states

### 3. Performance Concerns

- Unnecessary re-renders
- Missing memoization
- Inefficient state updates

### 4. Wait Time Calculation Issues

- Inconsistent time zone handling
- Missing edge case handling
- Lack of proper validation
- Performance issues with frequent recalculations

## Improvement Plan

### Phase 1: State Consolidation and Custom Hooks

#### 1.1 Time Management

- [ ] Create `useTimeInput` hook
  - Consolidate time-related state
  - Handle time zone conversions
  - Manage AM/PM state
  - Target: TimeControl.tsx

#### 1.2 Patient Management

- [ ] Create `usePatientCard` hook
  - Manage patient card state
  - Handle status transitions
  - Manage check-in editing
  - Target: PatientCard.tsx

#### 1.3 Integration Management

- [ ] Create `useTebraIntegration` hook
  - Manage connection state
  - Handle sync operations
  - Manage loading states
  - Target: TebraIntegrationNew.tsx

#### 1.4 Wait Time Management

- [ ] Create `useWaitTime` hook
  - Centralize wait time calculation logic
  - Implement proper time zone handling
  - Add comprehensive validation
  - Handle all edge cases
  - Implement caching for performance
  - Target: PatientContext.tsx

### Phase 2: Context Improvements

#### 2.1 Time Context

- [ ] Split TimeContext into smaller contexts
  - [ ] TimeModeContext for simulation
  - [ ] TimeFormatContext for formatting
  - [ ] TimeUpdateContext for updates

#### 2.2 Patient Context

- [ ] Implement proper state normalization
- [ ] Add proper error boundaries
- [ ] Implement optimistic updates
- [ ] Integrate new wait time calculation system

#### 2.3 Integration Context

- [ ] Create dedicated context for Tebra integration
- [ ] Implement proper error handling
- [ ] Add retry mechanisms

### Phase 3: Performance Optimizations

#### 3.1 Memoization

- [ ] Implement useMemo for expensive calculations
- [ ] Add useCallback for event handlers
- [ ] Optimize dependency arrays
- [ ] Add wait time calculation caching

#### 3.2 State Updates

- [ ] Implement batched updates
- [ ] Add proper debouncing
- [ ] Optimize re-render triggers
- [ ] Implement efficient wait time updates

### Phase 4: Testing and Documentation

#### 4.1 Testing

- [ ] Add unit tests for custom hooks
- [ ] Add integration tests for contexts
- [ ] Add performance tests
- [ ] Add comprehensive wait time calculation tests

#### 4.2 Documentation

- [ ] Document state management patterns
- [ ] Add usage examples
- [ ] Create troubleshooting guide
- [ ] Document wait time calculation system

## Wait Time Calculation Improvements

### Current Issues

1. Inconsistent time zone handling
2. Missing validation for edge cases
3. Performance issues with frequent recalculations
4. Lack of proper error handling
5. No caching mechanism

### Planned Improvements

#### 1. Centralized Calculation

```typescript
interface WaitTimeState {
  currentWaitTime: number;
  totalTime: number;
  lastCalculated: Date;
  error: string | null;
}

const useWaitTime = (patient: Patient) => {
  const [state, setState] = useState<WaitTimeState>(() => ({
    currentWaitTime: 0,
    totalTime: 0,
    lastCalculated: new Date(),
    error: null
  }));

  const calculateWaitTime = useCallback(() => {
    try {
      if (!patient.checkInTime) {
        return { currentWaitTime: 0, totalTime: 0 };
      }

      const checkInTime = new Date(patient.checkInTime);
      const endTime = patient.withDoctorTime 
        ? new Date(patient.withDoctorTime)
        : getCurrentTime();

      // Validate dates
      if (isNaN(checkInTime.getTime()) || isNaN(endTime.getTime())) {
        throw new Error('Invalid date values');
      }

      // Handle time zone differences
      const waitTimeMs = endTime.valueOf() - checkInTime.valueOf();
      const currentWaitTime = Math.max(0, Math.floor(waitTimeMs / 60000));

      // Calculate total time if completed
      const totalTime = patient.completedTime
        ? Math.max(0, Math.floor(
            (new Date(patient.completedTime).valueOf() - checkInTime.valueOf()) / 60000
          ))
        : currentWaitTime;

      return { currentWaitTime, totalTime };
    } catch (error) {
      console.error('Wait time calculation error:', error);
      return { currentWaitTime: 0, totalTime: 0, error: error.message };
    }
  }, [patient, getCurrentTime]);

  // Cache calculations
  useEffect(() => {
    const { currentWaitTime, totalTime, error } = calculateWaitTime();
    setState({
      currentWaitTime,
      totalTime,
      lastCalculated: new Date(),
      error
    });
  }, [calculateWaitTime]);

  return state;
};
```

#### 2. Performance Optimizations

- Implement caching with configurable TTL
- Add debouncing for frequent updates
- Use memoization for expensive calculations
- Batch updates for multiple patients

#### 3. Error Handling

- Add comprehensive validation
- Implement proper error boundaries
- Add retry mechanisms
- Provide fallback values

#### 4. Testing Requirements

- Unit tests for all edge cases
- Integration tests for time zone handling
- Performance tests for caching
- Error handling tests

## Progress Tracking

### Completed Items

#### Documentation

- [x] Created state management improvement plan
- [x] Documented current issues
- [x] Created testing requirements
- [x] Documented wait time calculation issues

#### Analysis

- [x] Identified inappropriate useState usage
- [x] Documented edge cases
- [x] Created improvement recommendations
- [x] Analyzed wait time calculation problems

### In Progress

#### Time Management

- [ ] Implementing useTimeInput hook
- [ ] Refactoring TimeControl component
- [ ] Adding time zone support

#### Patient Management

- [ ] Creating usePatientCard hook
- [ ] Implementing status management
- [ ] Adding error handling

#### Wait Time Management

- [ ] Implementing useWaitTime hook
- [ ] Adding time zone support
- [ ] Implementing caching
- [ ] Adding validation

### Next Steps

#### Integration Management

- [ ] Create useTebraIntegration hook
- [ ] Implement proper error handling
- [ ] Add retry mechanisms

#### Context Improvements

- [ ] Split TimeContext
- [ ] Normalize PatientContext
- [ ] Create IntegrationContext

## Implementation Guidelines

### Custom Hooks

```typescript
// Example: useTimeInput hook
interface TimeInputState {
  currentTime: Date;
  timeInput: string;
  dateInput: string;
  isPM: boolean;
}

const useTimeInput = (initialTime: Date) => {
  const [state, setState] = useState<TimeInputState>(() => ({
    currentTime: initialTime,
    timeInput: formatTimeInput(initialTime),
    dateInput: formatDateInput(initialTime),
    isPM: isPMTime(initialTime)
  }));

  const updateTime = useCallback((newTime: Date) => {
    setState({
      currentTime: newTime,
      timeInput: formatTimeInput(newTime),
      dateInput: formatDateInput(newTime),
      isPM: isPMTime(newTime)
    });
  }, []);

  return [state, updateTime] as const;
};
```

### Context Structure

```typescript
// Example: Split TimeContext
interface TimeModeContextValue {
  isSimulated: boolean;
  toggleSimulation: () => void;
}

interface TimeFormatContextValue {
  formatTime: (date: Date) => string;
  formatDate: (date: Date) => string;
}

interface TimeUpdateContextValue {
  currentTime: Date;
  adjustTime: (minutes: number) => void;
}
```

### Performance Patterns

```typescript
// Example: Optimized component
const PatientCard: React.FC<PatientCardProps> = memo(({ patient }) => {
  const { state, handlers } = usePatientCard(patient);
  
  return (
    <div className={getCardClassName(state)}>
      {/* Optimized render logic */}
    </div>
  );
});
```

## Success Metrics

1. **Code Quality**
   - Reduced number of useState calls
   - Increased use of custom hooks
   - Better TypeScript type coverage
   - Improved wait time calculation reliability

2. **Performance**
   - Reduced number of re-renders
   - Faster state updates
   - Better memory usage
   - Improved wait time calculation performance

3. **Maintainability**
   - Clearer state management patterns
   - Better error handling
   - Improved test coverage
   - Better wait time calculation documentation

## Timeline

1. **Phase 1: State Consolidation**
   - Start: [Current Date]
   - Duration: 2 weeks
   - Focus: Custom hooks and state consolidation
   - Priority: Wait time calculation improvements

2. **Phase 2: Context Improvements**
   - Start: After Phase 1
   - Duration: 2 weeks
   - Focus: Context splitting and normalization

3. **Phase 3: Performance**
   - Start: After Phase 2
   - Duration: 1 week
   - Focus: Optimization and memoization

4. **Phase 4: Testing and Documentation**
   - Start: After Phase 3
   - Duration: 1 week
   - Focus: Testing and documentation

## Next Actions

1. Begin implementation of useWaitTime hook
2. Create test cases for wait time calculations
3. Document current wait time calculation patterns
4. Set up performance monitoring
5. Create PR template for state management changes 