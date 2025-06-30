/**
 * Tebra Debug Dashboard Hook
 * Manages all state and operations for the debug dashboard
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  DataFlowStep, 
  TebraMetrics, 
  RecentError, 
  PhpDiagnostics,
  STEP_IDS
} from '../constants/tebraDebug';
import { HEALTH_CHECK_CONFIG } from '../constants/tebraConfig';
import { useHealthChecks, StepId, StepResult } from './useHealthChecks';
import { usePatientContext } from '../contexts/PatientContext';
import { tebraDebugApi } from '../services/tebraDebugApi';

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
  const { patients } = usePatientContext();
  const { checkStepHealth, parseStepError } = useHealthChecks();
  
  const [dataFlowSteps, setDataFlowSteps] = useState<DataFlowStep[]>(initialSteps);
  const [metrics, setMetrics] = useState<TebraMetrics>(initialMetrics);
  const [recentErrors, setRecentErrors] = useState<RecentError[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [phpDiagnostics, setPhpDiagnostics] = useState<PhpDiagnostics | null>(null);

  // Update patient metrics when patients change
  useEffect(() => {
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
  }, [patients]);

  const addError = useCallback((step: string, error: string, correlationId: string) => {
    setRecentErrors(prev => [
      { timestamp: new Date(), step, error, correlationId },
      ...prev
    ].slice(0, HEALTH_CHECK_CONFIG.MAX_RECENT_ERRORS));
  }, []);

  const runHealthChecks = useCallback(async () => {
    setIsMonitoring(true);
    
    try {
      const updatedSteps = await Promise.all(
        dataFlowSteps.map(async (step) => {
          try {
            const result: StepResult = await checkStepHealth(step.id as StepId);
            
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
                  (connectionResult.value as any)?.data?.success ? 'healthy' : 'error',
          details: { 
            error: connectionResult.status === 'rejected' ? 
                   tebraDebugApi.parseFirebaseError(connectionResult.reason as Error) : null
          }
        },
        phpHealth: { 
          status: providersResult.status === 'fulfilled' && 
                  (providersResult.value as any)?.data?.success ? 'healthy' : 'error',
          details: { 
            error: providersResult.status === 'rejected' ? 
                   tebraDebugApi.parseFirebaseError(providersResult.reason as Error) : null
          }
        },
        phpToTebra: { 
          status: providersResult.status === 'fulfilled' && 
                  (providersResult.value as any)?.data?.success ? 'healthy' : 'error',
          details: { 
            providerCount: providersResult.status === 'fulfilled' ? 
                          (providersResult.value as any)?.data?.data?.length || 0 : 0
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

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(runHealthChecks, TEBRA_CONFIG.HEALTH_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [autoRefresh, runHealthChecks]);

  return {
    dataFlowSteps,
    metrics,
    recentErrors,
    isMonitoring,
    autoRefresh,
    phpDiagnostics,
    setAutoRefresh,
    runHealthChecks,
    runPhpProxyDiagnostics
  };
};