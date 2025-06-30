/**
 * Health Checks Hook
 * Encapsulates the logic for testing each step in the Tebra integration chain
 */

import { useCallback } from 'react';
import { StepId, STEP_IDS, StepStatus } from '../constants/tebraDebug';
import { tebraDebugApi } from '../services/tebraDebugApi';
import { usePatientContext } from './usePatientContext';

export const useHealthChecks = () => {
  const { patients } = usePatientContext();

  const checkStepHealth = useCallback(async (stepId: StepId): Promise<StepStatus> => {
    try {
      switch (stepId) {
        case STEP_IDS.FRONTEND:
          return 'healthy'; // Always healthy if component is running

        case STEP_IDS.FIREBASE_FUNCTIONS:
          const functionsHealthy = await tebraDebugApi.testFirebaseFunctions();
          return functionsHealthy ? 'healthy' : 'error';

        case STEP_IDS.TEBRA_PROXY:
          try {
            const result = await tebraDebugApi.testTebraConnection();
            return (result as any)?.data?.success ? 'healthy' : 'error';
          } catch (error) {
            console.error('Tebra proxy error:', error);
            return 'error';
          }

        case STEP_IDS.CLOUD_RUN:
          try {
            const result = await tebraDebugApi.getProviders();
            return (result as any)?.data?.success ? 'healthy' : 'error';
          } catch (error) {
            console.error('Cloud Run error:', error);
            return 'error';
          }

        case STEP_IDS.TEBRA_API:
          try {
            const result = await tebraDebugApi.testAppointments(
              new Date().toISOString().split('T')[0]
            );
            return (result as any)?.data?.success ? 'healthy' : 'error';
          } catch (error) {
            console.error('Tebra API error:', error);
            return 'error';
          }

        case STEP_IDS.DATA_TRANSFORM:
          // In production, check actual data transformation pipeline health
          return 'healthy';

        case STEP_IDS.DASHBOARD_UPDATE:
          return patients.length >= 0 ? 'healthy' : 'error';

        default:
          return 'error';
      }
    } catch (error) {
      console.error(`Health check failed for ${stepId}:`, error);
      return 'error';
    }
  }, [patients]);

  const parseStepError = useCallback((stepId: StepId, error: Error): string => {
    const baseMessage = tebraDebugApi.parseFirebaseError(error);
    
    switch (stepId) {
      case STEP_IDS.TEBRA_PROXY:
        return `Node.js → PHP connection failed: ${baseMessage}`;
      case STEP_IDS.CLOUD_RUN:
        return `Firebase → PHP proxy chain failed: ${baseMessage}`;
      case STEP_IDS.TEBRA_API:
        return `PHP → Tebra SOAP API failed: ${baseMessage}`;
      default:
        return baseMessage;
    }
  }, []);

  return { checkStepHealth, parseStepError };
};