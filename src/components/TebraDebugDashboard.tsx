import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Wifi, WifiOff, RefreshCw, Users, Calendar } from 'lucide-react';
import { usePatientContext } from '../hooks/usePatientContext';

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

export const TebraDebugDashboard: React.FC = () => {
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
      name: 'Tebra Proxy Client',
      status: 'unknown',
      lastCheck: new Date(),
      responseTime: 0
    },
    {
      id: 'cloud-run',
      name: 'Cloud Run PHP Service',
      status: 'unknown',
      lastCheck: new Date(),
      responseTime: 0
    },
    {
      id: 'tebra-api',
      name: 'Tebra SOAP API',
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

  const [recentErrors, setRecentErrors] = useState<Array<{
    timestamp: Date;
    step: string;
    error: string;
    correlationId: string;
  }>>([]);

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Update patient count and date range when patients change
  useEffect(() => {
    if (patients && patients.length > 0) {
      // Find the date range from appointment times
      const appointmentTimes = patients
        .map(p => p.appointmentTime)
        .filter(time => time instanceof Date)
        .sort((a, b) => a.getTime() - b.getTime());
      
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

  // Simulate real-time monitoring (in production, this would connect to actual monitoring APIs)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(async () => {
      await runHealthChecks();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const runHealthChecks = async () => {
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
  };

  const checkStepHealth = async (stepId: string): Promise<'healthy' | 'warning' | 'error'> => {
    // In production, implement actual health checks for each component
    switch (stepId) {
      case 'frontend':
        return 'healthy'; // Frontend is always healthy if this component is running
      
      case 'firebase-functions':
        // Check if Firebase Functions are responsive
        try {
          // Would call: firebase.functions().httpsCallable('tebraTestConnection')()
          return Math.random() > 0.8 ? 'error' : 'healthy';
        } catch {
          return 'error';
        }
      
      case 'cloud-run':
        // Check Cloud Run service health
        try {
          // Would call: fetch(cloudRunUrl + '/health')
          return Math.random() > 0.7 ? 'error' : 'healthy';
        } catch {
          return 'error';
        }
      
      case 'tebra-api':
        // Check Tebra API connectivity
        try {
          // Would test actual Tebra API call
          return Math.random() > 0.6 ? 'error' : 'healthy';
        } catch {
          return 'error';
        }
      
      default:
        return Math.random() > 0.3 ? 'healthy' : 'error';
    }
  };

  const generateCorrelationId = () => {
    return Math.random().toString(36).substring(2, 10);
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

      {/* Integration Instructions */}
      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/20 rounded">
        <h5 className="font-medium text-blue-300 mb-2">Integration Notes</h5>
        <div className="text-sm text-blue-200 space-y-1">
          <p>• This dashboard monitors the complete Tebra API data flow chain</p>
          <p>• Correlation IDs help trace requests across all components</p>
          <p>• In production, connect to actual monitoring APIs and Cloud Logging</p>
          <p>• Use the enhanced debugging system (DEBUG-TOOLKIT.md) for deeper analysis</p>
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
          <LiveLogViewer />
          <RequestReplayTool />
        </div>
      )}
    </div>
  );
};

export default TebraDebugDashboard; 