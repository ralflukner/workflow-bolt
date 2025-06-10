import React from 'react';
import { render, screen } from '@testing-library/react';
import { PatientProvider } from '../PatientContext';
import { PatientContext } from '../PatientContextDef';
import { TimeContext } from '../TimeContext';
import { Patient } from '../../types';

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
  const context = React.useContext(PatientContext);
  if (!context) {
    throw new Error('PatientContext must be used within a PatientProvider');
  }
  const { getWaitTime } = context;
  const waitTime = getWaitTime(patient);
  
  return <div data-testid="wait-time">{waitTime}</div>;
};

describe('PatientContext Wait Time Calculations', () => {
  const mockPatient: Patient = {
    id: '123',
    name: 'John Doe',
    dob: '1990-01-01',
    appointmentTime: '2025-06-05T09:00:00',
    status: 'arrived',
    provider: 'Dr. Test',
    checkInTime: new Date('2025-06-05T09:30:00').toISOString()
  };

  beforeEach(() => {
    mockGetCurrentTime.mockReturnValue(new Date('2025-06-05T10:00:00').toISOString());
  });

  it('should calculate wait time correctly', () => {
    render(
      <TestWrapper>
        <WaitTimeTestComponent patient={mockPatient} />
      </TestWrapper>
    );

    const waitTimeElement = screen.getByTestId('wait-time');
    expect(waitTimeElement).toHaveTextContent('30');
  });
});
