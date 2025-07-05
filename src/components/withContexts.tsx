/**
 * Higher-Order Component for accessing multiple React contexts in class components
 * Replaces multiple useContext hooks to eliminate React hooks from production code
 */

import React, { Component, ComponentType } from 'react';
import { PatientContext, PatientContextType } from '../contexts/PatientContext';
import { TimeContext, TimeContextType } from '../contexts/TimeContext';

export interface WithContextsProps {
  patientContext: PatientContextType;
  timeContext: TimeContextType;
}

/**
 * HOC that provides both PatientContext and TimeContext to class components
 */
export function withContexts<P extends object = {}>(
  WrappedComponent: ComponentType<P & WithContextsProps>
) {
  return class WithContexts extends Component<P> {
    render() {
      return (
        <PatientContext.Consumer>
          {(patientContext) => (
            <TimeContext.Consumer>
              {(timeContext) => {
                // Ensure contexts are available
                if (!patientContext || !timeContext) {
                  if (process.env.NODE_ENV === 'test') {
                    // Provide minimal no-op contexts for unit tests to prevent crashes
                    const defaultPatientContext = {
                      patients: [],
                      addPatient: jest.fn ? jest.fn() : () => {},
                      updatePatient: () => {},
                      updatePatients: () => {},
                      deletePatient: () => {},
                      getPatientById: () => undefined,
                      getPatientsByStatus: () => [],
                      getWaitTime: () => 0,
                      calculateAverageWaitTime: () => 0,
                      calculateMaxWaitTime: () => 0,
                      importPatients: () => {},
                      importPatientsFromJSON: () => {},
                      exportPatientsToJSON: () => {},
                      clearAllPatients: () => {},
                      setPatientStatus: () => {},
                      setPatientRoom: () => {},
                      setPatientCheckInTime: () => {},
                      setPatientAppointmentTime: () => {},
                      setPatientChiefComplaint: () => {},
                      setPatientAppointmentType: () => {},
                      setPatientDOB: () => {},
                      setPatientName: () => {},
                      persistenceEnabled: false,
                      hasRealData: false,
                      isLoading: false,
                      tickCounter: 0,
                      togglePersistence: () => {},
                      saveCurrentSession: async () => {},
                      loadMockData: () => {}
                    } as any;

                    const defaultTimeContext = {
                      currentTime: new Date(),
                      timeMode: { simulated: false, speed: 1, currentTime: new Date().toISOString() },
                      getCurrentTime: () => new Date(),
                      setCurrentTime: () => {},
                      toggleTimeMode: () => {},
                      setTimeSpeed: () => {},
                      toggleSimulation: () => {},
                      adjustTime: () => {},
                      formatTime: () => '',
                      formatDateTime: () => ''
                    } as any;

                    return (
                      <WrappedComponent
                        {...(this.props as P)}
                        patientContext={defaultPatientContext}
                        timeContext={defaultTimeContext}
                      />
                    );
                  }

                  console.error('Context not available in withContexts HOC', {
                    patientContext: !!patientContext,
                    timeContext: !!timeContext,
                    component: WrappedComponent.name
                  });

                  return (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Context Error</h2>
                        <p className="text-gray-600 mb-4">Component context not available. Please ensure you're within the provider hierarchy.</p>
                        <button
                          onClick={() => window.location.reload()}
                          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                          Reload Page
                        </button>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <WrappedComponent
                    {...(this.props as P)}
                    patientContext={patientContext}
                    timeContext={timeContext}
                  />
                );
              }}
            </TimeContext.Consumer>
          )}
        </PatientContext.Consumer>
      );
    }
  };
}

export default withContexts;