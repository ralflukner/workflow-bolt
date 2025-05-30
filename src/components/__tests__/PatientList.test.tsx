// React is used implicitly for JSX
import { render, screen } from '@testing-library/react';
import PatientList from '../PatientList';
import { PatientContext } from '../../context/PatientContextDef';
import { TimeContext } from '../../context/TimeContextDef';
import { PatientApptStatus, Patient } from '../../types';

// Mock the usePatientContext hook
jest.mock('../../hooks/usePatientContext', () => ({
  usePatientContext: () => ({
    getPatientsByStatus: (status: PatientApptStatus) => {
      if (status === 'scheduled') {
        return [
          {
            id: 'test-1',
            name: 'John Doe',
            dob: '1990-01-01',
            appointmentTime: '2023-01-01T09:00:00.000Z',
            status: 'scheduled',
            provider: 'Dr. Test'
          },
          {
            id: 'test-2',
            name: 'Jane Smith',
            dob: '1985-05-15',
            appointmentTime: '2023-01-01T10:00:00.000Z',
            status: 'scheduled',
            provider: 'Dr. Test'
          }
        ];
      }
      return []; // Return empty array for other statuses
    }
  })
}));

// Mock the formatTime function
jest.mock('../../utils/formatters', () => ({
  formatTime: (date: unknown) => {
    if (typeof date === 'string') {
      const d = new Date(date);
      return `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
    }
    return '10:00 AM'; // Default for non-string inputs
  },
  formatDate: (date: string) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  },
  formatDOB: (dob: string) => {
    const parts = dob.split('-');
    return `${parts[1]}/${parts[2]}/${parts[0]}`;
  }
}));

describe('PatientList', () => {
  it('renders correctly with patients', () => {
    // Create a mock implementation of getPatientsByStatus
    const mockGetPatientsByStatus = jest.fn((status: PatientApptStatus) => {
      if (status === 'scheduled') {
        return [
          {
            id: 'test-1',
            name: 'John Doe',
            dob: '1990-01-01',
            appointmentTime: '2023-01-01T09:00:00.000Z',
            status: 'scheduled' as PatientApptStatus,
            provider: 'Dr. Test'
          },
          {
            id: 'test-2',
            name: 'Jane Smith',
            dob: '1985-05-15',
            appointmentTime: '2023-01-01T10:00:00.000Z',
            status: 'scheduled' as PatientApptStatus,
            provider: 'Dr. Test'
          }
        ];
      }
      return [];
    }) as jest.Mock<Patient[], [status: PatientApptStatus]>;
    
    render(
      <TimeContext.Provider value={{
        timeMode: { simulated: false, currentTime: new Date().toISOString() },
        toggleSimulation: jest.fn(),
        adjustTime: jest.fn(),
        getCurrentTime: jest.fn(() => new Date()),
        formatTime: jest.fn(date => date.toLocaleTimeString()),
        formatDateTime: jest.fn(date => date.toLocaleString())
      }}>
        <PatientContext.Provider value={{
          patients: [],
          addPatient: jest.fn(),
          updatePatientStatus: jest.fn(),
          assignRoom: jest.fn(),
          updateCheckInTime: jest.fn(),
          // @ts-expect-error testing mock
          getPatientsByStatus: mockGetPatientsByStatus,
          getMetrics: jest.fn(() => ({ totalAppointments: 0, waitingCount: 0, averageWaitTime: 0, maxWaitTime: 0 })),
          getWaitTime: jest.fn(() => 0),
          clearPatients: jest.fn(),
          exportPatientsToJSON: jest.fn(),
          importPatientsFromJSON: jest.fn(),
          tickCounter: 0
        }}>
          <PatientList status="scheduled" title="Scheduled Patients" />
        </PatientContext.Provider>
      </TimeContext.Provider>
    );

    // Check that the title is rendered
    expect(screen.getByText('Scheduled Patients')).toBeInTheDocument();
    
    // Check that the patient names are rendered
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    // Check that the count is correct
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders correctly with no patients', () => {
    render(
      <TimeContext.Provider value={{
        timeMode: { simulated: false, currentTime: new Date().toISOString() },
        toggleSimulation: jest.fn(),
        adjustTime: jest.fn(),
        getCurrentTime: jest.fn(() => new Date()),
        formatTime: jest.fn(date => date.toLocaleTimeString()),
        formatDateTime: jest.fn(date => date.toLocaleString())
      }}>
        <PatientContext.Provider value={{
          patients: [],
          addPatient: jest.fn(),
          updatePatientStatus: jest.fn(),
          assignRoom: jest.fn(),
          updateCheckInTime: jest.fn(),
          // @ts-expect-error test property not in interface
          setPatients: jest.fn(),
          getMetrics: jest.fn(() => ({ totalAppointments: 0, waitingCount: 0, averageWaitTime: 0, maxWaitTime: 0 })),
          getWaitTime: jest.fn(() => 0),
          clearPatients: jest.fn(),
          exportPatientsToJSON: jest.fn(),
          importPatientsFromJSON: jest.fn(),
          tickCounter: 0
        }}>
          <PatientList status="arrived" title="Arrived Patients" />
        </PatientContext.Provider>
      </TimeContext.Provider>
    );

    // Check that the title is rendered
    expect(screen.getByText('Arrived Patients')).toBeInTheDocument();
    
    // Check that the empty message is displayed
    expect(screen.getByText('No patients in this category')).toBeInTheDocument();
    
    // Check that the count is 0
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('applies the correct header color based on status', () => {
    const statuses: PatientApptStatus[] = [
      'scheduled', 'Confirmed', 'Rescheduled', 'Cancelled', 'No Show',
      'arrived', 'appt-prep', 'ready-for-md', 'With Doctor', 'seen-by-md', 'completed'
    ];
    
    const expectedColors = [
      'bg-gray-700', 'bg-green-800', 'bg-orange-700', 'bg-red-700', 'bg-red-800',
      'bg-amber-700', 'bg-purple-700', 'bg-cyan-700', 'bg-blue-700', 'bg-teal-700', 'bg-green-700'
    ];
    
    statuses.forEach((status, index) => {
      render(
        <TimeContext.Provider value={{
          timeMode: { simulated: false, currentTime: new Date().toISOString() },
          toggleSimulation: jest.fn(),
          adjustTime: jest.fn(),
          getCurrentTime: jest.fn(() => new Date()),
          formatTime: jest.fn(date => date.toLocaleTimeString()),
          formatDateTime: jest.fn(date => date.toLocaleString())
        }}>
          <PatientContext.Provider value={{
            patients: [],
            addPatient: jest.fn(),
            updatePatientStatus: jest.fn(),
            assignRoom: jest.fn(),
            updateCheckInTime: jest.fn(),
            getPatientsByStatus: jest.fn(() => []),
            getMetrics: jest.fn(() => ({ totalAppointments: 0, waitingCount: 0, averageWaitTime: 0, maxWaitTime: 0 })),
            getWaitTime: jest.fn(() => 0),
            clearPatients: jest.fn(),
            exportPatientsToJSON: jest.fn(),
            importPatientsFromJSON: jest.fn(),
            tickCounter: 0
          }}>
            <PatientList status={status} title={`${status} Patients`} />
          </PatientContext.Provider>
        </TimeContext.Provider>
      );
      
      // Check that the header has the correct background color class
      const headerElement = screen.getByText(`${status} Patients`).closest('div');
      expect(headerElement).toHaveClass(expectedColors[index]);
      
      jest.clearAllMocks();
    });
  });
});
