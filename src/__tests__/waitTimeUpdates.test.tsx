import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { PatientProvider } from '../context/PatientContext';
import { TimeProvider } from '../context/TimeProvider';
import { usePatientContext } from '../hooks/usePatientContext';
import { Patient, PatientApptStatus } from '../types';

// Mock patient data with check-in time
const mockPatient: Patient = {
  id: 'test-patient-1',
  name: 'Test Patient',
  dob: '1990-01-01',
  appointmentTime: '2025-05-28T10:00:00.000Z',
  appointmentType: 'Office Visit',
  provider: 'Dr. Test',
  status: 'arrived' as PatientApptStatus,
  chiefComplaint: 'Test complaint',
  checkInTime: new Date(Date.now() - 10 * 60000).toISOString(), // 10 minutes ago
};

// Component that displays wait time and re-renders when context changes
const WaitTimeDisplay = ({ patientId }: { patientId: string }) => {
  const { patients, getWaitTime, tickCounter } = usePatientContext();
  const patient = patients.find(p => p.id === patientId);
  
  if (!patient) return <div>Patient not found</div>;
  
  const waitTime = getWaitTime(patient);
  
  return (
    <div>
      <div data-testid="wait-time">{waitTime}</div>
      <div data-testid="tick-counter">{tickCounter}</div>
    </div>
  );
};

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <TimeProvider>
    <PatientProvider>
      {children}
    </PatientProvider>
  </TimeProvider>
);

// Component to add the test patient to the context
const PatientInitializer = ({ onInitialized }: { onInitialized: () => void }) => {
  const { addPatient } = usePatientContext();
  
  React.useEffect(() => {
    addPatient(mockPatient);
    onInitialized();
  }, [addPatient, onInitialized]);
  
  return null;
};

describe('Wait Time Updates', () => {
  beforeEach(() => {
    // Mock timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should increment tickCounter at regular intervals', async () => {
    const initialized = jest.fn();
    
    render(
      <TestWrapper>
        <PatientInitializer onInitialized={initialized} />
        <WaitTimeDisplay patientId={mockPatient.id} />
      </TestWrapper>
    );
    
    // Wait for initialization
    await act(async () => {
      await Promise.resolve();
    });
    
    expect(initialized).toHaveBeenCalled();
    
    // Initial render
    const tickCounter = screen.getByTestId('tick-counter');
    const initialCount = parseInt(tickCounter.textContent || '0', 10);
    
    // Advance timers by 6 seconds (real-time mode interval)
    await act(async () => {
      jest.advanceTimersByTime(6000);
    });
    
    // Counter should have incremented
    const updatedCount = parseInt(tickCounter.textContent || '0', 10);
    expect(updatedCount).toBe(initialCount + 1);
    
    // Advance timers by another 6 seconds
    await act(async () => {
      jest.advanceTimersByTime(6000);
    });
    
    // Counter should have incremented again
    const finalCount = parseInt(tickCounter.textContent || '0', 10);
    expect(finalCount).toBe(initialCount + 2);
  });

  it('should update wait time when tickCounter increments', async () => {
    // Mock the getCurrentTime function to return a controllable time
    let currentMockTime = new Date();
    jest.spyOn(Date, 'now').mockImplementation(() => currentMockTime.getTime());
    
    const initialized = jest.fn();
    
    render(
      <TestWrapper>
        <PatientInitializer onInitialized={initialized} />
        <WaitTimeDisplay patientId={mockPatient.id} />
      </TestWrapper>
    );
    
    // Wait for initialization
    await act(async () => {
      await Promise.resolve();
    });
    
    expect(initialized).toHaveBeenCalled();
    
    // Initial wait time
    const waitTimeElement = screen.getByTestId('wait-time');
    const initialWaitTime = parseInt(waitTimeElement.textContent || '0', 10);
    
    // Advance mock time by 2 minutes
    currentMockTime = new Date(currentMockTime.getTime() + 2 * 60000);
    
    // Trigger a re-render via the tick counter
    await act(async () => {
      jest.advanceTimersByTime(6000);
    });
    
    // Wait time should have increased by approximately 2 minutes
    const updatedWaitTime = parseInt(waitTimeElement.textContent || '0', 10);
    expect(updatedWaitTime).toBe(initialWaitTime + 2);
  });

  it('should continue updating wait time over multiple ticks', async () => {
    // Mock the getCurrentTime function to return a controllable time
    let currentMockTime = new Date();
    jest.spyOn(Date, 'now').mockImplementation(() => currentMockTime.getTime());
    
    const initialized = jest.fn();
    
    render(
      <TestWrapper>
        <PatientInitializer onInitialized={initialized} />
        <WaitTimeDisplay patientId={mockPatient.id} />
      </TestWrapper>
    );
    
    // Wait for initialization
    await act(async () => {
      await Promise.resolve();
    });
    
    // Initial wait time
    const waitTimeElement = screen.getByTestId('wait-time');
    const initialWaitTime = parseInt(waitTimeElement.textContent || '0', 10);
    
    // First tick: Advance mock time by 2 minutes
    currentMockTime = new Date(currentMockTime.getTime() + 2 * 60000);
    
    await act(async () => {
      jest.advanceTimersByTime(6000);
    });
    
    // Wait time should have increased by approximately 2 minutes
    const firstUpdateWaitTime = parseInt(waitTimeElement.textContent || '0', 10);
    expect(firstUpdateWaitTime).toBe(initialWaitTime + 2);
    
    // Second tick: Advance mock time by another 3 minutes
    currentMockTime = new Date(currentMockTime.getTime() + 3 * 60000);
    
    await act(async () => {
      jest.advanceTimersByTime(6000);
    });
    
    // Wait time should have increased by approximately 5 minutes total
    const secondUpdateWaitTime = parseInt(waitTimeElement.textContent || '0', 10);
    expect(secondUpdateWaitTime).toBe(initialWaitTime + 5);
  });
});
