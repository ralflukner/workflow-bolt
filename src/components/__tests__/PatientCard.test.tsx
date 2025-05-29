import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PatientCard from '../PatientCard';
import { PatientContext } from '../../context/PatientContextDef';
import { TimeContext } from '../../context/TimeContextDef';
import { Patient } from '../../types';

// Mock the hooks and functions
const mockUpdatePatientStatus = jest.fn();

jest.mock('../../hooks/usePatientContext', () => ({
  usePatientContext: () => ({
    updatePatientStatus: mockUpdatePatientStatus,
    getWaitTime: () => 25
  })
}));

jest.mock('../../hooks/useTimeContext', () => ({
  useTimeContext: () => ({
    getCurrentTime: () => new Date('2023-01-01T10:00:00.000Z')
  })
}));

// Mock the formatTime function used in PatientCard
jest.mock('../../utils/formatters', () => ({
  formatTime: (date: string) => {
    const d = new Date(date);
    return `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders scheduled patient card correctly', () => {
    render(
      <TimeContext.Provider value={{
        timeMode: { simulated: false, currentTime: new Date().toISOString() },
        setTimeMode: jest.fn(),
        getCurrentTime: jest.fn(() => new Date('2023-01-01T10:00:00.000Z')),
        speedUpTime: jest.fn(),
        resetTime: jest.fn()
      }}>
        <PatientContext.Provider value={{
          patients: [],
          setPatients: jest.fn(),
          addPatient: jest.fn(),
          updatePatientStatus: mockUpdatePatientStatus,
          getPatientsByStatus: jest.fn(),
          getWaitTime: jest.fn(() => 0),
          exportPatientsToJSON: jest.fn(),
          importPatientsFromJSON: jest.fn(),
          tickCounter: 0
        }}>
          <PatientCard patient={scheduledPatient} />
        </PatientContext.Provider>
      </TimeContext.Provider>
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
      <TimeContext.Provider value={{
        timeMode: { simulated: false, currentTime: new Date().toISOString() },
        setTimeMode: jest.fn(),
        getCurrentTime: jest.fn(() => new Date('2023-01-01T10:00:00.000Z')),
        speedUpTime: jest.fn(),
        resetTime: jest.fn()
      }}>
        <PatientContext.Provider value={{
          patients: [],
          setPatients: jest.fn(),
          addPatient: jest.fn(),
          updatePatientStatus: mockUpdatePatientStatus,
          getPatientsByStatus: jest.fn(),
          getWaitTime: jest.fn(() => 25), // 25 minutes wait time
          exportPatientsToJSON: jest.fn(),
          importPatientsFromJSON: jest.fn(),
          tickCounter: 0
        }}>
          <PatientCard patient={arrivedPatient} />
        </PatientContext.Provider>
      </TimeContext.Provider>
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
      <TimeContext.Provider value={{
        timeMode: { simulated: false, currentTime: new Date().toISOString() },
        setTimeMode: jest.fn(),
        getCurrentTime: jest.fn(() => new Date('2023-01-01T10:00:00.000Z')),
        speedUpTime: jest.fn(),
        resetTime: jest.fn()
      }}>
        <PatientContext.Provider value={{
          patients: [],
          setPatients: jest.fn(),
          addPatient: jest.fn(),
          updatePatientStatus: mockUpdatePatientStatus,
          getPatientsByStatus: jest.fn(),
          getWaitTime: jest.fn(() => 0),
          exportPatientsToJSON: jest.fn(),
          importPatientsFromJSON: jest.fn(),
          tickCounter: 0
        }}>
          <PatientCard patient={scheduledPatient} />
        </PatientContext.Provider>
      </TimeContext.Provider>
    );

    // Click the check-in button
    fireEvent.click(screen.getByText('Check In'));
    
    // Verify that updatePatientStatus was called with the correct parameters
    expect(mockUpdatePatientStatus).toHaveBeenCalledWith('test-1', 'arrived');
  });

  it('shows expanded details when card is clicked', () => {
    render(
      <TimeContext.Provider value={{
        timeMode: { simulated: false, currentTime: new Date().toISOString() },
        setTimeMode: jest.fn(),
        getCurrentTime: jest.fn(() => new Date('2023-01-01T10:00:00.000Z')),
        speedUpTime: jest.fn(),
        resetTime: jest.fn()
      }}>
        <PatientContext.Provider value={{
          patients: [],
          setPatients: jest.fn(),
          addPatient: jest.fn(),
          updatePatientStatus: mockUpdatePatientStatus,
          getPatientsByStatus: jest.fn(),
          getWaitTime: jest.fn(() => 0),
          exportPatientsToJSON: jest.fn(),
          importPatientsFromJSON: jest.fn(),
          tickCounter: 0
        }}>
          <PatientCard patient={{
            ...scheduledPatient,
            chiefComplaint: 'Annual checkup',
            appointmentType: 'Office Visit'
          }} />
        </PatientContext.Provider>
      </TimeContext.Provider>
    );

    // Initially, expanded details should not be visible
    expect(screen.queryByText('Chief Complaint:')).not.toBeInTheDocument();
    
    // Click the card to expand it
    fireEvent.click(screen.getByText('John Doe').closest('div')!);
    
    // Now expanded details should be visible
    expect(screen.getByText('Chief Complaint: Annual checkup')).toBeInTheDocument();
    expect(screen.getByText('Type: Office Visit')).toBeInTheDocument();
  });
});