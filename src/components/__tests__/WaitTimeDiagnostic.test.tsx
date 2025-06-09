import React from 'react';
import { render, screen } from '@testing-library/react';
import { WaitTimeDiagnostic } from '../WaitTimeDiagnostic';
import { Patient, PatientApptStatus } from '../../types';

// Mock patient context
const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'Patient 1',
    dob: '1990-01-01',
    provider: 'Dr. Test',
    appointmentTime: '2025-06-05T09:00:00',
    status: 'arrived' as PatientApptStatus,
    checkInTime: '2025-06-05T09:30:00',
  },
  {
    id: '2',
    name: 'Patient 2',
    dob: '1985-05-15',
    provider: 'Dr. Test',
    appointmentTime: '2025-06-05T09:30:00',
    status: 'appt-prep' as PatientApptStatus,
    checkInTime: '2025-06-05T09:15:00',
  },
  {
    id: '3',
    name: 'Patient 3',
    dob: '1970-10-20',
    provider: 'Dr. Test',
    appointmentTime: '2025-06-05T10:00:00',
    status: 'scheduled' as PatientApptStatus, // No check-in time
  }
];

let mockTickCounter = 0;
let mockCurrentTime = new Date('2025-06-05T10:00:00');

// Mock hooks
jest.mock('../../hooks/usePatientContext', () => ({
  usePatientContext: () => ({
    patients: mockPatients,
    getWaitTime: (patient: Patient) => {
      if (!patient.checkInTime) return 0;
      
      const checkInTime = new Date(patient.checkInTime);
      const timeDiffMs = mockCurrentTime.getTime() - checkInTime.getTime();
      return Math.floor(timeDiffMs / (1000 * 60)); // Convert ms to minutes
    },
    tickCounter: mockTickCounter
  })
}));

jest.mock('../../hooks/useTimeContext', () => ({
  useTimeContext: () => ({
    getCurrentTime: () => mockCurrentTime,
    timeMode: { simulated: false, currentTime: mockCurrentTime.toISOString() },
    formatDateTime: (date: Date) => date.toISOString()
  })
}));

describe('WaitTimeDiagnostic Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockCurrentTime = new Date('2025-06-05T10:00:00');
    mockTickCounter = 0;
    jest.clearAllMocks();
  });

  test('renders diagnostic information', () => {
    render(<WaitTimeDiagnostic />);
    
    // Check that the component renders
    expect(screen.getByText(/Wait Time Diagnostics/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Patients:/i)).toBeInTheDocument();
  });

  test('displays correct patient count statistics', () => {
    render(<WaitTimeDiagnostic />);
    
    // We should have 3 total patients, 2 with check-in times
    expect(screen.getByText('3')).toBeInTheDocument(); // Total patients
    expect(screen.getByText('2')).toBeInTheDocument(); // Patients with check-in
  });

  test('calculates wait times correctly', () => {
    render(<WaitTimeDiagnostic />);
    
    // Patient 1: Checked in at 9:30, now 10:00 => 30 min wait
    // Patient 2: Checked in at 9:15, now 10:00 => 45 min wait
    
    // Average wait time: (30 + 45) / 2 = 37.5 minutes, which should round to 38
    expect(screen.getByText(/Average Wait:/i)).toBeInTheDocument();
    expect(screen.getByText(/38 min/i)).toBeInTheDocument();
  });

  test('updates wait times when time changes', () => {
    const { rerender } = render(<WaitTimeDiagnostic />);
    
    // Initial wait times calculations
    // Patient 1: 30 min wait
    // Patient 2: 45 min wait
    expect(screen.getByText(/Average Wait:/i)).toBeInTheDocument();
    
    // Update time to 10:15 (15 minutes later)
    mockCurrentTime = new Date('2025-06-05T10:15:00');
    
    // Force update via tick counter
    mockTickCounter += 1;
    
    // Re-render with updated context
    rerender(<WaitTimeDiagnostic />);
    
    // New wait times:
    // Patient 1: 45 min wait (was 30)
    // Patient 2: 60 min wait (was 45)
    // Average: (45 + 60) / 2 = 52.5, which should round to 53
    expect(screen.getByText(/53 min/i)).toBeInTheDocument();
  });

  test('handles patients without check-in times', () => {
    // Patient 3 has no check-in time, should be excluded from wait calculations
    render(<WaitTimeDiagnostic />);
    
    // Component should still render without errors
    expect(screen.getByText(/Wait Time Diagnostics/i)).toBeInTheDocument();
    
    // We should still see correct counts for patients with and without wait times
    expect(screen.getByText(/With Check-in:/i).nextSibling?.textContent).toBe('2');
  });

  test('refreshes diagnostic information when tickCounter changes', () => {
    const { rerender } = render(<WaitTimeDiagnostic />);
    
    // Initial render
    const initialRender = screen.getByText(/Time Call Count:/i).nextSibling?.textContent;
    
    // Force update via tick counter
    mockTickCounter += 1;
    
    // Re-render
    rerender(<WaitTimeDiagnostic />);
    
    // Time call count should have increased
    const updatedRender = screen.getByText(/Time Call Count:/i).nextSibling?.textContent;
    expect(updatedRender).not.toBe(initialRender);
  });
});
