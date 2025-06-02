import { render, screen } from '@testing-library/react';
import PatientList from '../PatientList';
import { TestProviders } from '../../test/testHelpers';
import { Patient } from '../../types';

// Mock patient data for testing
const mockPatients: Patient[] = [
  {
    id: 'test-1',
    name: 'John Doe',
    dob: '1990-01-01',
    appointmentTime: '2025-05-28T09:00:00.000Z',
    appointmentType: 'Office Visit',
    provider: 'Dr. Smith',
    status: 'scheduled',
    chiefComplaint: 'Annual checkup'
  },
  {
    id: 'test-2',
    name: 'Jane Smith',
    dob: '1985-05-15',
    appointmentTime: '2025-05-28T10:30:00.000Z',
    appointmentType: 'LABS',
    provider: 'Dr. Johnson',
    status: 'arrived',
    chiefComplaint: 'Follow-up'
  }
];

describe('PatientList', () => {
  const mockGetPatientsByStatus = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the title correctly', () => {
    mockGetPatientsByStatus.mockReturnValue([]);
    
    render(
      <TestProviders
        patientContextOverrides={{
          getPatientsByStatus: mockGetPatientsByStatus
        }}
      >
        <PatientList status="scheduled" title="Scheduled Patients" />
      </TestProviders>
    );
    
    expect(screen.getByText('Scheduled Patients')).toBeInTheDocument();
  });

  it('renders patients for the given status', () => {
    const scheduledPatients = mockPatients.filter(p => p.status === 'scheduled');
    mockGetPatientsByStatus.mockReturnValue(scheduledPatients);
    
    render(
      <TestProviders
        patientContextOverrides={{
          getPatientsByStatus: mockGetPatientsByStatus
        }}
      >
        <PatientList status="scheduled" title="Scheduled Patients" />
      </TestProviders>
    );
    
    expect(mockGetPatientsByStatus).toHaveBeenCalledWith('scheduled');
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders empty state when no patients', () => {
    mockGetPatientsByStatus.mockReturnValue([]);
    
    render(
      <TestProviders
        patientContextOverrides={{
          getPatientsByStatus: mockGetPatientsByStatus
        }}
      >
        <PatientList status="scheduled" title="Scheduled Patients" />
      </TestProviders>
    );
    
    expect(screen.getByText('Scheduled Patients')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('renders correct count of patients', () => {
    const arrivedPatients = mockPatients.filter(p => p.status === 'arrived');
    mockGetPatientsByStatus.mockReturnValue(arrivedPatients);
    
    render(
      <TestProviders
        patientContextOverrides={{
          getPatientsByStatus: mockGetPatientsByStatus
        }}
      >
        <PatientList status="arrived" title="Arrived Patients" />
      </TestProviders>
    );
    
    expect(mockGetPatientsByStatus).toHaveBeenCalledWith('arrived');
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });
});
