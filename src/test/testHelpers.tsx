import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PatientContext } from '../contexts/PatientContext';
import { TimeContext } from '../contexts/TimeContext';
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
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TimeContext.Provider value={createMockTimeContext(timeContextOverrides)}>
        <PatientContext.Provider value={createMockPatientContext(patientContextOverrides)}>
          {children}
        </PatientContext.Provider>
      </TimeContext.Provider>
    </QueryClientProvider>
  );
};
