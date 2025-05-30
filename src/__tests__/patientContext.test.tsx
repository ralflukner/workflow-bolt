import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, act, waitFor } from '@testing-library/react';
import { PatientProvider } from '../context/PatientContext';
import { TimeProvider } from '../context/TimeProvider';
import { usePatientContext } from '../hooks/usePatientContext';
import { Patient, PatientApptStatus } from '../types';
import React from 'react';
import { mockPatientData } from './mockPatientData';

// Mock Firebase and localStorage services to prevent real persistence calls
jest.mock('../services/firebase/dailySessionService', () => ({
  dailySessionService: {
    loadTodaysSession: jest.fn<() => Promise<Patient[]>>().mockResolvedValue([]),
    saveTodaysSession: jest.fn<(patients: Patient[]) => Promise<void>>().mockResolvedValue(undefined),
  }
}));

jest.mock('../services/localStorage/localSessionService', () => ({
  localSessionService: {
    loadTodaysSession: jest.fn<() => Promise<Patient[]>>().mockResolvedValue([]),
    saveTodaysSession: jest.fn<(patients: Patient[]) => Promise<void>>().mockResolvedValue(undefined),
  }
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <TimeProvider>
    <PatientProvider>
      {children}
    </PatientProvider>
  </TimeProvider>
);

// Context consumer for testing
const ContextConsumer = ({ onContext }: { onContext: (ctx: ReturnType<typeof usePatientContext>) => void }) => {
  const ctx = usePatientContext();
  React.useEffect(() => {
    onContext(ctx);
  }, [ctx, onContext]);
  return null;
};

describe('Patient Context JSON Operations', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.clearAllTimers();
  });

  it('should normalize status during import (Checked Out -> completed)', async () => {
    let context: ReturnType<typeof usePatientContext>;
    const handleContext = (ctx: ReturnType<typeof usePatientContext>) => {
      context = ctx;
    };
    
    render(
      <TestWrapper>
        <ContextConsumer onContext={handleContext} />
      </TestWrapper>
    );

    // Wait for context to be available
    await waitFor(() => {
      expect(context).toBeDefined();
    });

    act(() => {
      context.importPatientsFromJSON(mockPatientData);
    });

    await waitFor(() => {
      const patients = context.patients;
      expect(patients).toHaveLength(2);
      
      const checkedOutPatient = patients.find(p => p.name === 'John Doe');
      expect(checkedOutPatient?.status).toBe('completed');
      
      const roomedPatient = patients.find(p => p.name === 'Jane Smith');
      expect(roomedPatient?.status).toBe('appt-prep');
    });
  });

  it('should handle invalid JSON data gracefully', async () => {
    let context: ReturnType<typeof usePatientContext>;
    const handleContext = (ctx: ReturnType<typeof usePatientContext>) => {
      context = ctx;
    };

    render(
      <TestWrapper>
        <ContextConsumer onContext={handleContext} />
      </TestWrapper>
    );

    // Wait for context to be available
    await waitFor(() => {
      expect(context).toBeDefined();
    });

    // Test with invalid data format - missing required fields should throw
    const invalidData = [
      { name: 'Invalid Patient' } // Missing required fields
    ];

    expect(() => {
      act(() => {
        context.importPatientsFromJSON(invalidData as Patient[]);
      });
    }).toThrow('Patient at index 0 missing required field: id');

    // Test with complete data but invalid status - should not throw
    const dataWithInvalidStatus = [
      {
        id: 'test-1',
        name: 'Test Patient',
        dob: '1990-01-01',
        appointmentTime: '2024-01-15T09:00:00.000Z',
        appointmentType: 'Office Visit',
        provider: 'Dr. Test',
        status: null as unknown as PatientApptStatus // Invalid status that will be normalized
      }
    ];

    expect(() => {
      act(() => {
        context.importPatientsFromJSON(dataWithInvalidStatus as unknown as Patient[]);
      });
    }).not.toThrow(); // Should handle gracefully by normalizing to default status
  });
}); 