
# Testing Expansion Plan for Patient Flow Managemen

Based on a thorough examination of the codebase, this document outlines a comprehensive testing strategy to improve code quality, reduce bugs, and make future development more efficient.

## Current Testing Status

- **Test Coverage**: 60.77% statements, 42.76% branches, 52.85% functions

- **Test Files**: 10 test suites with 33 tests

- **Testing Framework**: Jest with TypeScript suppor

- **Current Focus**: Primarily unit tests for data operations and schedule import functionality

## 1. Component Testing Implementation

### PatientCard Component Tests

The PatientCard component is central to the application but lacks dedicated tests. Recommended tests include:

- Rendering patient information correctly

- Status transitions via action buttons

- Room assignment functionality

- Wait time display

- Check-in time editing

- Status dropdown for scheduled patients

- Visual styling based on patient status

### PatientList Component Tests

The PatientList component needs tests for:

- Rendering the correct title and patient coun

- Displaying PatientCard components for each patien

- Empty state handling when no patients match a status

- Header color variations based on status

- Scrollable container behavior with many patients

### Dashboard Component Tests

The Dashboard component requires tests for:

- Rendering all patient list sections

- Modal interactions (New Patient, Import Schedule, etc.)

- Report generation functionality

- Responsive behavior (expanded/collapsed sections)

- Button functionality (Export JSON, Export CSV, etc.)

## 2. Context Provider Testing

### PatientContext Provider Tests

Expand testing of the PatientContext provider to cover:

- Status transition edge cases

- Metrics calculations with various patient states

- Time-dependent functions with mocked time

- Error handling for invalid data

- Status normalization for different input formats

- Room assignment validation

- Wait time calculations for different scenarios

### TimeContext Provider Tests

Add tests for the TimeProvider component:

- Time simulation mode transitions

- Time adjustment functionality

- Formatting functions with various inputs

- Real-time vs. simulated time behavior

- Time zone handling

## 3. Integration Testing

### Patient Workflow Tests

Add comprehensive integration tests for key workflows:

- Complete patient journey (scheduled → arrived → prep → with doctor → completed)

- Edge cases like cancellations and rescheduling

- Room assignment workflow

- Wait time calculations throughout the patient journey

### Schedule Import/Export Tests

Expand existing tests with:

- More real-world data examples

- Edge cases for special statuses

- Error handling for malformed data

- CSV import/export functionality

- Performance with large datasets

## 4. Authentication Testing

Add tests for authentication functionality:

- Protected routes behavior

- Login/logout functionality

- Role-based access control

- Auth0 integration

## 5. Accessibility Testing

Implement accessibility testing:

- Add jest-axe for accessibility testing

- Test all UI components for WCAG compliance

- Test keyboard navigation

- Test screen reader compatibility

- Color contrast validation

## 6. Performance Testing

Add performance tests for critical operations:

- Rendering performance with large patient lists

- Import/export performance with large datasets

- Time simulation with frequent updates

- Context provider performance with many consumers

## 7. Test Infrastructure Improvements

- Fix TypeScript 'any' type issues in existing tests

- Implement test data factories for consistent test data

- Add snapshot testing for UI components

- Set up E2E testing with Playwright or Cypress

- Implement test coverage thresholds in CI pipeline

## Implementation Priority

1. Fix existing test TypeScript errors
2. Add tests for core components (PatientCard, PatientList, Dashboard)
3. Expand context provider tests
4. Implement integration tests for key workflows
5. Add authentication and accessibility testing
6. Set up E2E testing infrastructure

## Example Test Implementation for PatientCard

```typescrip
// src/components/__tests__/PatientCard.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PatientCard from '../PatientCard';
import { PatientContext } from '../../context/PatientContextDef';
import { TimeContext } from '../../context/TimeContextDef';
import { Patient } from '../../types';

describe('PatientCard', () => {
  const mockUpdatePatientStatus = jest.fn();
  const mockAssignRoom = jest.fn();
  const mockUpdateCheckInTime = jest.fn();
  const mockGetWaitTime = jest.fn().mockReturnValue(10);

  const mockFormatDateTime = jest.fn().mockReturnValue('5/29/2025 10:00 AM');
  const mockFormatTime = jest.fn().mockReturnValue('10:00 AM');
  const mockGetCurrentTime = jest.fn().mockReturnValue(new Date('2025-05-29T10:00:00'));

  const mockPatient: Patient = {
    id: 'test-id',
    name: 'John Doe',
    dob: '1980-01-01',
    appointmentTime: '2025-05-29T10:00:00',
    status: 'scheduled',
    provider: 'Dr. Test',
    appointmentType: 'Office Visit',
    chiefComplaint: 'Follow-up'
  };

  const renderPatientCard = (patient: Patient = mockPatient) => {
    return render(
      <TimeContext.Provider value={{
        timeMode: { simulated: false, currentTime: '2025-05-29T10:00:00' },
        toggleSimulation: jest.fn(),
        adjustTime: jest.fn(),
        getCurrentTime: mockGetCurrentTime,
        formatTime: mockFormatTime,
        formatDateTime: mockFormatDateTime
      }}>
        <PatientContext.Provider value={{
          patients: [patient],
          addPatient: jest.fn(),
          updatePatientStatus: mockUpdatePatientStatus,
          assignRoom: mockAssignRoom,
          updateCheckInTime: mockUpdateCheckInTime,
          getPatientsByStatus: jest.fn(),
          getMetrics: jest.fn(),
          getWaitTime: mockGetWaitTime,
          clearPatients: jest.fn(),
          exportPatientsToJSON: jest.fn(),
          importPatientsFromJSON: jest.fn(),
          tickCounter: 0
        }}>
          <PatientCard patient={patient} />
        </PatientContext.Provider>
      </TimeContext.Provider>
    );
  };

  it('renders patient information correctly', () => {
    renderPatientCard();

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('DOB: 1980-01-01')).toBeInTheDocument();
    expect(screen.getByText('Office Visit - Follow-up')).toBeInTheDocument();
    expect(screen.getByText('scheduled')).toBeInTheDocument();
  });

  it('transitions patient status when action button is clicked', () => {
    renderPatientCard();

    const checkInButton = screen.getByText('Check In');
    fireEvent.click(checkInButton);

    expect(mockUpdatePatientStatus).toHaveBeenCalledWith('test-id', 'arrived');
  });

  it('allows room assignment for appropriate statuses', () => {
    renderPatientCard({
      ...mockPatient,
      status: 'arrived'
    });

    const roomSelect = screen.getByRole('combobox');
    fireEvent.change(roomSelect, { target: { value: '1' } });

    expect(mockAssignRoom).toHaveBeenCalledWith('test-id', '1');
  });
}

```

## Example Test Implementation for TimeContex

```typescrip
// src/context/__tests__/TimeContext.test.ts
import { renderHook, act } from '@testing-library/react';
import { TimeProvider } from '../TimeProvider';
import { useTimeContext } from '../../hooks/useTimeContext';

describe('TimeContext Provider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-05-29T10:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('provides real time by default', () => {
    const { result } = renderHook(() => useTimeContext(), {
      wrapper: ({ children }) => <TimeProvider>{children}</TimeProvider>
    });

    expect(result.current.timeMode.simulated).toBe(false);
    expect(new Date(result.current.timeMode.currentTime).getHours()).toBe(10);
  });

  it('toggles simulation mode correctly', () => {
    const { result } = renderHook(() => useTimeContext(), {
      wrapper: ({ children }) => <TimeProvider>{children}</TimeProvider>
    });

    act(() => {
      result.current.toggleSimulation();
    });

    expect(result.current.timeMode.simulated).toBe(true);
  });
}

```
