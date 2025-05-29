// React is used implicitly for JSX
import { render, screen } from '@testing-library/react';
import PatientList from '../PatientList';
import { PatientContext } from '../../context/PatientContextDef';
import { TimeContext } from '../../context/TimeContextDef';
import { PatientApptStatus } from '../../types';

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
  formatTime: (date: string) => {
    const d = new Date(date);
    return `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
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
    render(
      <TimeContext.Provider value={{
        timeMode: { simulated: false, currentTime: new Date().toISOString() },
        setTimeMode: jest.fn(),
        getCurrentTime: jest.fn(() => new Date()),
        speedUpTime: jest.fn(),
        resetTime: jest.fn()
      }}>
        <PatientContext.Provider value={{
          patients: [],
          setPatients: jest.fn(),
          addPatient: jest.fn(),
          updatePatientStatus: jest.fn(),
          getPatientsByStatus: jest.fn(),
          getWaitTime: jest.fn(),
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
        setTimeMode: jest.fn(),
        getCurrentTime: jest.fn(() => new Date()),
        speedUpTime: jest.fn(),
        resetTime: jest.fn()
      }}>
        <PatientContext.Provider value={{
          patients: [],
          setPatients: jest.fn(),
          addPatient: jest.fn(),
          updatePatientStatus: jest.fn(),
          getPatientsByStatus: jest.fn(() => []),
          getWaitTime: jest.fn(),
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

  // Skipping this test as it requires more complex DOM testing
  it.skip('applies the correct header color based on status', () => {
    // This test will be implemented in a future update
  });
});