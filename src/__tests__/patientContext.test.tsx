import { describe, it, expect } from '@jest/globals';
import { render, act } from '@testing-library/react';
import { usePatientContext } from '../hooks/usePatientContext';
import { Patient, PatientApptStatus } from '../types';
import React from 'react';
import { TestProviders } from '../test/testHelpers';

// Mock patient data for testing
const mockPatientData: Patient[] = [
  {
    id: 'pat-1',
    name: 'John Doe',
    dob: '1990-01-01',
    appointmentTime: '2024-01-15T09:00:00.000Z',
    appointmentType: 'Office Visit',
    provider: 'Dr. Smith',
    status: 'Checked Out',
    chiefComplaint: 'Annual checkup'
  },
  {
    id: 'pat-2', 
    name: 'Jane Smith',
    dob: '1985-05-15',
    appointmentTime: '2024-01-15T10:30:00.000Z',
    appointmentType: 'Office Visit',
    provider: 'Dr. Johnson',
    status: 'Roomed',
    chiefComplaint: 'Cosmetic consultation'
  }
];

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <TestProviders>
    {children}
  </TestProviders>
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
  it('should normalize status during import (Checked Out -> completed)', (done) => {
    let context: ReturnType<typeof usePatientContext>;
    const handleContext = (ctx: ReturnType<typeof usePatientContext>) => {
      context = ctx;
    };
    
    render(
      <TestWrapper>
        <ContextConsumer onContext={handleContext} />
      </TestWrapper>
    );

    setTimeout(() => {
      act(() => {
        context.importPatientsFromJSON(mockPatientData);
      });

      const patients = context.patients;
      expect(patients).toHaveLength(2);
      
      const checkedOutPatient = patients.find(p => p.name === 'John Doe');
      expect(checkedOutPatient?.status).toBe('completed');
      
      const roomedPatient = patients.find(p => p.name === 'Jane Smith');
      expect(roomedPatient?.status).toBe('appt-prep');
      
      done();
    }, 0);
  });

  it('should handle invalid JSON data gracefully', (done) => {
    let context: ReturnType<typeof usePatientContext>;
    const handleContext = (ctx: ReturnType<typeof usePatientContext>) => {
      context = ctx;
    };

    render(
      <TestWrapper>
        <ContextConsumer onContext={handleContext} />
      </TestWrapper>
    );

    setTimeout(() => {
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

      done();
    }, 0);
  });
});    