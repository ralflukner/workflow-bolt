import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PatientProvider } from '../context/PatientContext';
import { TimeProvider } from '../context/TimeProvider';
import { Patient, PatientApptStatus } from '../types';

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <TimeProvider>
    <PatientProvider>
      {children}
    </PatientProvider>
  </TimeProvider>
);

describe('Schedule Import Functionality', () => {
  // Helper function to parse schedule line
  const parseScheduleLine = (line: string): Partial<Patient> => {
    const [date, time, status, name, dob, type, notes] = line.split('\t');
    
    // Create appointment time by combining date and time
    const [month, day, year] = date.split('/');
    const [hours, minutes, period] = time.split(' ');
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
      name,
      dob: new Date(dob).toISOString().split('T')[0],
      appointmentTime,
      appointmentType: type as Patient['appointmentType'],
      provider: 'Dr. Test',
      status: status as PatientApptStatus,
      chiefComplaint: notes !== '-' ? notes : undefined
    };
  };

  it('should correctly parse and import a single schedule line', () => {
    const { getByText } = render(
      <TestWrapper>
        <div>Test Component</div>
      </TestWrapper>
    );

    const provider = screen.getByText('Test Component').parentElement?.parentElement;
    if (!provider) throw new Error('Provider not found');

    const context = (provider as any).__reactProps?.value;
    if (!context) throw new Error('Context not found');

    // Test a single line with various statuses
    const testCases = [
      {
        line: '05/19/2025\t9:00 AM\tCheckedOut\tJOHN DOE\t01/01/1990\tOffice Visit\t-',
        expectedStatus: 'completed',
        expectedType: 'Office Visit'
      },
      {
        line: '05/19/2025\t9:30 AM\tRoomed\tJANE DOE\t02/02/1991\tSPA - BOTOX / FILLER\tFollow-up',
        expectedStatus: 'appt-prep',
        expectedType: 'SPA - BOTOX / FILLER'
      },
      {
        line: '05/19/2025\t10:00 AM\tScheduled\tBOB SMITH\t03/03/1992\tOffice Visit\t-',
        expectedStatus: 'scheduled',
        expectedType: 'Office Visit'
      }
    ];

    testCases.forEach(testCase => {
      // Clear existing patients
      context.clearPatients();

      // Parse and import the test line
      const patientData = parseScheduleLine(testCase.line);
      const patient: Patient = {
        id: `pat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...patientData
      } as Patient;

      context.importPatientsFromJSON([patient]);

      // Verify the import
      const patients = context.patients;
      expect(patients).toHaveLength(1);
      
      const importedPatient = patients[0];
      expect(importedPatient.name).toBe(patient.name);
      expect(importedPatient.status).toBe(testCase.expectedStatus);
      expect(importedPatient.appointmentType).toBe(testCase.expectedType);
      expect(importedPatient.dob).toBe(patient.dob);
      expect(importedPatient.appointmentTime).toBe(patient.appointmentTime);
      
      // Verify timestamps are set correctly based on status
      if (testCase.expectedStatus === 'completed') {
        expect(importedPatient.completedTime).toBeDefined();
      }
      if (testCase.expectedStatus === 'appt-prep') {
        expect(importedPatient.checkInTime).toBeDefined();
      }
    });
  });

  it('should handle multiple lines with different statuses', () => {
    const { getByText } = render(
      <TestWrapper>
        <div>Test Component</div>
      </TestWrapper>
    );

    const provider = screen.getByText('Test Component').parentElement?.parentElement;
    if (!provider) throw new Error('Provider not found');

    const context = (provider as any).__reactProps?.value;
    if (!context) throw new Error('Context not found');

    const multiLineSchedule = `05/19/2025\t9:00 AM\tCheckedOut\tJOHN DOE\t01/01/1990\tOffice Visit\t-
05/19/2025\t9:30 AM\tRoomed\tJANE DOE\t02/02/1991\tSPA - BOTOX / FILLER\tFollow-up
05/19/2025\t10:00 AM\tScheduled\tBOB SMITH\t03/03/1992\tOffice Visit\t-`;

    // Parse and import all lines
    const patients = multiLineSchedule.split('\n').map(line => {
      const patientData = parseScheduleLine(line);
      return {
        id: `pat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...patientData
      } as Patient;
    });

    context.importPatientsFromJSON(patients);

    // Verify the import
    const importedPatients = context.patients;
    expect(importedPatients).toHaveLength(3);

    // Verify status normalization
    const statusCounts = importedPatients.reduce((acc, patient) => {
      acc[patient.status] = (acc[patient.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    expect(statusCounts['completed']).toBe(1); // CheckedOut
    expect(statusCounts['appt-prep']).toBe(1); // Roomed
    expect(statusCounts['scheduled']).toBe(1); // Scheduled

    // Verify patients are in correct lists
    const completedPatients = context.getPatientsByStatus('completed');
    const preppedPatients = context.getPatientsByStatus('appt-prep');
    const scheduledPatients = context.getPatientsByStatus('scheduled');

    expect(completedPatients).toHaveLength(1);
    expect(preppedPatients).toHaveLength(1);
    expect(scheduledPatients).toHaveLength(1);
  });

  it('should handle edge cases in schedule data', () => {
    const { getByText } = render(
      <TestWrapper>
        <div>Test Component</div>
      </TestWrapper>
    );

    const provider = screen.getByText('Test Component').parentElement?.parentElement;
    if (!provider) throw new Error('Provider not found');

    const context = (provider as any).__reactProps?.value;
    if (!context) throw new Error('Context not found');

    const edgeCases = [
      // Empty notes
      '05/19/2025\t9:00 AM\tCheckedOut\tJOHN DOE\t01/01/1990\tOffice Visit\t-',
      // Notes with special characters
      '05/19/2025\t9:30 AM\tRoomed\tJANE DOE\t02/02/1991\tSPA - BOTOX / FILLER\tFollow-up (2nd visit)',
      // Different appointment types
      '05/19/2025\t10:00 AM\tScheduled\tBOB SMITH\t03/03/1992\tLABS\t-',
      // Different date formats (should be handled by the parser)
      '05/19/2025\t11:00 AM\tCheckedOut\tALICE SMITH\t04/04/1993\tOffice Visit\t-'
    ];

    const patients = edgeCases.map(line => {
      const patientData = parseScheduleLine(line);
      return {
        id: `pat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...patientData
      } as Patient;
    });

    context.importPatientsFromJSON(patients);

    // Verify the import
    const importedPatients = context.patients;
    expect(importedPatients).toHaveLength(4);

    // Verify each patient's data is correctly parsed
    importedPatients.forEach((patient, index) => {
      const originalLine = edgeCases[index];
      const [_, __, ___, name, dob, type, notes] = originalLine.split('\t');
      
      expect(patient.name).toBe(name);
      expect(patient.appointmentType).toBe(type);
      if (notes !== '-') {
        expect(patient.chiefComplaint).toBe(notes);
      }
    });
  });
}); 