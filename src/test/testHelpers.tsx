import { ReactNode } from 'react';
import { PatientContext } from '../context/PatientContextDef';
import { TimeContext } from '../context/TimeContextDef';
import { Metrics, Patient, PatientApptStatus } from '../types';

/**
 * Creates a consistent mock for PatientContext to use across tests
 */
export const createMockPatientContext = (overrides = {}) => ({
  patients: [],
  addPatient: jest.fn(),
  updatePatientStatus: jest.fn(),
  assignRoom: jest.fn(),
  updateCheckInTime: jest.fn(),
  getPatientsByStatus: jest.fn(() => []),
  getMetrics: jest.fn(() => ({ 
    totalAppointments: 0, 
    waitingCount: 0, 
    averageWaitTime: 0, 
    maxWaitTime: 0 
  })),
  getWaitTime: jest.fn((patient) => {
    if (patient?.status === 'arrived') return 25;
    if (patient?.completedTime) return 55;
    return 0;
  }),
  clearPatients: jest.fn(),
  exportPatientsToJSON: jest.fn(),
  importPatientsFromJSON: jest.fn(),
  tickCounter: 0,
  isLoading: false,
  persistenceEnabled: false,
  saveCurrentSession: jest.fn().mockResolvedValue(undefined),
  togglePersistence: jest.fn(),
  ...overrides
});

/**
 * Creates a consistent mock for TimeContext to use across tests
 */
export const createMockTimeContext = (overrides = {}) => ({
  timeMode: { simulated: false, currentTime: new Date().toISOString() },
  toggleSimulation: jest.fn(),
  adjustTime: jest.fn(),
  getCurrentTime: jest.fn(() => new Date('2023-01-01T10:00:00.000Z')),
  formatTime: jest.fn(date => typeof date === 'string' ? new Date(date).toLocaleTimeString() : date.toLocaleTimeString()),
  formatDateTime: jest.fn(date => typeof date === 'string' ? new Date(date).toLocaleString() : date.toLocaleString()),
  ...overrides
});

/**
 * Test wrapper component that provides both PatientContext and TimeContext
 */
export const TestProviders = ({ 
  children, 
  patientContextOverrides = {}, 
  timeContextOverrides = {} 
}: { 
  children: ReactNode, 
  patientContextOverrides?: Partial<ReturnType<typeof createMockPatientContext>>,
  timeContextOverrides?: Partial<ReturnType<typeof createMockTimeContext>>
}) => {
  return (
    <TimeContext.Provider value={createMockTimeContext(timeContextOverrides)}>
      <PatientContext.Provider value={createMockPatientContext(patientContextOverrides)}>
        {children}
      </PatientContext.Provider>
    </TimeContext.Provider>
  );
};

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
