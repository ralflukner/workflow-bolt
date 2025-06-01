import { ReactNode } from 'react';
import { PatientContext } from '../context/PatientContextDef';
import { TimeContext } from '../context/TimeContextDef';
import { createMockPatientContext, createMockTimeContext } from './contextMocks';

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
