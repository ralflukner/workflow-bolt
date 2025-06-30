import React from 'react';
import { render, screen } from '@testing-library/react';
import TebraDebugDashboardContainer from '../../components/TebraDebugDashboardContainer';
import { PatientContext } from '../../context/PatientContextDef';
import { PatientContextType } from '../../context/PatientContextType';

// Minimal stub context to satisfy the container
const stubContext: PatientContextType = {
  patients: [],
  addPatient: jest.fn(),
  updatePatients: jest.fn(),
  deletePatient: jest.fn(),
  updatePatientStatus: jest.fn(),
  assignRoom: jest.fn(),
  updateCheckInTime: jest.fn(),
  getPatientsByStatus: jest.fn(() => []),
  getMetrics: jest.fn(() => ({
    totalPatients: 0,
    patientsByStatus: {} as any,
    averageWaitTime: 0,
    patientsSeenToday: 0
  })),
  getWaitTime: jest.fn(() => 0),
  clearPatients: jest.fn(),
  exportPatientsToJSON: jest.fn(),
  importPatientsFromJSON: jest.fn(),
  tickCounter: 0,
  isLoading: false,
  persistenceEnabled: false,
  saveCurrentSession: jest.fn(),
  togglePersistence: jest.fn(),
  hasRealData: false,
  loadMockData: jest.fn(),
  refreshFromFirebase: jest.fn()
};

describe('TebraDebugDashboardContainer', () => {
  it('renders default metrics', () => {
    render(
      <PatientContext.Provider value={stubContext}>
        <TebraDebugDashboardContainer />
      </PatientContext.Provider>
    );

    expect(screen.getByText(/Success Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Errors/i)).toBeInTheDocument();
  });
}); 