import React from 'react';
import { render, screen } from '@testing-library/react';
import TebraDebugDashboardContainer from '../../components/TebraDebugDashboardContainer';
import { PatientContext } from '../../context/PatientContextDef';
import { PatientContextType } from '../../context/PatientContextType';

// Provide minimal PatientContext for the component
const mockContext: PatientContextType = {
  patients: [],
  addPatient: jest.fn(),
  updatePatients: jest.fn(),
  deletePatient: jest.fn(),
  updatePatientStatus: jest.fn(),
  assignRoom: jest.fn(),
  updateCheckInTime: jest.fn(),
  getPatientsByStatus: jest.fn(() => []),
  getMetrics: jest.fn(() => ({ totalPatients: 0, patientsByStatus: {}, averageWaitTime: 0, patientsSeenToday: 0 } as any)),
  getWaitTime: jest.fn(() => 0),
  clearPatients: jest.fn(),
  exportPatientsToJSON: jest.fn(),
  importPatientsFromJSON: jest.fn(),
  tickCounter: 0,
  isLoading: false,
  persistenceEnabled: true,
  saveCurrentSession: jest.fn(),
  togglePersistence: jest.fn(),
  hasRealData: false,
  loadMockData: jest.fn(),
  refreshFromFirebase: jest.fn(),
};

jest.mock('../../services/tebraDebugApi', () => ({
  tebraDebugApi: {
    generateCorrelationId: () => 'test-id'
  }
}));

describe('TebraDebugDashboardContainer', () => {
  it('renders metrics cards', () => {
    render(
      <PatientContext.Provider value={mockContext}>
        <TebraDebugDashboardContainer />
      </PatientContext.Provider>
    );

    expect(screen.getByText(/Success Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Avg Response/i)).toBeInTheDocument();
  });
}); 