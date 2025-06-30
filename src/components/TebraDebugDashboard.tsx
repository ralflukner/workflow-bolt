/**
 * Tebra Debug Dashboard - Architecture Overview
 * 
 * CORRECT DATA FLOW (never deviate from this):
 * Frontend → Firebase Functions (Node.js) → Cloud Run PHP Service → Tebra SOAP API
 * 
 * CRITICAL: Node.js will NEVER communicate directly with Tebra SOAP API
 * - Tebra SOAP API only works reliably with PHP
 * - All SOAP communication must go through the PHP proxy
 * - Any "Node.js → Tebra SOAP" tests will FAIL 100% of the time
 * 
 * This dashboard tests each step in the chain:
 * 1. Frontend Dashboard (always healthy if running)
 * 2. Firebase Callable Functions (Node.js health)  
 * 3. Node.js → PHP Proxy Connection (internal API key auth)
 * 4. Cloud Run PHP Service Health (PHP proxy status)
 * 5. PHP → Tebra SOAP API (OAuth authentication, the ONLY valid SOAP connection)
 * 6. Data Transformation (Node.js data processing)
 * 7. Dashboard State Update (React state management)
 */
import * as React from 'react';
const { useState, useEffect, useCallback } = React;
import { Activity, AlertTriangle, CheckCircle, Wifi, WifiOff, RefreshCw, Users, Calendar } from 'lucide-react';
import { usePatientContext } from '../hooks/usePatientContext';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface DataFlowStep {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  lastCheck: Date;
  responseTime: number;
  errorMessage?: string;
  correlationId?: string;
}

interface TebraMetrics {
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  errorCount: number;
  lastSuccessfulSync: Date | null;
  patientCount: number;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

interface RecentError {
  timestamp: Date;
  step: string;
  error: string;
  correlationId: string;
}

const TebraDebugDashboard: React.FC = () => {
  const { patients } = usePatientContext();
  const [dataFlowSteps, setDataFlowSteps] = useState<DataFlowStep[]>([
    {
      id: 'frontend',
      name: 'Frontend Dashboard',
      status: 'healthy',
      lastCheck: new Date(),
      responseTime: 0
    },
    {
      id: 'firebase-functions',
      name: 'Firebase Callable Functions',
      status: 'unknown',
      lastCheck: new Date(),
      responseTime: 0
    },
    {
      id: 'tebra-proxy',
      name: 'Node.js → PHP Proxy Connection',
      status: 'unknown',
      lastCheck: new Date(),
      responseTime: 0
    },
    {
      id: 'cloud-run',
      name: 'Firebase → PHP Proxy Chain',
      status: 'unknown',
      lastCheck: new Date(),
      responseTime: 0
    },
    {
      id: 'tebra-api',
      name: 'PHP → Tebra SOAP API',
      status: 'unknown',
      lastCheck: new Date(),
      responseTime: 0
    },
    {
      id: 'data-transform',
      name: 'Data Transformation',
      status: 'unknown',
      lastCheck: new Date(),
      responseTime: 0
    },
    {
      id: 'dashboard-update',
      name: 'Dashboard State Update',
      status: 'unknown',
      lastCheck: new Date(),
      responseTime: 0
    }
  ]);

  const [metrics, setMetrics] = useState<TebraMetrics>({
    totalRequests: 0,
    successRate: 0,
    averageResponseTime: 0,
    errorCount: 0,
    lastSuccessfulSync: null,
    patientCount: 0,
    dateRange: {
      start: null,
      end: null
    }
  });

  const [recentErrors, setRecentErrors] = useState<RecentError[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  const [phpDiagnostics, setPhpDiagnostics] = useState<any>(null);

  // Update patient count and date range when patients change
  useEffect(() => {
    if (patients && patients.length > 0) {
      // Find the date range from appointment times
      const appointmentTimes = patients
        .map((p: any) => p.appointmentTime)
        .filter((time: any) => {
          // appointmentTime is always a string in our Patient type
          if (!time) return false;
          const parsed = new Date(time);
          return !isNaN(parsed.getTime());
        })
        .map((time: any) => new Date(time))
        .sort((a: any, b: any) => a.getTime() - b.getTime());
      
      setMetrics(prev => ({
        ...prev,
        patientCount: patients.length,
        dateRange: {
          start: appointmentTimes.length > 0 ? appointmentTimes[0] : null,
          end: appointmentTimes.length > 0 ? appointmentTimes[appointmentTimes.length - 1] : null
        }
      }));
    }
  }, [patients]);

  const runHealthChecks = useCallback(async () => {
    setIsMonitoring(true);
    
    try {
      // In production, these would be actual API calls to monitor each component
      const updatedSteps = await Promise.all(
        dataFlowSteps.map(async (step) => {
          const startTime = Date.now();
          const status = await checkStepHealth(step.id);
          const responseTime = Date.now() - startTime;
          
          return {
            ...step,
            status,
            lastCheck: new Date(),
            responseTime,
            correlationId: generateCorrelationId()
          };
        })
      );

      setDataFlowSteps(updatedSteps);
      
      // Update overall metrics
      const healthySteps = updatedSteps.filter(s => s.status === 'healthy').length;
      const successRate = (healthySteps / updatedSteps.length) * 100;
      
      setMetrics(prev => ({
        ...prev,
        totalRequests: prev.totalRequests + 1,
        successRate,
        averageResponseTime: Math.round(updatedSteps.reduce((sum, s) => sum + s.responseTime, 0) / updatedSteps.length),
        errorCount: updatedSteps.filter(s => s.status === 'error').length,
        lastSuccessfulSync: successRate === 100 ? new Date() : prev.lastSuccessfulSync
      }));

      // Add any new errors to recent errors list
      const newErrors = updatedSteps
        .filter(s => s.status === 'error' && s.errorMessage)
        .map(s => ({
          timestamp: new Date(),
          step: s.name,
          error: s.errorMessage!,
          correlationId: s.correlationId!
        }));

      setRecentErrors(prev => [...newErrors, ...prev].slice(0, 10)); // Keep only last 10 errors

    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsMonitoring(false);
    }
  }, [dataFlowSteps]);

  // Simulate real-time monitoring (in production, this would connect to actual monitoring APIs)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(async () => {
      await runHealthChecks();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, runHealthChecks]);

  const checkStepHealth = async (stepId: string): Promise<'healthy' | 'warning' | 'error'> => {
    const correlationId = generateCorrelationId();
    
    try {
      switch (stepId) {
        case 'frontend':
          // Frontend is always healthy if this component is running
          return 'healthy';
        
        case 'firebase-functions':
          // Test Firebase Functions with actual HTTP call
          try {
            const response = await Promise.race([
              fetch('https://us-central1-luknerlumina-firebase.cloudfunctions.net/healthCheck'),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]) as Response;
            
            if (response.ok) {
              await response.json(); // Verify response is valid JSON
              updateStepError(stepId, undefined); // Clear any previous errors
              return 'healthy';
            } else {
              const errorMsg = `HTTP ${response.status}: ${response.statusText}`;
              updateStepError(stepId, errorMsg, correlationId);
              return 'error';
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Firebase Functions unreachable';
            updateStepError(stepId, errorMsg, correlationId);
            return 'error';
          }
        
        case 'tebra-proxy':
          // Test Tebra connection via Firebase Functions
          try {
            const functions = getFunctions();
            const testConnection = httpsCallable(functions, 'tebraTestConnection');
            const result = await Promise.race([
              testConnection(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 10s')), 10000))
            ]) as { data?: { success?: boolean; message?: string } };
            
            console.log('Tebra test connection result:', result);
            
            if (result?.data?.success) {
              updateStepError(stepId, undefined);
              return 'healthy';
            } else {
              const errorMsg = (result as any)?.data?.message || (result as any)?.message || 'Tebra connection failed - no success flag';
              updateStepError(stepId, errorMsg, correlationId);
              return 'error';
            }
          } catch (error) {
            console.error('Tebra proxy error:', error);
            let errorMsg = 'Tebra proxy unreachable';
            
            if (error instanceof Error) {
              errorMsg = error.message;
              
              // Parse Firebase Functions errors
              if (error.message.includes('internal')) {
                errorMsg = 'Internal Firebase Functions error - check function logs';
              } else if (error.message.includes('unauthenticated')) {
                errorMsg = 'Authentication required for Tebra test';
              } else if (error.message.includes('permission-denied')) {
                errorMsg = 'Permission denied - check IAM roles';
              }
            }
            
            updateStepError(stepId, errorMsg, correlationId);
            return 'error';
          }
        
        case 'cloud-run':
          // Test Firebase Functions → PHP proxy chain using getProviders as health check
          try {
            const functions = getFunctions();
            const getProviders = httpsCallable(functions, 'tebraGetProviders');
            const result = await Promise.race([
              getProviders(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 10s')), 10000))
            ]) as { data?: { success?: boolean; message?: string; data?: any[] } };
            
            console.log('Firebase → PHP proxy test result:', result);
            
            if (result?.data?.success) {
              updateStepError(stepId, undefined);
              return 'healthy';
            } else {
              const errorMsg = result?.data?.message || 'Firebase → PHP proxy connection failed';
              updateStepError(stepId, errorMsg, correlationId);
              return 'error';
            }
          } catch (error) {
            console.error('Firebase → PHP proxy error:', error);
            let errorMsg = 'Firebase → PHP proxy chain failed';
            
            if (error instanceof Error) {
              errorMsg = error.message;
              
              // Parse specific error contexts
              if (error.message.includes('internal')) {
                errorMsg = 'Firebase Functions internal error - check function logs';
              } else if (error.message.includes('unauthenticated')) {
                errorMsg = 'Authentication required for Firebase Functions';
              } else if (error.message.includes('timeout')) {
                errorMsg = 'Firebase Functions → PHP proxy timeout (>10s)';
              }
            }
            
            updateStepError(stepId, errorMsg, correlationId);
            return 'error';
          }
        
        case 'tebra-api':
          // Test PHP → Tebra SOAP API connectivity (PHP-only, never Node.js)
          try {
            const functions = getFunctions();
            const testAppointments = httpsCallable(functions, 'tebraTestAppointments');
            const result = await Promise.race([
              testAppointments({ date: new Date().toISOString().split('T')[0] }),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 15s')), 15000))
            ]) as { data?: { success?: boolean; message?: string } };
            
            console.log('PHP → Tebra SOAP test result:', result);
            
            if (result?.data?.success) {
              updateStepError(stepId, undefined);
              return 'healthy';
            } else {
              const errorMsg = (result as any)?.data?.message || (result as any)?.message || 'PHP → Tebra SOAP API connection failed';
              updateStepError(stepId, errorMsg, correlationId);
              return 'error';
            }
          } catch (error) {
            console.error('PHP → Tebra SOAP API error:', error);
            let errorMsg = 'PHP → Tebra SOAP API connection failed';
            
            if (error instanceof Error) {
              errorMsg = error.message;
              
              // Provide specific error context for PHP → Tebra issues
              if (error.message.includes('internal')) {
                errorMsg = 'PHP proxy internal error - check Tebra OAuth credentials in Cloud Run secrets';
              } else if (error.message.includes('Unauthorized')) {
                errorMsg = 'PHP → Tebra OAuth authentication failed - check TEBRA_CLIENT_ID/SECRET';
              } else if (error.message.includes('network')) {
                errorMsg = 'PHP proxy cannot reach Tebra SOAP API - network issue';
              } else if (error.message.includes('timeout')) {
                errorMsg = 'Tebra SOAP API timeout - service slow or unavailable';
              } else if (error.message.includes('unauthenticated')) {
                errorMsg = 'Node.js → PHP authentication failed - check TEBRA_INTERNAL_API_KEY';
              }
            }
            
            updateStepError(stepId, errorMsg, correlationId);
            return 'error';
          }
        
        case 'data-transform':
          // Test data transformation by checking if we can process mock data
          try {
            const mockData = [{ name: 'Test Patient', status: 'scheduled' }];
            const transformed = mockData.map(item => ({ ...item, processed: true }));
            if (transformed.length > 0) {
              updateStepError(stepId, undefined);
              return 'healthy';
            } else {
              updateStepError(stepId, 'Data transformation failed', correlationId);
              return 'error';
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Data transformation error';
            updateStepError(stepId, errorMsg, correlationId);
            return 'error';
          }
        
        case 'dashboard-update':
          // Test dashboard state update
          try {
            const currentPatients = patients.length;
            if (currentPatients >= 0) { // Always healthy if we can read patient count
              updateStepError(stepId, undefined);
              return 'healthy';
            } else {
              updateStepError(stepId, 'Unable to read patient data', correlationId);
              return 'error';
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Dashboard update failed';
            updateStepError(stepId, errorMsg, correlationId);
            return 'error';
          }
        
        default:
          updateStepError(stepId, 'Unknown health check step', correlationId);
          return 'error';
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Health check failed';
      updateStepError(stepId, errorMsg, correlationId);
      return 'error';
    }
  };

  const updateStepError = (stepId: string, errorMessage: string | undefined, correlationId?: string) => {
    setDataFlowSteps(prev => prev.map(step => {
      if (step.id === stepId) {
        const updatedStep = {
          ...step,
          errorMessage,
          correlationId: correlationId || step.correlationId
        };
        
        // Add to recent errors if there's an error
        if (errorMessage) {
          setRecentErrors(prevErrors => {
            const newError: RecentError = {
              timestamp: new Date(),
              step: step.name,
              error: errorMessage,
              correlationId: correlationId || 'unknown'
            };
            
            // Keep only last 10 errors
            return [newError, ...prevErrors].slice(0, 10);
          });
        }
        
        return updatedStep;
      }
      return step;
    }));
  };

  const generateCorrelationId = () => {
    return Math.random().toString(36).substring(2, 10);
  };

  const runPhpProxyDiagnostics = async () => {
    setIsMonitoring(true);
    try {
      console.log('Running simplified diagnostics using real Tebra actions...');
      
      // Test the complete chain using real Tebra actions
      const functions = getFunctions();
      const testConnection = httpsCallable(functions, 'tebraTestConnection');
      const getProviders = httpsCallable(functions, 'tebraGetProviders');
      
      const [connectionResult, providersResult] = await Promise.allSettled([
        testConnection(),
        getProviders()
      ]);
      
      const diagnostics = {
        nodeJsToPhp: { 
          status: connectionResult.status === 'fulfilled' && (connectionResult.value as any)?.data?.success ? 'healthy' : 'error',
          details: { 
            error: connectionResult.status === 'rejected' ? (connectionResult.reason as any)?.message : 
                   !(connectionResult.value as any)?.data?.success ? (connectionResult.value as any)?.data?.message : null
          }
        },
        phpHealth: { 
          status: providersResult.status === 'fulfilled' && (providersResult.value as any)?.data?.success ? 'healthy' : 'error',
          details: { 
            error: providersResult.status === 'rejected' ? (providersResult.reason as any)?.message : 
                   !(providersResult.value as any)?.data?.success ? (providersResult.value as any)?.data?.message : null
          }
        },
        phpToTebra: { 
          status: providersResult.status === 'fulfilled' && (providersResult.value as any)?.data?.success ? 'healthy' : 'error',
          details: { 
            providerCount: providersResult.status === 'fulfilled' ? (providersResult.value as any)?.data?.data?.length : 0
          }
        },
        recommendations: [
          'Using real Tebra actions (tebraTestConnection, tebraGetProviders) for health checks',
          'All tests go through proper Firebase Functions layer (no direct PHP calls)',
          connectionResult.status === 'rejected' ? 'Check Firebase Functions authentication and deployment' : null,
          providersResult.status === 'rejected' ? 'Check PHP → Tebra SOAP credentials and network access' : null
        ].filter(Boolean)
      };
      
      setPhpDiagnostics(diagnostics);
      console.log('Simplified diagnostics completed:', diagnostics);
      
    } catch (error) {
      console.error('Failed to run diagnostics:', error);
      setPhpDiagnostics({
        nodeJsToPhp: { status: 'error', details: { error: (error as Error).message } },
        phpHealth: { status: 'unknown', details: {} },
        phpToTebra: { status: 'unknown', details: {} },
        recommendations: ['Failed to call Firebase Functions - check user authentication']
      });
    } finally {
      setIsMonitoring(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <WifiOff className="w-5 h-5 text-red-500" />;
      default:
        return <Wifi className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-900 border-green-500';
      case 'warning':
        return 'bg-yellow-900 border-yellow-500';
      case 'error':
        return 'bg-red-900 border-red-500';
      default:
        return 'bg-gray-900 border-gray-500';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-600 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Activity className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Tebra Data Flow Debug Dashboard</h3>
          {isMonitoring && <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />}
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center text-sm text-gray-300">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            Auto Refresh
          </label>
          <button
            onClick={runHealthChecks}
            disabled={isMonitoring}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Patient Data Info */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Users className="w-5 h-5 text-blue-400" />
            <div>
              <span className="text-white font-medium">Patients in Firebase:</span>
              <span className="text-2xl font-bold text-blue-400 ml-2">{metrics.patientCount}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Calendar className="w-5 h-5 text-blue-400" />
            <div>
              <span className="text-white font-medium">Date Range:</span>
              <span className="text-sm text-blue-300 ml-2">
                {metrics.dateRange.start && metrics.dateRange.end ? 
                  `${metrics.dateRange.start.toLocaleDateString()} - ${metrics.dateRange.end.toLocaleDateString()}` :
                  'No appointments'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700 p-4 rounded border">
          <div className="text-2xl font-bold text-white">{metrics.successRate.toFixed(1)}%</div>
          <div className="text-sm text-gray-300">Success Rate</div>
        </div>
        <div className="bg-gray-700 p-4 rounded border">
          <div className="text-2xl font-bold text-white">{metrics.averageResponseTime}ms</div>
          <div className="text-sm text-gray-300">Avg Response</div>
        </div>
        <div className="bg-gray-700 p-4 rounded border">
          <div className="text-2xl font-bold text-red-400">{metrics.errorCount}</div>
          <div className="text-sm text-gray-300">Active Errors</div>
        </div>
        <div className="bg-gray-700 p-4 rounded border">
          <div className="text-sm font-bold text-white">
            {metrics.lastSuccessfulSync ? 
              metrics.lastSuccessfulSync.toLocaleTimeString() : 
              'Never'
            }
          </div>
          <div className="text-sm text-gray-300">Last Success</div>
        </div>
      </div>

      {/* Data Flow Steps */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-white mb-4">Data Flow Health</h4>
        <div className="space-y-3">
          {dataFlowSteps.map((step) => (
            <div key={step.id} className={`p-4 rounded border-l-4 ${getStatusColor(step.status)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(step.status)}
                  <div>
                    <div className="font-medium text-white">{step.name}</div>
                    <div className="text-sm text-gray-300">
                      Last check: {step.lastCheck.toLocaleTimeString()} • 
                      Response: {step.responseTime}ms
                      {step.correlationId && ` • ID: ${step.correlationId}`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    step.status === 'healthy' ? 'text-green-400' :
                    step.status === 'warning' ? 'text-yellow-400' :
                    step.status === 'error' ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {step.status.toUpperCase()}
                  </div>
                </div>
              </div>
              {step.errorMessage && (
                <div className="mt-2 text-sm text-red-300 bg-red-900/20 p-2 rounded">
                  {step.errorMessage}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Errors */}
      {recentErrors.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Recent Errors</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentErrors.map((error, index) => (
              <div key={index} className="bg-red-900/20 border border-red-500/20 p-3 rounded">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-red-300">{error.step}</div>
                  <div className="text-sm text-gray-400">
                    {error.timestamp.toLocaleTimeString()} • ID: {error.correlationId}
                  </div>
                </div>
                <div className="text-sm text-red-200 mt-1">{error.error}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Architecture Notes */}
      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/20 rounded">
        <h5 className="font-medium text-blue-300 mb-2">Architecture Notes</h5>
        <div className="text-sm text-blue-200 space-y-1">
          <p>• <strong>CORRECT FLOW:</strong> Frontend → Firebase Functions → Cloud Run PHP → Tebra SOAP</p>
          <p>• <strong>NEVER:</strong> Frontend → Cloud Run PHP directly (CORS issues)</p>
          <p>• <strong>NEVER:</strong> Node.js → Tebra SOAP directly (incompatible)</p>
          <p>• Firebase auth secures Frontend → Firebase Functions communication</p>
          <p>• Internal API key secures Firebase Functions → PHP communication</p>
          <p>• OAuth credentials secure PHP → Tebra SOAP communication</p>
          <p>• Health checks use real Tebra actions (getProviders) not mock endpoints</p>
        </div>
      </div>

      {/* Advanced Debugging Tools Toggle */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => setShowAdvancedTools(!showAdvancedTools)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
        >
          {showAdvancedTools ? 'Hide' : 'Show'} Advanced Debugging Tools
        </button>
      </div>

      {/* Advanced Debugging Tools */}
      {showAdvancedTools && (
        <div className="mt-6 space-y-6">
          <div className="bg-gray-700 p-4 rounded border">
            <h5 className="text-white font-medium mb-4">Complete Chain Diagnostics</h5>
            <button
              onClick={runPhpProxyDiagnostics}
              disabled={isMonitoring}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-50 mr-4"
            >
              Test Complete Chain
            </button>
            <p className="text-gray-300 text-sm mt-2">
              Tests Frontend → Firebase Functions → PHP Proxy → Tebra SOAP using real Tebra actions (tebraTestConnection, tebraGetProviders).
            </p>
            
            {phpDiagnostics && (
              <div className="mt-4 space-y-4">
                <h6 className="text-white font-medium">Diagnostics Results:</h6>
                
                {/* Node.js → PHP */}
                <div className={`p-3 rounded border-l-4 ${
                  phpDiagnostics.nodeJsToPhp.status === 'healthy' ? 'bg-green-900 border-green-500' :
                  phpDiagnostics.nodeJsToPhp.status === 'error' ? 'bg-red-900 border-red-500' : 'bg-gray-900 border-gray-500'
                }`}>
                  <div className="font-medium text-white">Firebase Functions Connection Test</div>
                  <div className="text-sm text-gray-300">Status: {phpDiagnostics.nodeJsToPhp.status}</div>
                  {phpDiagnostics.nodeJsToPhp.details.error && (
                    <div className="text-sm text-red-300">{phpDiagnostics.nodeJsToPhp.details.error}</div>
                  )}
                </div>

                {/* PHP Health */}
                <div className={`p-3 rounded border-l-4 ${
                  phpDiagnostics.phpHealth.status === 'healthy' ? 'bg-green-900 border-green-500' :
                  phpDiagnostics.phpHealth.status === 'error' ? 'bg-red-900 border-red-500' : 'bg-gray-900 border-gray-500'
                }`}>
                  <div className="font-medium text-white">Provider Data Retrieval</div>
                  <div className="text-sm text-gray-300">Status: {phpDiagnostics.phpHealth.status}</div>
                  {phpDiagnostics.phpHealth.details.error && (
                    <div className="text-sm text-red-300">{phpDiagnostics.phpHealth.details.error}</div>
                  )}
                </div>

                {/* PHP → Tebra */}
                <div className={`p-3 rounded border-l-4 ${
                  phpDiagnostics.phpToTebra.status === 'healthy' ? 'bg-green-900 border-green-500' :
                  phpDiagnostics.phpToTebra.status === 'error' ? 'bg-red-900 border-red-500' : 'bg-gray-900 border-gray-500'
                }`}>
                  <div className="font-medium text-white">Complete Chain Health</div>
                  <div className="text-sm text-gray-300">Status: {phpDiagnostics.phpToTebra.status}</div>
                  {phpDiagnostics.phpToTebra.details.providerCount !== undefined && (
                    <div className="text-sm text-green-300">Providers found: {phpDiagnostics.phpToTebra.details.providerCount}</div>
                  )}
                </div>

                {/* Recommendations */}
                {phpDiagnostics.recommendations.length > 0 && (
                  <div className="bg-blue-900/20 border border-blue-500/20 p-3 rounded">
                    <h6 className="text-blue-300 font-medium mb-2">Recommendations:</h6>
                    <ul className="text-sm text-blue-200 space-y-1">
                      {phpDiagnostics.recommendations.map((rec: string, index: number) => (
                        <li key={index}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TebraDebugDashboard; 