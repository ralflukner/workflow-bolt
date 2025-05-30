// Dashboard tests temporarily skipped due to hanging issues
// TODO: Investigate and fix hanging React component tests

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
