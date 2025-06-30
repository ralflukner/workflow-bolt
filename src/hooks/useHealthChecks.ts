/**
 * Health Checks Hook - Production Safe Version
 * Encapsulates the logic for testing each step in the Tebra integration chain
 * NO useEffect - Pure functions only for production safety
 */

import { useCallback } from 'react';
import { STEP_IDS } from '../constants/tebraConfig';
import { tebraDebugApi, HealthCheckResult } from '../services/tebraDebugApi';

export type StepId = typeof STEP_IDS[keyof typeof STEP_IDS];
export type StepStatus = 'healthy' | 'warning' | 'error' | 'unknown';

export interface StepResult {
  status: StepStatus;
  message: string;
  duration: number;
  correlationId: string;
  details?: Record<string, unknown>;
}

export interface PatientData {
  appointmentTime?: string | Date;
  status: string;
  [key: string]: any;
}

export const useHealthChecks = () => {

  /**
   * Check the health of a specific integration step
   */
  const checkStepHealth = useCallback(async (stepId: StepId, patients: PatientData[] = []): Promise<StepResult> => {
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
          // Enhance with actual patient data context for comprehensive validation
          result.details = {
            ...result.details,
            patientCount: patients.length,
            hasPatients: patients.length > 0,
            // HIPAA-safe aggregated metrics
            hasScheduledAppointments: patients.some(p => p.appointmentTime),
            statusDistribution: patients.reduce((acc, p) => {
              acc[p.status] = (acc[p.status] || 0) + 1;
              return acc;
            }, {} as Record<string, number>),
            dateRange: patients.length > 0 ? {
              earliest: Math.min(...patients.map(p => new Date(p.appointmentTime || Date.now()).getTime())),
              latest: Math.max(...patients.map(p => new Date(p.appointmentTime || Date.now()).getTime())),
            } : null
          };
          
          // Validate dashboard can handle current patient load
          if (patients.length > 100) {
            result.status = 'warning';
            result.message = `Dashboard handling ${patients.length} patients - performance may be impacted`;
          } else if (patients.length === 0) {
            result.status = 'warning';
            result.message = 'No patients loaded - verify data sync is working';
          }
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
  const checkAllSteps = useCallback(async (patients: PatientData[] = []): Promise<Record<StepId, StepResult>> => {
    const allSteps = Object.values(STEP_IDS) as StepId[];
    
    // Run all health checks in parallel for better performance
    const results = await Promise.allSettled(
      allSteps.map(async (stepId) => ({
        stepId,
        result: await checkStepHealth(stepId, patients)
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
   * Parse step-specific error messages with enhanced categorization
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

  /**
   * Validate step dependencies - some steps depend on others
   */
  const validateStepDependencies = useCallback((): Record<StepId, boolean> => {
    const dependencies: Record<StepId, boolean> = {
      [STEP_IDS.FRONTEND]: true, // No dependencies
      [STEP_IDS.FIREBASE_FUNCTIONS]: true, // Independent
      [STEP_IDS.TEBRA_PROXY]: true, // Depends on Firebase Functions (checked internally)
      [STEP_IDS.CLOUD_RUN]: true, // Depends on Firebase Functions + Tebra Proxy
      [STEP_IDS.TEBRA_API]: true, // Depends on entire chain
      [STEP_IDS.DATA_TRANSFORM]: true, // Depends on Tebra API
      [STEP_IDS.DASHBOARD_UPDATE]: patients.length >= 0, // Depends on patient context
    };

    return dependencies;
  }, [patients.length]);

  /**
   * Get step criticality levels for prioritizing fixes
   */
  const getStepCriticality = useCallback((stepId: StepId): 'critical' | 'high' | 'medium' | 'low' => {
    switch (stepId) {
      case STEP_IDS.FRONTEND:
        return 'critical'; // Dashboard must work
      case STEP_IDS.FIREBASE_FUNCTIONS:
        return 'critical'; // Core infrastructure
      case STEP_IDS.TEBRA_PROXY:
        return 'high'; // Patient data access
      case STEP_IDS.TEBRA_API:
        return 'high'; // External system integration
      case STEP_IDS.CLOUD_RUN:
        return 'high'; // Service availability
      case STEP_IDS.DATA_TRANSFORM:
        return 'medium'; // Data processing
      case STEP_IDS.DASHBOARD_UPDATE:
        return 'medium'; // UI updates
      default:
        return 'low';
    }
  }, []);

  /**
   * Get recommended actions based on step status and patient context
   */
  const getStepRecommendations = useCallback((stepId: StepId, status: StepStatus): string[] => {
    const recommendations: string[] = [];
    const criticality = getStepCriticality(stepId);

    if (status === 'error') {
      if (criticality === 'critical') {
        recommendations.push('🚨 CRITICAL: Immediate attention required');
      }
      
      switch (stepId) {
        case STEP_IDS.FRONTEND:
          recommendations.push('Check browser console for JavaScript errors');
          recommendations.push('Verify React components are properly mounted');
          break;
        case STEP_IDS.FIREBASE_FUNCTIONS:
          recommendations.push('Check Firebase project billing status');
          recommendations.push('Verify function deployment and IAM permissions');
          break;
        case STEP_IDS.TEBRA_PROXY:
          recommendations.push('Check Auth0 token validity and refresh');
          recommendations.push('Verify Firebase Functions authentication');
          break;
        case STEP_IDS.TEBRA_API:
          recommendations.push('Check Tebra SOAP credentials and customer key');
          recommendations.push('Verify network connectivity to Tebra servers');
          break;
        case STEP_IDS.DASHBOARD_UPDATE:
          if (patients.length === 0) {
            recommendations.push('Check patient data sync - no patients loaded');
            recommendations.push('Verify Tebra schedule import is working');
          }
          break;
      }
    } else if (status === 'warning') {
      switch (stepId) {
        case STEP_IDS.DASHBOARD_UPDATE:
          if (patients.length > 100) {
            recommendations.push('Consider implementing pagination for better performance');
            recommendations.push('Monitor browser memory usage with large patient counts');
          }
          break;
      }
    }

    return recommendations;
  }, [patients.length, getStepCriticality]);

  return { 
    checkStepHealth, 
    checkAllSteps,
    parseStepError,
    validateStepDependencies,
    getStepCriticality,
    getStepRecommendations
  };
};