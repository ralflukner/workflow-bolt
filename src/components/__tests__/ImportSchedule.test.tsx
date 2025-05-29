import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImportSchedule from '../ImportSchedule';
import { PatientContext } from '../../context/PatientContextDef';
import { TimeContext } from '../../context/TimeContextDef';
import { Patient } from '../../types';

// Mock the usePatientContext hook
const mockAddPatient = jest.fn();
jest.mock('../../hooks/usePatientContext', () => ({
  usePatientContext: () => ({
    addPatient: mockAddPatient
  })
}));

// Mock the useTimeContext hook
jest.mock('../../hooks/useTimeContext', () => ({
  useTimeContext: () => ({
    getCurrentTime: () => new Date('2023-01-01T10:00:00.000Z')
  })
}));

describe('ImportSchedule', () => {
  const onClose = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the import form correctly', () => {
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
          addPatient: mockAddPatient,
          updatePatientStatus: jest.fn(),
          getPatientsByStatus: jest.fn(),
          getWaitTime: jest.fn(),
          exportPatientsToJSON: jest.fn(),
          importPatientsFromJSON: jest.fn(),
          tickCounter: 0
        }}>
          <ImportSchedule onClose={onClose} />
        </PatientContext.Provider>
      </TimeContext.Provider>
    );
    
    // Check that the component renders with the correct title
    expect(screen.getByText('Import Schedule')).toBeInTheDocument();
    
    // Check that the textarea is present
    expect(screen.getByPlaceholderText('Paste schedule data from spreadsheet here...')).toBeInTheDocument();
    
    // Check that the buttons are present
    expect(screen.getByText('Import')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
  
  it('handles import of valid schedule data', async () => {
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
          addPatient: mockAddPatient,
          updatePatientStatus: jest.fn(),
          getPatientsByStatus: jest.fn(),
          getWaitTime: jest.fn(),
          exportPatientsToJSON: jest.fn(),
          importPatientsFromJSON: jest.fn(),
          tickCounter: 0
        }}>
          <ImportSchedule onClose={onClose} />
        </PatientContext.Provider>
      </TimeContext.Provider>
    );
    
    // Sample schedule data in tab-separated format
    const sampleData = `01/15/2023\t9:00 AM\tScheduled\tJohn Doe\t01/01/1990\tOffice Visit\tAnnual checkup
01/15/2023\t10:00 AM\tConfirmed\tJane Smith\t05/15/1985\tOffice Visit\tFollow-up`;
    
    // Paste the data into the textarea
    const textarea = screen.getByPlaceholderText('Paste schedule data from spreadsheet here...');
    fireEvent.change(textarea, { target: { value: sampleData } });
    
    // Click the import button
    fireEvent.click(screen.getByText('Import'));
    
    // Wait for the import to complete
    await waitFor(() => {
      // Verify that addPatient was called twice (once for each patient)
      expect(mockAddPatient).toHaveBeenCalledTimes(2);
      
      // Verify the first patient data
      expect(mockAddPatient.mock.calls[0][0]).toMatchObject({
        name: 'John Doe',
        status: 'scheduled',
        chiefComplaint: 'Annual checkup'
      });
      
      // Verify the second patient data
      expect(mockAddPatient.mock.calls[1][0]).toMatchObject({
        name: 'Jane Smith',
        status: 'Confirmed',
        chiefComplaint: 'Follow-up'
      });
      
      // Verify that the modal was closed
      expect(onClose).toHaveBeenCalled();
    });
  });
  
  it('handles import of invalid schedule data with error message', async () => {
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
          addPatient: mockAddPatient,
          updatePatientStatus: jest.fn(),
          getPatientsByStatus: jest.fn(),
          getWaitTime: jest.fn(),
          exportPatientsToJSON: jest.fn(),
          importPatientsFromJSON: jest.fn(),
          tickCounter: 0
        }}>
          <ImportSchedule onClose={onClose} />
        </PatientContext.Provider>
      </TimeContext.Provider>
    );
    
    // Invalid data (missing fields)
    const invalidData = `01/15/2023\t9:00 AM\tScheduled`;
    
    // Paste the data into the textarea
    const textarea = screen.getByPlaceholderText('Paste schedule data from spreadsheet here...');
    fireEvent.change(textarea, { target: { value: invalidData } });
    
    // Click the import button
    fireEvent.click(screen.getByText('Import'));
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(/Error processing data/)).toBeInTheDocument();
    });
    
    // Verify that addPatient was not called
    expect(mockAddPatient).not.toHaveBeenCalled();
    
    // Verify that the modal was not closed
    expect(onClose).not.toHaveBeenCalled();
  });
  
  it('closes the modal when cancel is clicked', () => {
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
          addPatient: mockAddPatient,
          updatePatientStatus: jest.fn(),
          getPatientsByStatus: jest.fn(),
          getWaitTime: jest.fn(),
          exportPatientsToJSON: jest.fn(),
          importPatientsFromJSON: jest.fn(),
          tickCounter: 0
        }}>
          <ImportSchedule onClose={onClose} />
        </PatientContext.Provider>
      </TimeContext.Provider>
    );
    
    // Click the cancel button
    fireEvent.click(screen.getByText('Cancel'));
    
    // Verify that the modal was closed
    expect(onClose).toHaveBeenCalled();
  });
});