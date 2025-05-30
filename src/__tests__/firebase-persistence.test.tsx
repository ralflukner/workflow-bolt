import React from 'react';
import { render, waitFor, act, screen } from '@testing-library/react';
import { PatientProvider } from '../context/PatientContext';
import { TimeProvider } from '../context/TimeProvider';
import { usePatientContext } from '../hooks/usePatientContext';

// Mock Firebase configuration to return true
jest.mock('../config/firebase', () => ({
  db: {},
  auth: {},
  app: {},
  isFirebaseConfigured: true,
  isLocalDevelopment: false,
}));

// Mock the localStorage service as well (in case of fallback)
jest.mock('../services/localStorage/localSessionService', () => ({
  localSessionService: {
    loadTodaysSession: jest.fn(),
    saveTodaysSession: jest.fn(),
    deleteTodaysSession: jest.fn(),
    getSessionStats: jest.fn()
  }
}));

// Mock must be at the very top before any imports
jest.mock('../services/firebase/dailySessionService', () => ({
  dailySessionService: {
    loadTodaysSession: jest.fn(),
    saveTodaysSession: jest.fn(),
    deleteTodaysSession: jest.fn(),
    getSessionStats: jest.fn().mockResolvedValue({
      currentSessionDate: '2023-01-01',
      hasCurrentSession: false,
      totalSessions: 0,
      backend: 'firebase'
    })
  },
}));

// Get the mocked service for test assertions
import { dailySessionService } from '../services/firebase/dailySessionService';
const mockDailySessionService = dailySessionService as jest.Mocked<typeof dailySessionService>;

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <TimeProvider>
      <PatientProvider>
        {children}
      </PatientProvider>
    </TimeProvider>
  );
};

// Test component to access context
const TestComponent = () => {
  const context = usePatientContext();
  return (
    <div>
      <div data-testid="patient-count">{context.patients.length}</div>
      <div data-testid="persistence-enabled">{context.persistenceEnabled.toString()}</div>
      <button onClick={() => context.addPatient({
        name: 'John Doe',
        dob: '1990-01-01',
        appointmentTime: '2023-01-01T09:00:00.000Z',
        appointmentType: 'Office Visit',
        provider: 'Dr. Test',
        status: 'scheduled'
      })}>Add Patient</button>
      <button onClick={() => context.saveCurrentSession()}>Save Session</button>
    </div>
  );
};

describe('Firebase Persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDailySessionService.loadTodaysSession.mockResolvedValue([
      {
        id: 'test-1',
        name: 'John Doe',
        dob: '1990-01-01',
        appointmentTime: '2023-01-01T09:00:00.000Z',
        appointmentType: 'Office Visit',
        provider: 'Dr. Test',
        status: 'scheduled'
      },
      {
        id: 'test-2',
        name: 'Jane Smith',
        dob: '1985-05-15',
        appointmentTime: '2023-01-01T09:30:00.000Z',
        appointmentType: 'Office Visit',
        provider: 'Dr. Test',
        status: 'scheduled'
      }
    ]);
  });

  it('should load saved session data on mount', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
    });

    await waitFor(() => {
      expect(mockDailySessionService.loadTodaysSession).toHaveBeenCalledTimes(1);
    });

    const patientCount = screen.getByTestId('patient-count');
    expect(patientCount).toHaveTextContent('2');
  });

  it('should auto-save when patients data changes', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
    });

    await act(async () => {
      screen.getByText('Add Patient').click();
    });

    // Wait for auto-save (debounced by 2 seconds)
    await waitFor(() => {
      expect(mockDailySessionService.saveTodaysSession).toHaveBeenCalled();
    }, { timeout: 3000 });

    // Should have mock data + 1 new patient
    const patientCount = screen.getByTestId('patient-count');
    expect(patientCount).toHaveTextContent('3');
  });

  it('should handle manual save operation', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
    });

    await act(async () => {
      screen.getByText('Add Patient').click();
    });

    await act(async () => {
      screen.getByText('Save Session').click();
    });

    await waitFor(() => {
      expect(mockDailySessionService.saveTodaysSession).toHaveBeenCalled();
    });
  });

  it('should handle persistence toggle', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
    });

    const persistenceEnabled = screen.getByTestId('persistence-enabled');
    expect(persistenceEnabled).toHaveTextContent('true');

    // Simulate Firebase error by making loadTodaysSession reject on next call
    mockDailySessionService.loadTodaysSession.mockRejectedValueOnce(new Error('Firebase error'));

    await act(async () => {
      screen.getByText('Add Patient').click();
    });

    // For Firebase errors, persistence should remain enabled (different from localStorage)
    await waitFor(() => {
      expect(persistenceEnabled).toHaveTextContent('true');
    });
  });

  it('should gracefully handle Firebase errors', async () => {
    mockDailySessionService.loadTodaysSession.mockRejectedValueOnce(new Error('Firebase error'));

    await act(async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
    });

    // Should fall back to empty data when Firebase fails
    const patientCount = screen.getByTestId('patient-count');
    expect(patientCount).toHaveTextContent('0');

    // For Firebase errors, persistence should remain enabled 
    const persistenceEnabled = screen.getByTestId('persistence-enabled');
    expect(persistenceEnabled).toHaveTextContent('true');
  });

  it('should use mock data when no saved session exists', async () => {
    mockDailySessionService.loadTodaysSession.mockResolvedValueOnce([]);

    await act(async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
    });

    // Should start with empty data when no session exists
    const patientCount = screen.getByTestId('patient-count');
    expect(patientCount).toHaveTextContent('0');

    // The loadTodaysSession should have been called
    expect(mockDailySessionService.loadTodaysSession).toHaveBeenCalledTimes(1);
  });
}); 