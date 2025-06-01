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
  totalAppointments: 5,
  waitingCount: 2,
  averageWaitTime: 15,
  maxWaitTime: 30,
  ...overrides
});
