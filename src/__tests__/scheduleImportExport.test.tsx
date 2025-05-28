import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PatientProvider } from '../context/PatientContext';
import { TimeProvider } from '../context/TimeProvider';
import { Patient } from '../types';

// Sample schedule data in tab-separated format
const sampleScheduleData = `05/19/2025\t9:00 AM\tRescheduled\tJAMEY ALLEN COOK\t04/14/1980\tOffice Visit\t-
05/19/2025\t9:30 AM\tCheckedOut\tMARISOL HERNANDEZ MARTINEZ\t08/17/1974\tOffice Visit (Follow Up: nothing has changed)\t-
05/19/2025\t10:00 AM\tCheckedOut\tBRITTON THOMAS WHITE\t03/12/1986\tOffice Visit\t-
05/19/2025\t10:30 AM\tRescheduled\tJEANINE MALONE\t03/05/1970\tSPA - BOTOX / FILLER\t-
05/19/2025\t11:00 AM\tCheckedOut\tDERRICK J MARTIN\t01/09/1971\tSPA - BIOTE\t-`;

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <TimeProvider>
    <PatientProvider>
      {children}
    </PatientProvider>
  </TimeProvider>
);

describe('Schedule Import/Export Operations', () => {
  it('should parse tab-separated schedule data correctly', () => {
    const { getByText } = render(
      <TestWrapper>
        <div>Test Component</div>
      </TestWrapper>
    );

    // Get the PatientProvider instance
    const provider = screen.getByText('Test Component').parentElement?.parentElement;
    if (!provider) throw new Error('Provider not found');

    // Access the context methods
    const context = (provider as any).__reactProps?.value;
    if (!context) throw new Error('Context not found');

    // Parse the schedule data
    const lines = sampleScheduleData.split('\n');
    const parsedPatients = lines.map(line => {
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
        id: `pat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        dob: new Date(dob).toISOString().split('T')[0],
        appointmentTime,
        appointmentType: type as Patient['appointmentType'],
        provider: 'Dr. Test',
        status: status as Patient['status'],
        chiefComplaint: notes !== '-' ? notes : undefined
      };
    });

    // Import the parsed patients
    context.importPatientsFromJSON(parsedPatients);

    // Verify the import
    const patients = context.patients;
    expect(patients).toHaveLength(5);
    
    // Verify specific patient data
    const firstPatient = patients[0];
    expect(firstPatient.name).toBe('JAMEY ALLEN COOK');
    expect(firstPatient.status).toBe('Rescheduled');
    expect(firstPatient.appointmentType).toBe('Office Visit');

    // Verify status normalization
    const checkedOutPatient = patients[1];
    expect(checkedOutPatient.status).toBe('completed');
  });

  it('should handle malformed schedule data', () => {
    const { getByText } = render(
      <TestWrapper>
        <div>Test Component</div>
      </TestWrapper>
    );

    const provider = screen.getByText('Test Component').parentElement?.parentElement;
    if (!provider) throw new Error('Provider not found');

    const context = (provider as any).__reactProps?.value;
    if (!context) throw new Error('Context not found');

    // Test with malformed data
    const malformedData = `05/19/2025\t9:00 AM\tInvalid Status\tJOHN DOE\t01/01/1990\tOffice Visit\t-`;
    const lines = malformedData.split('\n');
    
    expect(() => {
      const parsedPatients = lines.map(line => {
        const [date, time, status, name, dob, type, notes] = line.split('\t');
        // ... parsing logic ...
        return {
          id: `pat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          dob: new Date(dob).toISOString().split('T')[0],
          appointmentTime: new Date().toISOString(), // Simplified for test
          provider: 'Dr. Test',
          status: status as Patient['status']
        };
      });
      context.importPatientsFromJSON(parsedPatients);
    }).not.toThrow(); // Should handle invalid status gracefully
  });

  it('should export schedule in CSV format', () => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    const mockCreateObjectURL = vi.fn();
    const mockRevokeObjectURL = vi.fn();
    window.URL.createObjectURL = mockCreateObjectURL;
    window.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock document.createElement and appendChild/removeChild
    const mockAppendChild = vi.fn();
    const mockRemoveChild = vi.fn();
    const mockClick = vi.fn();
    document.createElement = vi.fn().mockReturnValue({
      click: mockClick,
      href: '',
      download: ''
    });
    document.body.appendChild = mockAppendChild;
    document.body.removeChild = mockRemoveChild;

    const { getByText } = render(
      <TestWrapper>
        <div>Test Component</div>
      </TestWrapper>
    );

    const provider = screen.getByText('Test Component').parentElement?.parentElement;
    if (!provider) throw new Error('Provider not found');

    const context = (provider as any).__reactProps?.value;
    if (!context) throw new Error('Context not found');

    // Import test data
    const lines = sampleScheduleData.split('\n');
    const parsedPatients = lines.map(line => {
      const [date, time, status, name, dob, type, notes] = line.split('\t');
      return {
        id: `pat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        dob: new Date(dob).toISOString().split('T')[0],
        appointmentTime: new Date().toISOString(), // Simplified for test
        provider: 'Dr. Test',
        status: status as Patient['status'],
        appointmentType: type as Patient['appointmentType']
      };
    });
    context.importPatientsFromJSON(parsedPatients);

    // Test CSV export
    context.generateReport('csv');

    // Verify export functionality
    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });
}); 