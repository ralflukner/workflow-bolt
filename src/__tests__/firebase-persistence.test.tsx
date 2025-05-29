import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, act, waitFor } from '@testing-library/react';
import React from 'react';
import { PatientProvider } from '../context/PatientContext';
import { TimeProvider } from '../context/TimeProvider';
import { usePatientContext } from '../hooks/usePatientContext';
import { dailySessionService } from '../services/firebase/dailySessionService';
import { Patient } from '../types';

// Mock the Firebase service
jest.mock('../services/firebase/dailySessionService', () => ({
  dailySessionService: {
    loadTodaysSession: jest.fn(),
    saveTodaysSession: jest.fn(),
    getSessionStats: jest.fn(),
    purgeOldSessions: jest.fn(),
    purgeAllSessions: jest.fn(),
  }
}));

const mockDailySessionService = dailySessionService as jest.Mocked<typeof dailySessionService>;

// Test wrapper components
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <TimeProvider>
    <PatientProvider>
      {children}
    </PatientProvider>
  </TimeProvider>
);

const ContextConsumer = ({ onContext }: { onContext: (ctx: ReturnType<typeof usePatientContext>) => void }) => {
  const context = usePatientContext();
  
  React.useEffect(() => {
    onContext(context);
  }, [context, onContext]);
  
  return null;
};

const mockPatients: Patient[] = [
  {
    id: 'test-1',
    name: 'John Doe',
    dob: '1990-01-01',
    appointmentTime: '2025-05-28T09:00:00.000Z',
    appointmentType: 'Office Visit',
    provider: 'Dr. Smith',
    status: 'scheduled'
  },
  {
    id: 'test-2',
    name: 'Jane Smith',
    dob: '1985-05-15',
    appointmentTime: '2025-05-28T10:00:00.000Z',
    appointmentType: 'Office Visit',
    provider: 'Dr. Jones',
    status: 'arrived',
    checkInTime: '2025-05-28T09:45:00.000Z'
  }
];

describe('Firebase Persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockDailySessionService.loadTodaysSession.mockResolvedValue([]);
    mockDailySessionService.saveTodaysSession.mockResolvedValue();
    mockDailySessionService.getSessionStats.mockResolvedValue({
      currentSessionDate: '2025-05-28',
      hasCurrentSession: false,
      totalSessions: 0
    });
    mockDailySessionService.purgeOldSessions.mockResolvedValue();
    mockDailySessionService.purgeAllSessions.mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should load saved session data on mount', async () => {
    let context: ReturnType<typeof usePatientContext>;
    
    // Mock loading saved patients
    mockDailySessionService.loadTodaysSession.mockResolvedValue(mockPatients);
    
    const handleContext = (ctx: ReturnType<typeof usePatientContext>) => {
      context = ctx;
    };

    render(
      <TestWrapper>
        <ContextConsumer onContext={handleContext} />
      </TestWrapper>
    );

    // Wait for the async loading to complete
    await waitFor(() => {
      expect(context!.isLoading).toBe(false);
    });

    expect(mockDailySessionService.loadTodaysSession).toHaveBeenCalledTimes(1);
    expect(context!.patients).toHaveLength(2);
    expect(context!.patients[0].name).toBe('John Doe');
    expect(context!.patients[1].name).toBe('Jane Smith');
  });

  it('should auto-save when patients data changes', async () => {
    let context: ReturnType<typeof usePatientContext>;
    
    const handleContext = (ctx: ReturnType<typeof usePatientContext>) => {
      context = ctx;
    };

    render(
      <TestWrapper>
        <ContextConsumer onContext={handleContext} />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(context!.isLoading).toBe(false);
    });

    // Add a new patient
    act(() => {
      context!.addPatient({
        name: 'New Patient',
        dob: '1995-01-01',
        appointmentTime: '2025-05-28T11:00:00.000Z',
        appointmentType: 'Office Visit',
        provider: 'Dr. Wilson',
        status: 'scheduled'
      });
    });

    // Wait for auto-save (debounced by 2 seconds)
    await waitFor(() => {
      expect(mockDailySessionService.saveTodaysSession).toHaveBeenCalled();
    }, { timeout: 3000 });

    expect(context!.patients).toHaveLength(1); // Mock data + 1 new patient
  });

  it('should handle manual save operation', async () => {
    let context: ReturnType<typeof usePatientContext>;
    
    const handleContext = (ctx: ReturnType<typeof usePatientContext>) => {
      context = ctx;
    };

    render(
      <TestWrapper>
        <ContextConsumer onContext={handleContext} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(context!.isLoading).toBe(false);
    });

    // Trigger manual save
    await act(async () => {
      await context!.saveCurrentSession();
    });

    expect(mockDailySessionService.saveTodaysSession).toHaveBeenCalledWith(context!.patients);
  });

  it('should handle persistence toggle', async () => {
    let context: ReturnType<typeof usePatientContext>;
    
    const handleContext = (ctx: ReturnType<typeof usePatientContext>) => {
      context = ctx;
    };

    render(
      <TestWrapper>
        <ContextConsumer onContext={handleContext} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(context!.isLoading).toBe(false);
    });

    expect(context!.persistenceEnabled).toBe(true);

    // Toggle persistence off
    act(() => {
      context!.togglePersistence();
    });

    expect(context!.persistenceEnabled).toBe(false);

    // Toggle persistence back on
    act(() => {
      context!.togglePersistence();
    });

    expect(context!.persistenceEnabled).toBe(true);
  });

  it('should gracefully handle Firebase errors', async () => {
    let context: ReturnType<typeof usePatientContext>;
    
    // Mock Firebase error
    mockDailySessionService.loadTodaysSession.mockRejectedValue(new Error('Firebase connection failed'));
    
    const handleContext = (ctx: ReturnType<typeof usePatientContext>) => {
      context = ctx;
    };

    render(
      <TestWrapper>
        <ContextConsumer onContext={handleContext} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(context!.isLoading).toBe(false);
    });

    // Should fall back to mock data when Firebase fails
    expect(context!.patients.length).toBeGreaterThan(0);
    expect(context!.persistenceEnabled).toBe(false); // Should disable persistence on error
  });

  it('should handle save errors gracefully', async () => {
    let context: ReturnType<typeof usePatientContext>;
    
    // Mock save error
    mockDailySessionService.saveTodaysSession.mockRejectedValue(new Error('Save failed'));
    
    const handleContext = (ctx: ReturnType<typeof usePatientContext>) => {
      context = ctx;
    };

    render(
      <TestWrapper>
        <ContextConsumer onContext={handleContext} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(context!.isLoading).toBe(false);
    });

    // Manual save should throw the error
    await expect(context!.saveCurrentSession()).rejects.toThrow('Save failed');
  });

  it('should use mock data when no saved session exists', async () => {
    let context: ReturnType<typeof usePatientContext>;
    
    // Mock empty session
    mockDailySessionService.loadTodaysSession.mockResolvedValue([]);
    
    const handleContext = (ctx: ReturnType<typeof usePatientContext>) => {
      context = ctx;
    };

    render(
      <TestWrapper>
        <ContextConsumer onContext={handleContext} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(context!.isLoading).toBe(false);
    });

    // Should save the initial mock data
    expect(mockDailySessionService.saveTodaysSession).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: expect.any(String) })
      ])
    );
  });
}); 