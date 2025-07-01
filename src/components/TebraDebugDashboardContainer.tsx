import React, { Component } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { PatientContext } from '@/context/PatientContextDef';
import { PatientContextType } from '@/context/PatientContextType';
import { tebraDebugApi } from '@/services/tebraDebugApi';
import { tebraApiService } from '@/services/tebraApiService';
import { DataFlowStep, TebraMetrics, STEP_IDS, StepStatus } from '@/constants/tebraDebug';
import { MetricsCard } from './TebraDebug/MetricsCard';
import { DataFlowStepCard } from './TebraDebug/DataFlowStepCard';

interface State {
  dataFlowSteps: DataFlowStep[];
  metrics: TebraMetrics;
  recentErrors: { timestamp: Date; step: string; error: string; correlationId: string }[];
  autoRefresh: boolean;
  isMonitoring: boolean;
  showAdvancedDiagnostics: boolean;
}

export default class TebraDebugDashboardContainer extends Component<Record<string, never>, State> {
  static contextType = PatientContext as React.Context<PatientContextType | undefined>;
  declare context: PatientContextType;

  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  constructor(props: Record<string, never>) {
    super(props);

    this.state = {
      dataFlowSteps: [
        { id: STEP_IDS.FRONTEND, name: 'Frontend Dashboard', status: 'healthy', lastCheck: new Date(), responseTime: 0 },
        { id: STEP_IDS.FIREBASE_FUNCTIONS, name: 'Firebase Callable Functions', status: 'warning', lastCheck: new Date(), responseTime: 0 },
        { id: STEP_IDS.TEBRA_PROXY, name: 'Node.js → PHP Proxy', status: 'warning', lastCheck: new Date(), responseTime: 0 },
        { id: STEP_IDS.CLOUD_RUN, name: 'Firebase → PHP Proxy', status: 'warning', lastCheck: new Date(), responseTime: 0 },
        { id: STEP_IDS.TEBRA_API, name: 'PHP → Tebra SOAP', status: 'warning', lastCheck: new Date(), responseTime: 0 },
        { id: STEP_IDS.DATA_TRANSFORM, name: 'Data Transformation', status: 'warning', lastCheck: new Date(), responseTime: 0 },
        { id: STEP_IDS.DASHBOARD_UPDATE, name: 'Dashboard State Update', status: 'warning', lastCheck: new Date(), responseTime: 0 }
      ],
      metrics: {
        totalRequests: 0,
        successRate: 0,
        averageResponseTime: 0,
        errorCount: 0,
        lastSuccessfulSync: null,
        patientCount: 0,
        dateRange: { start: null, end: null }
      },
      recentErrors: [],
      autoRefresh: true,
      isMonitoring: false,
      showAdvancedDiagnostics: false
    };
  }

  componentDidMount() {
    if (this.state.autoRefresh) {
      this.startInterval();
    }
  }

  componentWillUnmount() {
    this.clearInterval();
  }

  componentDidUpdate(_: {}, prevState: State) {
    if (prevState.autoRefresh !== this.state.autoRefresh) {
      if (this.state.autoRefresh) this.startInterval();
      else this.clearInterval();
    }
  }

  startInterval() {
    this.refreshInterval = setInterval(() => this.runHealthChecks(), 30000); // 30-sec
  }

  clearInterval() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  generateCorrelationId = () => Math.random().toString(36).substring(2, 10);

  addError(step: string, error: string, correlationId: string) {
    this.setState(({ recentErrors }) => ({
      recentErrors: [{ timestamp: new Date(), step, error, correlationId }, ...recentErrors].slice(0, 10)
    }));
  }

  async runHealthChecks() {
    if (this.state.isMonitoring) return;
    this.setState({ isMonitoring: true });

    const patients = this.context?.patients ?? [];

    const updatedSteps = await Promise.all(
      this.state.dataFlowSteps.map(async (step) => {
        const start = Date.now();
        let status: StepStatus = 'unknown';
        let errorMessage: string | undefined;
        try {
          // Real health checks using tebraDebugApi service
          switch (step.id) {
            case STEP_IDS.FRONTEND: {
              const frontendResult = await tebraDebugApi.testFrontendHealth();
              status = frontendResult.status;
              if (frontendResult.status !== 'healthy') {
                errorMessage = frontendResult.message;
              }
              break;
            }
            case STEP_IDS.FIREBASE_FUNCTIONS: {
              const functionsResult = await tebraDebugApi.testFirebaseFunctions();
              status = functionsResult.status;
              if (functionsResult.status !== 'healthy') {
                errorMessage = functionsResult.message;
              }
              break;
            }
            case STEP_IDS.TEBRA_PROXY: {
              const proxyResult = await tebraDebugApi.testTebraProxy();
              status = proxyResult.status;
              if (proxyResult.status !== 'healthy') {
                errorMessage = proxyResult.message;
              }
              break;
            }
            case STEP_IDS.CLOUD_RUN:
            case STEP_IDS.TEBRA_API: {
              const apiResult = await tebraDebugApi.testTebraApi();
              status = apiResult.status;
              if (apiResult.status !== 'healthy') {
                errorMessage = apiResult.message;
              }
              break;
            }
            case STEP_IDS.DATA_TRANSFORM: {
              const transformResult = await tebraDebugApi.testDataTransform();
              status = transformResult.status;
              if (transformResult.status !== 'healthy') {
                errorMessage = transformResult.message;
              }
              break;
            }
            case STEP_IDS.DASHBOARD_UPDATE: {
              const dashboardResult = await tebraDebugApi.testDashboardUpdate();
              status = dashboardResult.status;
              // Add patient context validation
              if (patients.length > 100) {
                status = 'warning';
                errorMessage = `Dashboard handling ${patients.length} patients - performance may be impacted`;
              } else if (patients.length === 0) {
                status = 'warning';
                errorMessage = 'No patients loaded - verify data sync is working';
              }
              break;
            }
            default: {
              status = 'error';
              errorMessage = `Unknown step ID: ${step.id}`;
            }
          }
        } catch (e) {
          status = 'error';
          errorMessage = (e as Error).message;
          this.addError(step.name, errorMessage, this.generateCorrelationId());
        }
        return { ...step, status, responseTime: Date.now() - start, lastCheck: new Date(), errorMessage };
      })
    );

    const healthy = updatedSteps.filter(s => s.status === 'healthy').length;
    const successRate = (healthy / updatedSteps.length) * 100;

    this.setState(({ metrics }) => ({
      dataFlowSteps: updatedSteps,
      metrics: {
        ...metrics,
        totalRequests: metrics.totalRequests + 1,
        successRate,
        averageResponseTime: Math.round(updatedSteps.reduce((a, b) => a + b.responseTime, 0) / updatedSteps.length),
        errorCount: updatedSteps.filter(s => s.status === 'error').length,
        lastSuccessfulSync: successRate === 100 ? new Date() : metrics.lastSuccessfulSync,
        patientCount: patients.length
      },
      isMonitoring: false
    }));
  }

  runPhpProxyDiagnostics = async () => {
    if (this.state.isMonitoring) return;
    this.setState({ isMonitoring: true });

    try {
      const result = await tebraApiService.debugPhpProxy();
      console.log('PHP proxy diagnostics completed:', result);
      // You could update state with diagnostics results here
    } catch (error) {
      console.error('PHP proxy diagnostics failed:', error);
      this.addError('PHP Diagnostics', error instanceof Error ? error.message : 'Unknown error', this.generateCorrelationId());
    } finally {
      this.setState({ isMonitoring: false });
    }
  };

  render() {
    const { dataFlowSteps, metrics, recentErrors, autoRefresh, isMonitoring, showAdvancedDiagnostics } = this.state;
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-600 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">Tebra Integration Status</h3>
            {isMonitoring && <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />}
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center text-sm text-gray-300">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={() => this.setState({ autoRefresh: !autoRefresh })}
                className="mr-2"
              />
              Auto Refresh
            </label>
            <button
              onClick={() => this.runHealthChecks()}
              disabled={isMonitoring}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50"
            >
              Refresh Now
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricsCard value={`${metrics.successRate.toFixed(1)}%`} label="Success Rate" />
          <MetricsCard value={`${metrics.averageResponseTime}ms`} label="Avg Response" />
          <MetricsCard value={metrics.errorCount} label="Active Errors" variant="error" />
          <MetricsCard value={metrics.lastSuccessfulSync?.toLocaleTimeString() || 'Never'} label="Last Success" />
        </div>

        {/* Data-flow Steps */}
        <div className="space-y-3 mb-6">
          {dataFlowSteps.map((s) => <DataFlowStepCard key={s.id} step={s} />)}
        </div>

        {/* Recent errors */}
        {recentErrors.length > 0 && (
          <div className="mb-6 max-h-64 overflow-y-auto space-y-2">
            {recentErrors.map((err, idx) => (
              <div key={idx} className="bg-red-900/20 border border-red-500/20 p-3 rounded text-sm text-red-200">
                {err.timestamp.toLocaleTimeString()} • {err.step}: {err.error}
              </div>
            ))}
          </div>
        )}

        {/* Advanced Diagnostics Section */}
        <div className="border-t border-gray-600 pt-6">
          <div className="flex justify-center">
            <button
              onClick={() => this.setState({ showAdvancedDiagnostics: !showAdvancedDiagnostics })}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
            >
              {showAdvancedDiagnostics ? 'Hide' : 'Show'} Advanced Diagnostics
            </button>
          </div>

          {showAdvancedDiagnostics && (
            <div className="mt-6 bg-gray-700/50 p-6 rounded-lg border border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-white font-medium">Deep System Analysis</h5>
                <button
                  onClick={this.runPhpProxyDiagnostics}
                  disabled={isMonitoring}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isMonitoring ? 'Analyzing...' : 'Run Deep Scan'}
                </button>
              </div>
              <div className="text-sm text-gray-300">
                Performs comprehensive PHP proxy diagnostics including Node.js to PHP communication, 
                PHP health checks, and PHP to Tebra API connectivity tests.
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
} 