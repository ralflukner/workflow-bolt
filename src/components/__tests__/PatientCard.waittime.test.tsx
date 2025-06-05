import React from 'react';
import { render, screen, act } from '@testing-library/react';
import PatientCard from '../PatientCard';
import { PatientContext } from '../../context/PatientContextDef';
import { TimeContext } from '../../context/TimeContext';
import { Patient, PatientApptStatus } from '../../types';

// Mock hooks since we can't use the real context outside of providers
jest.mock('../../hooks/usePatientContext', () => ({
  usePatientContext: () => mockPatientContext
}));

jest.mock('../../hooks/useTimeContext', () => ({
  useTimeContext: () => mockTimeContext
}));

// Setup mock data and context values
const mockPatient: Patient = {
  id: 'test-123',
  name: 'Test Patient',
  dob: '1990-01-01',
  provider: 'Dr. Smith',
  appointmentTime: '2025-06-05T09:00:00',
  status: 'arrived' as PatientApptStatus,
  checkInTime: '2025-06-05T09:30:00',
};

let mockCurrentTime = new Date('2025-06-05T10:00:00');
let mockWaitTime = 30; // Initial wait time (30 minutes)

// Create mock context values
const mockPatientContext = {
  updatePatientStatus: jest.fn(),
  assignRoom: jest.fn(),
  updateCheckInTime: jest.fn(),
  getWaitTime: jest.fn().mockImplementation(() => mockWaitTime),
  // Add other required context properties
  patients: [],
  addPatient: jest.fn(),
  getPatientsByStatus: jest.fn(),
  getMetrics: jest.fn(),
  clearPatients: jest.fn(),
  exportPatientsToJSON: jest.fn(),
  importPatientsFromJSON: jest.fn(),
  tickCounter: 0,
  isLoading: false,
  persistenceEnabled: true,
  saveCurrentSession: jest.fn(),
  togglePersistence: jest.fn(),
  hasRealData: true,
  loadMockData: jest.fn(),
};

const mockTimeContext = {
  formatDateTime: jest.fn(date => date.toString()),
  getCurrentTime: jest.fn(() => mockCurrentTime),
  timeMode: { simulated: false, currentTime: mockCurrentTime.toISOString() },
  toggleSimulation: jest.fn(),
  adjustTime: jest.fn(),
  formatTime: jest.fn(date => date.toString()),
};

describe('PatientCard Wait Time Display', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockCurrentTime = new Date('2025-06-05T10:00:00');
    mockWaitTime = 30; // Reset to initial wait time
    
    mockPatientContext.getWaitTime.mockImplementation(() => mockWaitTime);
    mockTimeContext.getCurrentTime.mockImplementation(() => mockCurrentTime);
  });

  test('displays current wait time for a checked-in patient', () => {
    render(<PatientCard patient={mockPatient} />);

    // The component should display the wait time
    expect(screen.getByText(/wait: 30 min/i)).toBeInTheDocument();
  });

  test('updates wait time when ticker updates', () => {
    const { rerender } = render(<PatientCard patient={mockPatient} />);
    expect(screen.getByText(/wait: 30 min/i)).toBeInTheDocument();

    // Simulate time passing - wait time increases to 45 minutes
    mockWaitTime = 45;
    
    // Re-render with updated context
    rerender(<PatientCard patient={mockPatient} />);

    // Wait time should be updated
    expect(screen.getByText(/wait: 45 min/i)).toBeInTheDocument();
  });

  test('displays total time for completed patients', () => {
    // Create a completed patient who waited 45 minutes
    const completedPatient = {
      ...mockPatient,
      status: 'completed' as PatientApptStatus,
      completedTime: '2025-06-05T10:15:00', // They were checked in at 9:30, completed at 10:15
    };
    
    mockWaitTime = 45; // 45 minutes total wait time

    render(<PatientCard patient={completedPatient} />);

    // Should show "Total" instead of "Wait"
    expect(screen.getByText(/total: 45 min/i)).toBeInTheDocument();
  });

  test('wait time increases in real-time as getCurrentTime changes', () => {
    const { rerender } = render(<PatientCard patient={mockPatient} />);
    expect(screen.getByText(/wait: 30 min/i)).toBeInTheDocument();

    // Simulate 15 minutes passing
    mockCurrentTime = new Date('2025-06-05T10:15:00');
    mockWaitTime = 45; // 45 minutes (from 9:30 to 10:15)
    
    // Force update
    act(() => {
      mockPatientContext.tickCounter += 1;
    });

    // Re-render with "updated time"
    rerender(<PatientCard patient={mockPatient} />);

    // Wait time should have increased by 15 minutes
    expect(screen.getByText(/wait: 45 min/i)).toBeInTheDocument();
  });
});
