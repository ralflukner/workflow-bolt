/**
 * Tebra Debug Dashboard Hook - Production Safe Version
 * Manages all state and operations for the debug dashboard
 * NO useEffect - Pure functions and explicit triggers only
 */

import { useState, useCallback } from 'react';
import { 
  DataFlowStep, 
  TebraMetrics, 
  RecentError, 
  PhpDiagnostics,
  STEP_IDS
} from '../constants/tebraDebug';
import { HEALTH_CHECK_CONFIG } from '../constants/tebraConfig';
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

const initialSteps: DataFlowStep[] = [
  { id: STEP_IDS.FRONTEND, name: 'Frontend Dashboard', status: 'healthy', lastCheck: new Date(), responseTime: 0 },
  { id: STEP_IDS.FIREBASE_FUNCTIONS, name: 'Firebase Callable Functions', status: 'unknown', lastCheck: new Date(), responseTime: 0 },
  { id: STEP_IDS.TEBRA_PROXY, name: 'Node.js → PHP Proxy Connection', status: 'unknown', lastCheck: new Date(), responseTime: 0 },
  { id: STEP_IDS.CLOUD_RUN, name: 'Firebase → PHP Proxy Chain', status: 'unknown', lastCheck: new Date(), responseTime: 0 },
  { id: STEP_IDS.TEBRA_API, name: 'PHP → Tebra SOAP API', status: 'unknown', lastCheck: new Date(), responseTime: 0 },
  { id: STEP_IDS.DATA_TRANSFORM, name: 'Data Transformation', status: 'unknown', lastCheck: new Date(), responseTime: 0 },
  { id: STEP_IDS.DASHBOARD_UPDATE, name: 'Dashboard State Update', status: 'unknown', lastCheck: new Date(), responseTime: 0 }
];

const initialMetrics: TebraMetrics = {
  totalRequests: 0,
  successRate: 0,
  averageResponseTime: 0,
  errorCount: 0,
  lastSuccessfulSync: null,
  patientCount: 0,
  dateRange: { start: null, end: null }
};

export const useTebraDebugDashboard = () => {
  const [dataFlowSteps, setDataFlowSteps] = useState<DataFlowStep[]>(initialSteps);
  const [metrics, setMetrics] = useState<TebraMetrics>(initialMetrics);
  const [recentErrors, setRecentErrors] = useState<RecentError[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false); // Disabled by default - manual only
  const [phpDiagnostics, setPhpDiagnostics] = useState<PhpDiagnostics | null>(null);

  /**
   * Calculate patient metrics from patient data - called explicitly
   */
  const calculatePatientMetrics = useCallback((patients: PatientData[]) => {
    if (patients && patients.length > 0) {
      const appointmentTimes = patients
        .map((p: any) => p.appointmentTime)
        .filter((time: any) => time && !isNaN(new Date(time).getTime()))
        .map((time: any) => new Date(time))
        .sort((a: Date, b: Date) => a.getTime() - b.getTime());
      
      setMetrics(prev => ({
        ...prev,
        patientCount: patients.length,
        dateRange: {
          start: appointmentTimes[0] || null,
          end: appointmentTimes[appointmentTimes.length - 1] || null
        }
      }));
    }
  }, []);

  /**
   * Add error to recent errors list
   */
  const addError = useCallback((step: string, error: string, correlationId: string) => {
    setRecentErrors(prev => [
      { timestamp: new Date(), step, error, correlationId },
      ...prev
    ].slice(0, HEALTH_CHECK_CONFIG.MAX_RECENT_ERRORS));
  }, []);

  /**
   * Check health of a specific step - pure function
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
          // Enhance with patient data context
          result.details = {
            ...result.details,
            patientCount: patients.length,
            hasPatients: patients.length > 0,
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
          
          // Validate dashboard performance
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
      return {
        status: 'error',
        message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: 0,
        correlationId: tebraDebugApi.generateCorrelationId()
      };
    }
  }, []);

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

  /**
   * Run health checks for all steps - explicit trigger only
   */
  const runHealthChecks = useCallback(async (patients: PatientData[] = []) => {
    setIsMonitoring(true);
    
    try {
      const updatedSteps = await Promise.all(
        dataFlowSteps.map(async (step) => {
          try {
            const result: StepResult = await checkStepHealth(step.id as StepId, patients);
            
            if (result.status === 'error' && result.message) {
              addError(step.name, result.message, result.correlationId);
            }
            
            return { 
              ...step, 
              status: result.status, 
              lastCheck: new Date(), 
              responseTime: result.duration, 
              correlationId: result.correlationId,
              errorMessage: result.status === 'error' ? result.message : undefined
            };
          } catch (error) {
            const correlationId = tebraDebugApi.generateCorrelationId();
            const errorMsg = parseStepError(step.id as StepId, error as Error);
            addError(step.name, errorMsg, correlationId);
            
            return {
              ...step,
              status: 'error' as const,
              lastCheck: new Date(),
              responseTime: 0,
              errorMessage: errorMsg,
              correlationId
            };
          }
        })
      );

      setDataFlowSteps(updatedSteps);
      
      // Update aggregated metrics
      const healthySteps = updatedSteps.filter(s => s.status === 'healthy').length;
      const successRate = (healthySteps / updatedSteps.length) * 100;
      const avgResponseTime = Math.round(
        updatedSteps.reduce((sum, s) => sum + s.responseTime, 0) / updatedSteps.length
      );
      
      setMetrics(prev => ({
        ...prev,
        totalRequests: prev.totalRequests + 1,
        successRate,
        averageResponseTime: avgResponseTime,
        errorCount: updatedSteps.filter(s => s.status === 'error').length,
        lastSuccessfulSync: successRate === 100 ? new Date() : prev.lastSuccessfulSync
      }));
      
    } finally {
      setIsMonitoring(false);
    }
  }, [dataFlowSteps, checkStepHealth, parseStepError, addError]);

  /**
   * Run PHP proxy diagnostics - explicit trigger only
   */
  const runPhpProxyDiagnostics = useCallback(async () => {
    setIsMonitoring(true);
    try {
      const [connectionResult, providersResult] = await Promise.allSettled([
        tebraDebugApi.testTebraProxy(),
        tebraDebugApi.testTebraApi()
      ]);
      
      const diagnostics: PhpDiagnostics = {
        nodeJsToPhp: { 
          status: connectionResult.status === 'fulfilled' && 
                  connectionResult.value.status === 'healthy' ? 'healthy' : 'error',
          details: { 
            error: connectionResult.status === 'rejected' ? 
                   connectionResult.reason?.message : 
                   connectionResult.status === 'fulfilled' && connectionResult.value.status !== 'healthy' ?
                   connectionResult.value.message : null
          }
        },
        phpHealth: { 
          status: providersResult.status === 'fulfilled' && 
                  providersResult.value.status === 'healthy' ? 'healthy' : 'error',
          details: { 
            error: providersResult.status === 'rejected' ? 
                   providersResult.reason?.message :
                   providersResult.status === 'fulfilled' && providersResult.value.status !== 'healthy' ?
                   providersResult.value.message : null
          }
        },
        phpToTebra: { 
          status: providersResult.status === 'fulfilled' && 
                  providersResult.value.status === 'healthy' ? 'healthy' : 'error',
          details: { 
            providerCount: providersResult.status === 'fulfilled' && providersResult.value.details ?
                          (providersResult.value.details as any)?.providersSuccess ? 1 : 0 : 0
          }
        },
        recommendations: generateRecommendations(connectionResult, providersResult)
      };
      
      setPhpDiagnostics(diagnostics);
    } catch (error) {
      console.error('Diagnostics failed:', error);
    } finally {
      setIsMonitoring(false);
    }
  }, []);

  /**
   * Generate recommendations based on diagnostic results
   */
  const generateRecommendations = (connectionResult: any, providersResult: any): string[] => {
    const recommendations = [];
    
    if (connectionResult.status === 'rejected') {
      recommendations.push('Check Firebase Functions authentication and deployment');
    }
    if (providersResult.status === 'rejected') {
      recommendations.push('Check PHP → Tebra SOAP credentials and network access');
    }
    if (recommendations.length === 0) {
      recommendations.push('All systems operational');
    }
    
    return recommendations;
  };

  return {
    dataFlowSteps,
    metrics,
    recentErrors,
    isMonitoring,
    autoRefresh,
    phpDiagnostics,
    setAutoRefresh,
    runHealthChecks,
    runPhpProxyDiagnostics,
    calculatePatientMetrics
  };
};