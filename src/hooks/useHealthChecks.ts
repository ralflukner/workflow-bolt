/**
 * Health Checks Hook
 * Encapsulates the logic for testing each step in the Tebra integration chain
 */

// @ts-nocheck

import { useCallback } from 'react';
import { STEP_IDS } from '../constants/tebraConfig';
import { tebraDebugApi, HealthCheckResult } from '../services/tebraDebugApi';
import { usePatientContext } from '../context/PatientContext';

export type StepId = typeof STEP_IDS[keyof typeof STEP_IDS];
export type StepStatus = 'healthy' | 'warning' | 'error' | 'unknown';

export interface StepResult {
  status: StepStatus;
  message: string;
  duration: number;
  correlationId: string;
  details?: Record<string, unknown>;
}

export const useHealthChecks = () => {
  const { patients } = usePatientContext();

  /**
   * Check the health of a specific integration step
   */
  const checkStepHealth = useCallback(async (stepId: StepId): Promise<StepResult> => {
    try {
      let result: HealthCheckResult;

      switch (stepId) {
        case STEP_IDS.FRONTEND:
          result = await tebraDebugApi.testFrontendHealth();
          break;

        case STEP_IDS.FIREBASE_FUNCTIONS:
          result = await tebraDebugApi.testFirebaseFunctions();
          break;

        case STEP_IDS.TEBRA_PROXY:
          result = await tebraDebugApi.testTebraProxy();
          break;

        case STEP_IDS.CLOUD_RUN:
          // For Cloud Run, we test the Tebra API since that goes through Cloud Run
          result = await tebraDebugApi.testTebraApi();
          break;

        case STEP_IDS.TEBRA_API:
          result = await tebraDebugApi.testTebraApi();
          break;

        case STEP_IDS.DATA_TRANSFORM:
          result = await tebraDebugApi.testDataTransform();
          break;

        case STEP_IDS.DASHBOARD_UPDATE:
          result = await tebraDebugApi.testDashboardUpdate();
          // Enhance with actual patient data context
          result.details = {
            ...result.details,
            patientCount: patients.length,
            hasPatients: patients.length > 0
          };
          break;

        default:
          result = {
            status: 'error',
            message: `Unknown step ID: ${stepId}`,
            duration: 0,
            correlationId: tebraDebugApi.generateCorrelationId()
          };
      }

      return {
        status: result.status,
        message: result.message,
        duration: result.duration,
        correlationId: result.correlationId,
        details: result.details
      };
    } catch (error) {
      console.error(`Health check failed for ${stepId}:`, error);
      return {
        status: 'error',
        message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: 0,
        correlationId: tebraDebugApi.generateCorrelationId()
      };
    }
  }, [patients]);

  /**
   * Run health checks for all steps
   */
  const checkAllSteps = useCallback(async (): Promise<Record<StepId, StepResult>> => {
    const allSteps = Object.values(STEP_IDS) as StepId[];
    
    // Run all health checks in parallel for better performance
    const results = await Promise.allSettled(
      allSteps.map(async (stepId) => ({
        stepId,
        result: await checkStepHealth(stepId)
      }))
    );

    // Convert results to a keyed object
    const healthResults: Record<string, StepResult> = {};
    
    results.forEach((promiseResult, index) => {
      const stepId = allSteps[index];
      
      if (promiseResult.status === 'fulfilled') {
        healthResults[stepId] = promiseResult.value.result;
      } else {
        // Handle promise rejection
        healthResults[stepId] = {
          status: 'error',
          message: `Health check promise failed: ${promiseResult.reason?.message || 'Unknown error'}`,
          duration: 0,
          correlationId: tebraDebugApi.generateCorrelationId()
        };
      }
    });

    return healthResults as Record<StepId, StepResult>;
  }, [checkStepHealth]);

  /**
   * Parse step-specific error messages
   */
  const parseStepError = useCallback((stepId: StepId, error: Error): string => {
    const baseMessage = tebraDebugApi.parseFirebaseError(error);
    
    switch (stepId) {
      case STEP_IDS.FRONTEND:
        return `Frontend application error: ${baseMessage}`;
      case STEP_IDS.FIREBASE_FUNCTIONS:
        return `Firebase Functions unavailable: ${baseMessage}`;
      case STEP_IDS.TEBRA_PROXY:
        return `Node.js → PHP connection failed: ${baseMessage}`;
      case STEP_IDS.CLOUD_RUN:
        return `Firebase → PHP proxy chain failed: ${baseMessage}`;
      case STEP_IDS.TEBRA_API:
        return `PHP → Tebra SOAP API failed: ${baseMessage}`;
      case STEP_IDS.DATA_TRANSFORM:
        return `Data transformation pipeline error: ${baseMessage}`;
      case STEP_IDS.DASHBOARD_UPDATE:
        return `Dashboard update system error: ${baseMessage}`;
      default:
        return baseMessage;
    }
  }, []);

  return { 
    checkStepHealth, 
    checkAllSteps,
    parseStepError 
  };
};