import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PatientProvider } from '../context/PatientContext';
import { TimeProvider } from '../context/TimeProvider';
import { Patient } from '../types';

// Mock data for testing
const mockPatients: Patient[] = [
  {
    id: 'test-1',
    name: 'Test Patient 1',
    dob: '1990-01-01',
    appointmentTime: '2024-05-19T09:00:00.000Z',
    provider: 'Dr. Test',
    status: 'scheduled'
  },
  {
    id: 'test-2',
    name: 'Test Patient 2',
    dob: '1991-02-02',
    appointmentTime: '2024-05-19T09:30:00.000Z',
    provider: 'Dr. Test',
    status: 'CheckedOut'
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

describe('PatientContext JSON Operations', () => {
  it('should normalize statuses during import', async () => {
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

    // Test import
    context.importPatientsFromJSON(mockPatients);

    // Verify status normalization
    const patients = context.patients;
    expect(patients).toHaveLength(2);
    expect(patients[1].status).toBe('completed'); // CheckedOut should be normalized to completed
  });

  it('should export patients to JSON', () => {
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

    // Get the PatientProvider instance
    const provider = screen.getByText('Test Component').parentElement?.parentElement;
    if (!provider) throw new Error('Provider not found');

    // Access the context methods
    const context = (provider as any).__reactProps?.value;
    if (!context) throw new Error('Context not found');

    // Import test data
    context.importPatientsFromJSON(mockPatients);

    // Test export
    context.exportPatientsToJSON();

    // Verify export functionality
    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });

  it('should handle invalid JSON data', () => {
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

    // Test invalid data
    expect(() => {
      context.importPatientsFromJSON('not an array');
    }).toThrow('Invalid data format: expected array of patients');

    // Test missing required fields
    expect(() => {
      context.importPatientsFromJSON([{ id: 'test' }]);
    }).toThrow('Patient at index 0 missing required field: name');
  });
}); 