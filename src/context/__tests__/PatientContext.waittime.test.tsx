import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { PatientProvider } from '../PatientContext';
import { PatientContext } from '../PatientContextDef';
import { TimeContext } from '../TimeContext';
import { Patient, PatientApptStatus } from '../../types';

// Mock TimeContext implementation
const mockGetCurrentTime = jest.fn();

const MockTimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const timeContextValue = {
    timeMode: {
      simulated: false,
      currentTime: new Date('2025-06-05T10:00:00').toISOString(),
    },
    toggleSimulation: jest.fn(),
    adjustTime: jest.fn(),
    getCurrentTime: mockGetCurrentTime,
    formatTime: jest.fn(),
    formatDateTime: jest.fn(),
  };
  
  return <TimeContext.Provider value={timeContextValue}>{children}</TimeContext.Provider>;
};

// Wrapper component that provides both TimeContext and PatientContext
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MockTimeProvider>
    <PatientProvider>
      {children}
    </PatientProvider>
  </MockTimeProvider>
);

// Test component that consumes PatientContext
const WaitTimeTestComponent: React.FC<{ patient: Patient }> = ({ patient }) => {
  const { getWaitTime } = React.useContext(PatientContext);
  const waitTime = getWaitTime(patient);
  
  return <div data-testid="wait-time">{waitTime}</div>;
};

describe('PatientContext wait time calculation', () => {
  beforeEach(() => {
    // Reset and set default mock implementation
    mockGetCurrentTime.mockReset();
    mockGetCurrentTime.mockImplementation(() => new Date('2025-06-05T10:00:00'));
  });

  test('returns 0 wait time when no checkInTime exists', () => {
    const testPatient: Patient = {
      id: '123',
      name: 'Test Patient',
      dob: '1990-01-01',
      provider: 'Dr. Test',
      appointmentTime: '2025-06-05T09:00:00',
      status: 'scheduled' as PatientApptStatus,
      // No checkInTime
    };

    render(
      <TestWrapper>
        <WaitTimeTestComponent patient={testPatient} />
      </TestWrapper>
    );

    expect(screen.getByTestId('wait-time').textContent).toBe('0');
  });

  test('calculates wait time correctly for checked-in patient', () => {
    // Patient checked in 30 minutes ago
    const testPatient: Patient = {
      id: '123',
      name: 'Test Patient',
      dob: '1990-01-01',
      provider: 'Dr. Test',
      appointmentTime: '2025-06-05T09:00:00',
      status: 'arrived' as PatientApptStatus,
      checkInTime: new Date('2025-06-05T09:30:00').toISOString(),
    };

    render(
      <TestWrapper>
        <WaitTimeTestComponent patient={testPatient} />
      </TestWrapper>
    );

    // Should be 30 minutes wait time (10:00 - 9:30)
    expect(screen.getByTestId('wait-time').textContent).toBe('30');
  });

  test('calculates wait time until withDoctorTime when patient is with doctor', () => {
    // Patient checked in at 9:00, went with doctor at 9:45
    const testPatient: Patient = {
      id: '123',
      name: 'Test Patient',
      dob: '1990-01-01',
      provider: 'Dr. Test',
      appointmentTime: '2025-06-05T09:00:00',
      status: 'With Doctor' as PatientApptStatus,
      checkInTime: new Date('2025-06-05T09:00:00').toISOString(),
      withDoctorTime: new Date('2025-06-05T09:45:00').toISOString(),
    };

    render(
      <TestWrapper>
        <WaitTimeTestComponent patient={testPatient} />
      </TestWrapper>
    );

    // Should be 45 minutes wait time (9:45 - 9:00)
    expect(screen.getByTestId('wait-time').textContent).toBe('45');
  });

  test('wait time updates when current time changes', () => {
    // Patient checked in at 9:30
    const testPatient: Patient = {
      id: '123',
      name: 'Test Patient',
      dob: '1990-01-01',
      provider: 'Dr. Test',
      appointmentTime: '2025-06-05T09:00:00',
      status: 'arrived' as PatientApptStatus,
      checkInTime: new Date('2025-06-05T09:30:00').toISOString(),
    };

    // Use the destructured rerender function from render
    const { rerender } = render(
      <TestWrapper>
        <WaitTimeTestComponent patient={testPatient} />
      </TestWrapper>
    );

    // Initial wait time should be 30 minutes (10:00 - 9:30)
    expect(screen.getByTestId('wait-time').textContent).toBe('30');

    // Change the current time to 10:15
    act(() => {
      mockGetCurrentTime.mockImplementation(() => new Date('2025-06-05T10:15:00'));
    });

    // Use rerender instead of render to update the existing component
    rerender(
      <TestWrapper>
        <WaitTimeTestComponent patient={testPatient} />
      </TestWrapper>
    );

    // Wait time should now be 45 minutes (10:15 - 9:30)
    expect(screen.getByTestId('wait-time').textContent).toBe('45');
  });
});
