// React is used implicitly for JSX
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import PatientCard from '../PatientCard';
import { Patient, PatientApptStatus } from '../../types';
import { PatientProvider } from '../../context/PatientContext';
import { TimeProvider } from '../../context/TimeProvider';

// Mock the hooks and functions
const mockUpdatePatientStatus = jest.fn();
const mockGetWaitTime = jest.fn(() => 25);

jest.mock('../../hooks/usePatientContext', () => ({
  usePatientContext: () => ({
    updatePatientStatus: mockUpdatePatientStatus,
    getWaitTime: mockGetWaitTime
  })
}));

jest.mock('../../hooks/useTimeContext', () => ({
  useTimeContext: () => ({
    getCurrentTime: () => new Date('2023-01-01T10:00:00.000Z'),
    timeMode: { simulated: false, currentTime: new Date().toISOString() },
    formatDateTime: (date: Date) => `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
  })
}));

describe('PatientCard', () => {
  const mockPatient: Patient = {
    id: '1',
    name: 'John Doe',
    dob: '01/01/1990',
    appointmentTime: '2023-01-01T09:00:00.000Z',
    appointmentType: 'Office Visit',
    provider: 'Dr. Test',
    status: 'scheduled' as PatientApptStatus,
    checkInTime: undefined,
    room: undefined
  };

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <TimeProvider>
        <PatientProvider>
          {ui}
        </PatientProvider>
      </TimeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(() => {
    jest.spyOn(Date.prototype, 'toLocaleTimeString').mockImplementation(function (this: Date) {
      // Always return the same time for the test date
      if (this.toISOString() === '2023-01-01T09:15:00.000Z') return '09:15:00 AM';
      if (this.toISOString() === '2023-01-01T09:00:00.000Z') return '09:00:00 AM';
      return '00:00:00 AM';
    });
    jest.spyOn(Date.prototype, 'toLocaleDateString').mockImplementation(function (this: Date) {
      if (this.toISOString().startsWith('2023-01-01')) return '1/1/2023';
      if (this.toISOString().startsWith('1990-01-01')) return '1/1/1990';
      return '1/1/1970';
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('renders scheduled patient card correctly', async () => {
    await act(async () => {
      renderWithProviders(<PatientCard patient={mockPatient} />);
    });

    // Check that patient name is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();

    // Check that DOB line is displayed
    expect(screen.getByText((t)=>t.includes('DOB'))).toBeInTheDocument();

    // Check that appointment time contains 09:00:00 AM (mocked)
    expect(screen.getByText((t)=>t.includes('09:00:00 AM'))).toBeInTheDocument();

    // Check that the status button is displayed
    expect(screen.getByText('Check In')).toBeInTheDocument();

    // Check that provider is displayed
    expect(screen.getByText('Dr. Test')).toBeInTheDocument();
  });

  it('renders checked-in patient card correctly', async () => {
    const checkedInPatient: Patient = {
      ...mockPatient,
      status: 'checked-in' as PatientApptStatus,
      checkInTime: '2023-01-01T09:15:00.000Z',
      room: '101'
    };

    await act(async () => {
      renderWithProviders(<PatientCard patient={checkedInPatient} />);
    });

    // Check that status is updated
    expect(screen.getByText('checked-in')).toBeInTheDocument();

    // Check that check-in time contains 09:15:00 AM (mocked)
    expect(screen.getByText((t)=>t.includes('09:15:00 AM'))).toBeInTheDocument();

    // Check that room is displayed
    expect(screen.getByText('101')).toBeInTheDocument();
  });
});