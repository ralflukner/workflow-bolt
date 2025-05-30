import { render, screen, fireEvent } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { PatientContext } from '../../context/PatientContextDef';
import { TimeContext } from '../../context/TimeContextDef';
import { Patient } from '../../types';

const mockAddPatient = jest.fn();
const mockExportPatientsToJSON = jest.fn();
const mockImportPatientsFromJSON = jest.fn();
const mockClearPatients = jest.fn();

jest.mock('../../hooks/usePatientContext', () => ({
  usePatientContext: () => ({
    patients: [],
    addPatient: mockAddPatient,
    updatePatientStatus: jest.fn(),
    assignRoom: jest.fn(),
    updateCheckInTime: jest.fn(),
    getPatientsByStatus: (status: string) => {
      if (status === 'scheduled') return [{ id: '1', name: 'Test Patient', status: 'scheduled' }];
      return [];
    },
    getMetrics: () => ({ totalAppointments: 5, waitingCount: 2, averageWaitTime: 15, maxWaitTime: 30 }),
    getWaitTime: () => 0,
    clearPatients: mockClearPatients,
    exportPatientsToJSON: mockExportPatientsToJSON,
    importPatientsFromJSON: mockImportPatientsFromJSON,
    tickCounter: 0
  })
}));

jest.mock('../../hooks/useTimeContext', () => ({
  useTimeContext: () => ({
    getCurrentTime: () => new Date('2023-01-01T10:00:00.000Z'),
    formatDateTime: (date: Date | string) => typeof date === 'string' ? new Date(date).toLocaleString() : date.toLocaleString(),
    timeMode: { simulated: false, currentTime: new Date().toISOString() },
    toggleSimulation: jest.fn(),
    adjustTime: jest.fn(),
    formatTime: (date: Date | string) => typeof date === 'string' ? new Date(date).toLocaleTimeString() : date.toLocaleTimeString()
  })
}));

jest.mock('../../utils/formatters', () => ({
  formatTime: (date: string | Date) => {
    if (typeof date === 'string') {
      const d = new Date(date);
      return `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
    }
    return '10:00 AM';
  },
  formatDate: (date: string | Date) => {
    if (typeof date === 'string') {
      const d = new Date(date);
      return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    }
    return '1/1/2023';
  },
  formatDOB: (dob: string) => {
    if (typeof dob === 'string') {
      const parts = dob.split('-');
      if (parts.length === 3) {
        return `${parts[1]}/${parts[2]}/${parts[0]}`;
      }
    }
    return dob;
  }
}));

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard with metrics panel', () => {
    render(
      <TimeContext.Provider value={{
        timeMode: { simulated: false, currentTime: new Date().toISOString() },
        toggleSimulation: jest.fn(),
        adjustTime: jest.fn(),
        getCurrentTime: jest.fn(() => new Date('2023-01-01T10:00:00.000Z')),
        formatTime: jest.fn(date => date.toLocaleTimeString()),
        formatDateTime: jest.fn(date => date.toLocaleString())
      }}>
        <PatientContext.Provider value={{
          patients: [],
          addPatient: mockAddPatient,
          updatePatientStatus: jest.fn(),
          assignRoom: jest.fn(),
          updateCheckInTime: jest.fn(),
          getPatientsByStatus: jest.fn(() => []),
          getMetrics: jest.fn(() => ({ totalAppointments: 5, waitingCount: 2, averageWaitTime: 15, maxWaitTime: 30 })),
          getWaitTime: jest.fn(() => 0),
          clearPatients: mockClearPatients,
          exportPatientsToJSON: mockExportPatientsToJSON,
          importPatientsFromJSON: mockImportPatientsFromJSON,
          tickCounter: 0
        }}>
          <Dashboard />
        </PatientContext.Provider>
      </TimeContext.Provider>
    );

    expect(screen.getByText('Total Appointments')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Total appointments
    expect(screen.getByText('Waiting')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Waiting count
  });

  it('opens new patient modal when button is clicked', () => {
    render(
      <TimeContext.Provider value={{
        timeMode: { simulated: false, currentTime: new Date().toISOString() },
        toggleSimulation: jest.fn(),
        adjustTime: jest.fn(),
        getCurrentTime: jest.fn(() => new Date('2023-01-01T10:00:00.000Z')),
        formatTime: jest.fn(date => date.toLocaleTimeString()),
        formatDateTime: jest.fn(date => date.toLocaleString())
      }}>
        <PatientContext.Provider value={{
          patients: [],
          addPatient: mockAddPatient,
          updatePatientStatus: jest.fn(),
          assignRoom: jest.fn(),
          updateCheckInTime: jest.fn(),
          getPatientsByStatus: jest.fn(() => []),
          getMetrics: jest.fn(() => ({ totalAppointments: 0, waitingCount: 0, averageWaitTime: 0, maxWaitTime: 0 })),
          getWaitTime: jest.fn(() => 0),
          clearPatients: mockClearPatients,
          exportPatientsToJSON: mockExportPatientsToJSON,
          importPatientsFromJSON: mockImportPatientsFromJSON,
          tickCounter: 0
        }}>
          <Dashboard />
        </PatientContext.Provider>
      </TimeContext.Provider>
    );

    fireEvent.click(screen.getByText('New Patient'));
    
    expect(screen.getByText('Add New Patient')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Date of Birth')).toBeInTheDocument();
  });

  it('toggles section visibility when section headers are clicked', () => {
    render(
      <TimeContext.Provider value={{
        timeMode: { simulated: false, currentTime: new Date().toISOString() },
        toggleSimulation: jest.fn(),
        adjustTime: jest.fn(),
        getCurrentTime: jest.fn(() => new Date('2023-01-01T10:00:00.000Z')),
        formatTime: jest.fn(date => date.toLocaleTimeString()),
        formatDateTime: jest.fn(date => date.toLocaleString())
      }}>
        <PatientContext.Provider value={{
          patients: [],
          addPatient: mockAddPatient,
          updatePatientStatus: jest.fn(),
          assignRoom: jest.fn(),
          updateCheckInTime: jest.fn(),
          getPatientsByStatus: jest.fn((status) => {
            if (status === 'scheduled') return [{ 
              id: '1', 
              name: 'Test Patient', 
              dob: '1990-01-01',
              appointmentTime: '2023-01-01T09:00:00.000Z',
              status: 'scheduled',
              provider: 'Dr. Test'
            }];
            return [];
          }) as jest.Mock<Patient[], [status: string]>,
          getMetrics: jest.fn(() => ({ totalAppointments: 0, waitingCount: 0, averageWaitTime: 0, maxWaitTime: 0 })),
          getWaitTime: jest.fn(() => 0),
          clearPatients: mockClearPatients,
          exportPatientsToJSON: mockExportPatientsToJSON,
          importPatientsFromJSON: mockImportPatientsFromJSON,
          tickCounter: 0
        }}>
          <Dashboard />
        </PatientContext.Provider>
      </TimeContext.Provider>
    );

    const scheduledHeader = screen.getByText('Scheduled Patients');
    
    expect(screen.getByText('Test Patient')).toBeInTheDocument();
    
    fireEvent.click(scheduledHeader);
    
    expect(screen.queryByText('Test Patient')).not.toBeInTheDocument();
    
    fireEvent.click(scheduledHeader);
    
    expect(screen.getByText('Test Patient')).toBeInTheDocument();
  });

  it('opens import schedule modal when button is clicked', () => {
    render(
      <TimeContext.Provider value={{
        timeMode: { simulated: false, currentTime: new Date().toISOString() },
        toggleSimulation: jest.fn(),
        adjustTime: jest.fn(),
        getCurrentTime: jest.fn(() => new Date('2023-01-01T10:00:00.000Z')),
        formatTime: jest.fn(date => date.toLocaleTimeString()),
        formatDateTime: jest.fn(date => date.toLocaleString())
      }}>
        <PatientContext.Provider value={{
          patients: [],
          addPatient: mockAddPatient,
          updatePatientStatus: jest.fn(),
          assignRoom: jest.fn(),
          updateCheckInTime: jest.fn(),
          getPatientsByStatus: jest.fn(() => []),
          getMetrics: jest.fn(() => ({ totalAppointments: 0, waitingCount: 0, averageWaitTime: 0, maxWaitTime: 0 })),
          getWaitTime: jest.fn(() => 0),
          clearPatients: mockClearPatients,
          exportPatientsToJSON: mockExportPatientsToJSON,
          importPatientsFromJSON: mockImportPatientsFromJSON,
          tickCounter: 0
        }}>
          <Dashboard />
        </PatientContext.Provider>
      </TimeContext.Provider>
    );

    fireEvent.click(screen.getByText('Import Schedule'));
    
    expect(screen.getByText('Import Patient Schedule')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Paste tab-separated schedule data here')).toBeInTheDocument();
  });

  it('opens import JSON modal when button is clicked', () => {
    render(
      <TimeContext.Provider value={{
        timeMode: { simulated: false, currentTime: new Date().toISOString() },
        toggleSimulation: jest.fn(),
        adjustTime: jest.fn(),
        getCurrentTime: jest.fn(() => new Date('2023-01-01T10:00:00.000Z')),
        formatTime: jest.fn(date => date.toLocaleTimeString()),
        formatDateTime: jest.fn(date => date.toLocaleString())
      }}>
        <PatientContext.Provider value={{
          patients: [],
          addPatient: mockAddPatient,
          updatePatientStatus: jest.fn(),
          assignRoom: jest.fn(),
          updateCheckInTime: jest.fn(),
          getPatientsByStatus: jest.fn(() => []),
          getMetrics: jest.fn(() => ({ totalAppointments: 0, waitingCount: 0, averageWaitTime: 0, maxWaitTime: 0 })),
          getWaitTime: jest.fn(() => 0),
          clearPatients: mockClearPatients,
          exportPatientsToJSON: mockExportPatientsToJSON,
          importPatientsFromJSON: mockImportPatientsFromJSON,
          tickCounter: 0
        }}>
          <Dashboard />
        </PatientContext.Provider>
      </TimeContext.Provider>
    );

    fireEvent.click(screen.getByText('Import JSON'));
    
    expect(screen.getByText('Import Patient Data from JSON')).toBeInTheDocument();
  });

  it('calls exportPatientsToJSON when export button is clicked', () => {
    render(
      <TimeContext.Provider value={{
        timeMode: { simulated: false, currentTime: new Date().toISOString() },
        toggleSimulation: jest.fn(),
        adjustTime: jest.fn(),
        getCurrentTime: jest.fn(() => new Date('2023-01-01T10:00:00.000Z')),
        formatTime: jest.fn(date => date.toLocaleTimeString()),
        formatDateTime: jest.fn(date => date.toLocaleString())
      }}>
        <PatientContext.Provider value={{
          patients: [],
          addPatient: mockAddPatient,
          updatePatientStatus: jest.fn(),
          assignRoom: jest.fn(),
          updateCheckInTime: jest.fn(),
          getPatientsByStatus: jest.fn(() => []),
          getMetrics: jest.fn(() => ({ totalAppointments: 0, waitingCount: 0, averageWaitTime: 0, maxWaitTime: 0 })),
          getWaitTime: jest.fn(() => 0),
          clearPatients: mockClearPatients,
          exportPatientsToJSON: mockExportPatientsToJSON,
          importPatientsFromJSON: mockImportPatientsFromJSON,
          tickCounter: 0
        }}>
          <Dashboard />
        </PatientContext.Provider>
      </TimeContext.Provider>
    );

    fireEvent.click(screen.getByText('Export JSON'));
    
    expect(mockExportPatientsToJSON).toHaveBeenCalledTimes(1);
  });

  it('opens report modal when button is clicked', () => {
    render(
      <TimeContext.Provider value={{
        timeMode: { simulated: false, currentTime: new Date().toISOString() },
        toggleSimulation: jest.fn(),
        adjustTime: jest.fn(),
        getCurrentTime: jest.fn(() => new Date('2023-01-01T10:00:00.000Z')),
        formatTime: jest.fn(date => date.toLocaleTimeString()),
        formatDateTime: jest.fn(date => date.toLocaleString())
      }}>
        <PatientContext.Provider value={{
          patients: [],
          addPatient: mockAddPatient,
          updatePatientStatus: jest.fn(),
          assignRoom: jest.fn(),
          updateCheckInTime: jest.fn(),
          getPatientsByStatus: jest.fn(() => []),
          getMetrics: jest.fn(() => ({ totalAppointments: 0, waitingCount: 0, averageWaitTime: 0, maxWaitTime: 0 })),
          getWaitTime: jest.fn(() => 0),
          clearPatients: mockClearPatients,
          exportPatientsToJSON: mockExportPatientsToJSON,
          importPatientsFromJSON: mockImportPatientsFromJSON,
          tickCounter: 0
        }}>
          <Dashboard />
        </PatientContext.Provider>
      </TimeContext.Provider>
    );

    fireEvent.click(screen.getByText('Generate Report'));
    
    expect(screen.getByText('Patient Flow Report')).toBeInTheDocument();
  });
});
