import { describe, it, expect } from '@jest/globals';
import { render, act } from '@testing-library/react';
import { PatientProvider } from '../context/PatientContext';
import { TimeProvider } from '../context/TimeProvider';
import { usePatientContext } from '../hooks/usePatientContext';
import { Patient } from '../types';
import React from 'react';

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

  it('should export patients to JSON', (done) => {
    let context: ReturnType<typeof usePatientContext>;
    const handleContext = (ctx: ReturnType<typeof usePatientContext>) => {
      context = ctx;
    };

    // Mock the necessary browser APIs
    const mockCreateObjectURL = jest.fn(() => 'mock-url');
    const mockRevokeObjectURL = jest.fn();
    const mockClick = jest.fn();
    
    Object.defineProperty(window.URL, 'createObjectURL', {
      value: mockCreateObjectURL,
      writable: true
    });
    Object.defineProperty(window.URL, 'revokeObjectURL', {
      value: mockRevokeObjectURL,
      writable: true
    });

    // Mock document.createElement to return a mock anchor element
    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick,
      style: { display: '' }
    } as unknown as HTMLAnchorElement;
    jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor);
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor);

    render(
      <TestWrapper>
        <ContextConsumer onContext={handleContext} />
      </TestWrapper>
    );

    setTimeout(() => {
      act(() => {
        context.importPatientsFromJSON(mockPatientData);
        context.exportPatientsToJSON();
      });

      // Verify all the export steps were called
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
      
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
      // Test with invalid data format
      const invalidData = [
        { name: 'Invalid Patient' } // Missing required fields
      ];

      expect(() => {
        act(() => {
          context.importPatientsFromJSON(invalidData as Patient[]);
        });
      }).not.toThrow(); // Should handle gracefully without crashing

      done();
    }, 0);
  });
}); 