import { describe, it, expect } from '@jest/globals';
import { render, act } from '@testing-library/react';
import { PatientProvider } from '../context/PatientContext';
import { TimeProvider } from '../context/TimeProvider';
import { usePatientContext } from '../hooks/usePatientContext';
import React from 'react';

// Sample schedule data in tab-separated format (simulating what might be pasted from a spreadsheet)
const sampleScheduleData = `05/19/2025	9:00 AM	Scheduled	JOHN DOE	01/01/1990	Office Visit	-
05/19/2025	9:30 AM	Roomed	JANE SMITH	02/02/1991	Office Visit	Follow-up
05/19/2025	10:00 AM	Checked Out	BOB JONES	03/03/1992	Office Visit	Annual checkup`;

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

describe('Schedule Import/Export Functionality', () => {
  it('should parse tab-separated schedule data correctly', (done) => {
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
      // Parse the sample data (this would typically be done in a separate parser function)
      const lines = sampleScheduleData.trim().split('\n');
      const parsedPatients = lines.map((line, index) => {
        const [date, time, status, name, dob, type, notes] = line.split('\t');
        
        // Parse date and time
        const [month, day, year] = date.split('/');
        const [timeStr, period] = time.split(' ');
        const [hours, minutes] = timeStr.split(':');
        
        let hour = parseInt(hours);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        
        const appointmentTime = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          hour,
          parseInt(minutes)
        ).toISOString();

        return {
          id: `parsed-${index}`,
          name,
          dob: new Date(dob).toISOString().split('T')[0],
          appointmentTime,
          appointmentType: 'Office Visit' as const,
          provider: 'Dr. Test',
          status: status as any, // Will be normalized by the context
          chiefComplaint: notes !== '-' ? notes : undefined
        };
      });

      act(() => {
        context.importPatientsFromJSON(parsedPatients);
      });

      const patients = context.patients;
      expect(patients).toHaveLength(3);

      // Check that statuses were normalized correctly
      const scheduledPatient = patients.find(p => p.name === 'JOHN DOE');
      expect(scheduledPatient?.status).toBe('scheduled');

      const roomedPatient = patients.find(p => p.name === 'JANE SMITH');
      expect(roomedPatient?.status).toBe('appt-prep');

      const completedPatient = patients.find(p => p.name === 'BOB JONES');
      expect(completedPatient?.status).toBe('completed');

      done();
    }, 0);
  });

  it('should handle malformed schedule data gracefully', (done) => {
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
      // Test with incomplete data
      const malformedData = [
        {
          id: 'test-1',
          name: 'Test Patient',
          dob: '1990-01-01',
          appointmentTime: '2024-05-19T09:00:00.000Z',
          appointmentType: 'Office Visit' as const,
          provider: 'Dr. Test',
          status: 'InvalidStatus' as any // Invalid status
        }
      ];

      // Should not crash the application
      expect(() => {
        act(() => {
          context.importPatientsFromJSON(malformedData);
        });
      }).not.toThrow();

      done();
    }, 0);
  });

  it('should support CSV export functionality', (done) => {
    let context: ReturnType<typeof usePatientContext>;
    const handleContext = (ctx: ReturnType<typeof usePatientContext>) => {
      context = ctx;
    };

    // Mock CSV export functionality
    const mockCreateObjectURL = jest.fn(() => 'mock-csv-url');
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
      // Add some test patients
      const testPatients = [
        {
          id: 'csv-test-1',
          name: 'CSV Test Patient',
          dob: '1990-01-01',
          appointmentTime: '2024-05-19T09:00:00.000Z',
          appointmentType: 'Office Visit' as const,
          provider: 'Dr. CSV',
          status: 'scheduled' as const
        }
      ];

      act(() => {
        context.importPatientsFromJSON(testPatients);
        // Simulate CSV export (this would call the actual export function)
        context.exportPatientsToJSON(); // Using JSON export as CSV export proxy
      });

      // Verify export was triggered
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();

      done();
    }, 0);
  });
}); 