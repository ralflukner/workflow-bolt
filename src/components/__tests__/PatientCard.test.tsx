import { render, screen, fireEvent } from '@testing-library/react';
import PatientCard from '../PatientCard';
import { Patient } from '../../types';
import { TestProviders } from '../../test/testHelpers';

// Mock the hooks and functions
const mockUpdatePatientStatus = jest.fn();
const mockAssignRoom = jest.fn();
const mockUpdateCheckInTime = jest.fn();

jest.mock('../../hooks/usePatientContext', () => ({
  usePatientContext: () => ({
    updatePatientStatus: mockUpdatePatientStatus,
    assignRoom: mockAssignRoom,
    updateCheckInTime: mockUpdateCheckInTime,
    getWaitTime: (patient: Patient) => {
      return patient.status === 'arrived' ? 25 : 0;
    }
  })
}));

jest.mock('../../hooks/useTimeContext', () => ({
  useTimeContext: () => ({
    getCurrentTime: () => new Date('2023-01-01T10:00:00.000Z'),
    formatDateTime: (date: Date) => `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
  })
}));

// Mock the formatters functions used in PatientCard
jest.mock('../../utils/formatters', () => ({
  formatTime: (date: string) => {
    const d = new Date(date);
    return `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
  },
  formatDate: (date: string) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  },
  formatDOB: (dob: string) => {
    // Simple implementation for tests
    if (dob === '1990-01-01') return '01/01/1990';
    if (dob === '1985-05-15') return '05/15/1985';
    if (dob === '1975-10-20') return '10/20/1975';
    const parts = dob.split('-');
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
    return dob; // Return as-is if not in expected format
  }
}));

describe('PatientCard', () => {
  const scheduledPatient: Patient = {
    id: 'test-1',
    name: 'John Doe',
    dob: '1990-01-01',
    appointmentTime: '2023-01-01T09:00:00.000Z',
    status: 'scheduled',
    provider: 'Dr. Test'
  };

  const arrivedPatient: Patient = {
    id: 'test-2',
    name: 'Jane Smith',
    dob: '1985-05-15',
    appointmentTime: '2023-01-01T09:30:00.000Z',
    status: 'arrived',
    provider: 'Dr. Test',
    checkInTime: '2023-01-01T09:35:00.000Z'
  };

  const prepPatient: Patient = {
    id: 'test-3',
    name: 'Bob Johnson',
    dob: '1975-10-20',
    appointmentTime: '2023-01-01T10:00:00.000Z',
    status: 'appt-prep',
    provider: 'Dr. Test',
    checkInTime: '2023-01-01T10:05:00.000Z',
    room: '1'
  };

  const completedPatient: Patient = {
    id: 'test-4',
    name: 'Alice Brown',
    dob: '1980-03-15',
    appointmentTime: '2023-01-01T08:00:00.000Z',
    status: 'completed',
    provider: 'Dr. Test',
    checkInTime: '2023-01-01T08:05:00.000Z',
    completedTime: '2023-01-01T09:00:00.000Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders scheduled patient card correctly', () => {
    render(
      <TestProviders
        patientContextOverrides={{
          updatePatientStatus: mockUpdatePatientStatus,
          assignRoom: mockAssignRoom,
          updateCheckInTime: mockUpdateCheckInTime,
          getWaitTime: jest.fn((_patient) => 0)
        }}
        timeContextOverrides={{
          getCurrentTime: jest.fn(() => new Date('2023-01-01T10:00:00.000Z'))
        }}
      >
        <PatientCard patient={scheduledPatient} />
      </TestProviders>
    );

    // Check that patient name is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    // Check that DOB is displayed correctly
    expect(screen.getByText('DOB: 01/01/1990')).toBeInTheDocument();
    
    // Check that appointment time is displayed
    expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    
    // Check that the status button is displayed
    expect(screen.getByText('Check In')).toBeInTheDocument();
  });

  it('renders arrived patient card correctly with wait time', () => {
    render(
      <TestProviders
        patientContextOverrides={{
          updatePatientStatus: mockUpdatePatientStatus,
          assignRoom: mockAssignRoom,
          updateCheckInTime: mockUpdateCheckInTime,
          getWaitTime: jest.fn((_patient) => 25) // 25 minutes wait time
        }}
        timeContextOverrides={{
          getCurrentTime: jest.fn(() => new Date('2023-01-01T10:00:00.000Z'))
        }}
      >
        <PatientCard patient={arrivedPatient} />
      </TestProviders>
    );

    // Check that patient name is displayed
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    // Check that wait time is displayed
    expect(screen.getByText('Wait: 25 min')).toBeInTheDocument();
    
    // Check that the status button is displayed
    expect(screen.getByText('Start Prep')).toBeInTheDocument();
  });

  it('handles status change when button is clicked', () => {
    render(
      <TestProviders
        patientContextOverrides={{
          updatePatientStatus: mockUpdatePatientStatus,
          assignRoom: mockAssignRoom,
          updateCheckInTime: mockUpdateCheckInTime,
          getWaitTime: jest.fn((_patient) => 0)
        }}
        timeContextOverrides={{
          getCurrentTime: jest.fn(() => new Date('2023-01-01T10:00:00.000Z'))
        }}
      >
        <PatientCard patient={scheduledPatient} />
      </TestProviders>
    );

    // Click the check-in button
    fireEvent.click(screen.getByText('Check In'));
    
    // Verify that updatePatientStatus was called with the correct parameters
    expect(mockUpdatePatientStatus).toHaveBeenCalledWith('test-1', 'arrived');
  });

  it('handles room assignment for arrived patients', () => {
    render(
      <TestProviders
        patientContextOverrides={{
          updatePatientStatus: mockUpdatePatientStatus,
          assignRoom: mockAssignRoom,
          updateCheckInTime: mockUpdateCheckInTime,
          getWaitTime: jest.fn((_patient) => 25)
        }}
        timeContextOverrides={{
          getCurrentTime: jest.fn(() => new Date('2023-01-01T10:00:00.000Z'))
        }}
      >
        <PatientCard patient={arrivedPatient} />
      </TestProviders>
    );

    const roomSelect = screen.getByRole('combobox');
    expect(roomSelect).toBeInTheDocument();
    
    fireEvent.change(roomSelect, { target: { value: '2' } });
    
    // Verify that assignRoom was called with the correct parameters
    expect(mockAssignRoom).toHaveBeenCalledWith('test-2', '2');
  });

  it('shows status dropdown for scheduled patients when clicked', () => {
    render(
      <TestProviders
        patientContextOverrides={{
          updatePatientStatus: mockUpdatePatientStatus,
          assignRoom: mockAssignRoom,
          updateCheckInTime: mockUpdateCheckInTime,
          getWaitTime: jest.fn((_patient) => 0)
        }}
        timeContextOverrides={{
          getCurrentTime: jest.fn(() => new Date('2023-01-01T10:00:00.000Z'))
        }}
      >
        <PatientCard patient={scheduledPatient} />
      </TestProviders>
    );

    const statusBadge = screen.getByText('scheduled');
    fireEvent.click(statusBadge);
    
    // Check that dropdown options are displayed
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Rescheduled')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Confirmed'));
    
    // Verify that updatePatientStatus was called with the correct parameters
    expect(mockUpdatePatientStatus).toHaveBeenCalledWith('test-1', 'Confirmed');
  });

  it('allows editing check-in time for patients in prep', () => {
    render(
      <TestProviders
        patientContextOverrides={{
          updatePatientStatus: mockUpdatePatientStatus,
          assignRoom: mockAssignRoom,
          updateCheckInTime: mockUpdateCheckInTime,
          getWaitTime: jest.fn((_patient) => 0)
        }}
        timeContextOverrides={{
          getCurrentTime: jest.fn(() => new Date('2023-01-01T10:00:00.000Z'))
        }}
      >
        <PatientCard patient={prepPatient} />
      </TestProviders>
    );

    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);
    
    // Check that date and time inputs are displayed
    const dateInput = screen.getByRole('textbox');
    const timeInput = screen.getAllByRole('textbox')[1];
    expect(dateInput).toBeInTheDocument();
    expect(timeInput).toBeInTheDocument();
    
    fireEvent.change(dateInput, { target: { value: '2023-01-01' } });
    fireEvent.change(timeInput, { target: { value: '09:45' } });
    
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    // Verify that updateCheckInTime was called with the correct parameters
    expect(mockUpdateCheckInTime).toHaveBeenCalledWith('test-3', '2023-01-01T09:45:00.000Z');
  });

  it('displays different wait time format for completed patients', () => {
    render(
      <TestProviders
        patientContextOverrides={{
          updatePatientStatus: mockUpdatePatientStatus,
          assignRoom: mockAssignRoom,
          updateCheckInTime: mockUpdateCheckInTime,
          getWaitTime: jest.fn((_patient) => 55) // 55 minutes total time
        }}
        timeContextOverrides={{
          getCurrentTime: jest.fn(() => new Date('2023-01-01T10:00:00.000Z'))
        }}
      >
        <PatientCard patient={completedPatient} />
      </TestProviders>
    );

    // Check that total time is displayed instead of wait time
    expect(screen.getByText('Total Time')).toBeInTheDocument();
    expect(screen.getByText('Total: 55 min')).toBeInTheDocument();
  });
});
