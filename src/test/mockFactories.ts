import { Metrics, Patient, PatientApptStatus } from '../types';

/**
 * Creates a mock patient for testing
 */
export const createMockPatient = (overrides = {}): Patient => ({
  id: '1',
  name: 'Test Patient',
  dob: '1990-01-01',
  appointmentTime: '2023-01-01T09:00:00.000Z',
  status: 'scheduled' as PatientApptStatus,
  provider: 'Dr. Test',
  checkInTime: '',
  room: '',
  ...overrides
});

/**
 * Creates mock metrics for testing
 */
export const createMockMetrics = (overrides = {}): Metrics => ({
  totalPatients: 5,
  patientsByStatus: {
    scheduled: 2,
    arrived: 1,
    'appt-prep': 1,
    'ready-for-md': 0,
    'With Doctor': 0,
    'seen-by-md': 0,
    completed: 1,
    Cancelled: 0,
    'No Show': 0,
    Rescheduled: 0
  },
  averageWaitTime: 15,
  patientsSeenToday: 2,
  ...overrides
});
