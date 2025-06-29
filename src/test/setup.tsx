/**
 * Test Setup and Utilities
 * 
 * This module provides test wrappers and utilities for React components
 * that require providers like QueryClient, Auth, etc.
 */

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TimeContext } from '../context/TimeContextDef';
import { PatientContext } from '../context/PatientContextDef';
import { createMockTimeContext, createMockPatientContext } from './contextMocks';

/**
 * Create a test QueryClient with appropriate settings for testing
 */
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
      staleTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
  logger: {
    log: () => {},
    warn: () => {},
    error: () => {},
  },
});

/**
 * Basic QueryClient wrapper for tests that need React Query
 */
export const QueryClientTestWrapper = ({ children }: { children: ReactNode }) => {
  const testQueryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
};

/**
 * Complete test wrapper with all providers
 */
export const TestWrapper = ({ 
  children,
  patientContextOverrides = {},
  timeContextOverrides = {},
  queryClient
}: { 
  children: ReactNode;
  patientContextOverrides?: any;
  timeContextOverrides?: any;
  queryClient?: QueryClient;
}) => {
  const testQueryClient = queryClient || createTestQueryClient();
  
  return (
    <QueryClientProvider client={testQueryClient}>
      <TimeContext.Provider value={createMockTimeContext(timeContextOverrides)}>
        <PatientContext.Provider value={createMockPatientContext(patientContextOverrides)}>
          {children}
        </PatientContext.Provider>
      </TimeContext.Provider>
    </QueryClientProvider>
  );
};

/**
 * Auth-enabled test wrapper (mocks Auth0)
 */
export const AuthTestWrapper = ({ children }: { children: ReactNode }) => {
  // Mock Auth0 provider for testing
  const mockAuth0Context = {
    isAuthenticated: true,
    isLoading: false,
    user: {
      sub: 'test-user-id',
      email: 'test@example.com',
      email_verified: true,
      name: 'Test User'
    },
    loginWithRedirect: jest.fn(),
    logout: jest.fn(),
    getAccessTokenSilently: jest.fn().mockResolvedValue('mock-token'),
    getIdTokenClaims: jest.fn().mockResolvedValue({ sub: 'test-user-id' })
  };

  return (
    <div data-testid="auth-wrapper">
      <QueryClientTestWrapper>
        {children}
      </QueryClientTestWrapper>
    </div>
  );
};

/**
 * Firebase-enabled test wrapper
 */
export const FirebaseTestWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <div data-testid="firebase-wrapper">
      <QueryClientTestWrapper>
        {children}
      </QueryClientTestWrapper>
    </div>
  );
};

/**
 * Test utilities for common testing scenarios
 */
export const testUtils = {
  /**
   * Wait for async operations to complete
   */
  waitForAsync: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Create mock patient data
   */
  createMockPatient: (overrides = {}) => ({
    id: 'test-patient-id',
    name: 'Test Patient',
    dob: '1990-01-01',
    status: 'scheduled',
    appointmentTime: '2023-01-01T10:00:00.000Z',
    appointmentType: 'Office Visit',
    chiefComplaint: 'Routine checkup',
    provider: 'Dr. Test',
    ...overrides
  }),

  /**
   * Create mock time context
   */
  createMockTimeContext: (overrides = {}) => ({
    currentTime: new Date('2023-01-01T10:00:00.000Z'),
    isSimulation: false,
    simulationSpeed: 1,
    ...overrides
  }),

  /**
   * Create mock patient context
   */
  createMockPatientContext: (overrides = {}) => ({
    patients: [],
    addPatient: jest.fn(),
    updatePatient: jest.fn(),
    deletePatient: jest.fn(),
    updatePatients: jest.fn(),
    getPatientsByStatus: jest.fn().mockReturnValue([]),
    ...overrides
  })
};

export default TestWrapper;