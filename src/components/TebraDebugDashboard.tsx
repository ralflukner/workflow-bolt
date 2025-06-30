/**
 * Tebra Debug Dashboard - Refactored Production Version
 * 
 * A clean, modular, production-ready dashboard for monitoring Tebra integration health.
 * Uses modern React patterns with proper separation of concerns.
 */

// @ts-nocheck
import React, { useState } from 'react';
import { Activity, RefreshCw, Users, Calendar, Settings, TrendingUp } from 'lucide-react';
import { useTebraDebugDashboard } from '../hooks/useTebraDebugDashboard';
import { MetricsCard, DataFlowStepCard, RecentErrorsPanel } from './TebraDebug';

export const TebraDebugDashboard: React.FC = () => {
  const {
    dataFlowSteps,
    metrics,
    recentErrors,
    isMonitoring,
    autoRefresh,
    phpDiagnostics,
    setAutoRefresh,
    runHealthChecks,
    runPhpProxyDiagnostics
  } = useTebraDebugDashboard();

  const [showAdvancedDiagnostics, setShowAdvancedDiagnostics] = useState(false);

  const formatSuccessRate = (rate: number): string => {
    if (rate === 100) return '100%';
    return `${rate.toFixed(1)}%`;
  };

  const formatLastSync = (date: Date | null): string => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    return date.toLocaleTimeString();
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-600 p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Tebra Integration Monitor</h3>
          {isMonitoring && <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />}
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2 rounded"
            />
            Auto Refresh (30s)
          </label>
          <button
            onClick={runHealthChecks}
            disabled={isMonitoring}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isMonitoring ? 'Checking...' : 'Check Now'}
          </button>
        </div>
      </div>

      {/* Patient Data Summary */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Users className="w-5 h-5 text-blue-400" />
            <div>
              <span className="text-white font-medium">Active Patients:</span>
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
                  'No scheduled appointments'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricsCard 
          value={formatSuccessRate(metrics.successRate)} 
          label="System Health" 
          variant={metrics.successRate >= 90 ? 'success' : metrics.successRate >= 70 ? 'warning' : 'error'}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <MetricsCard 
          value={`${metrics.averageResponseTime}ms`} 
          label="Avg Response Time" 
          variant={metrics.averageResponseTime < 2000 ? 'default' : 'warning'}
        />
        <MetricsCard 
          value={metrics.errorCount} 
          label="Active Errors" 
          variant={metrics.errorCount === 0 ? 'success' : 'error'}
        />
        <MetricsCard 
          value={formatLastSync(metrics.lastSuccessfulSync)} 
          label="Last Full Success" 
          variant="default"
        />
      </div>

      {/* System Health Status */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>Integration Chain Health</span>
        </h4>
        <div className="space-y-3">
          {dataFlowSteps.map(step => (
            <DataFlowStepCard key={step.id} step={step} />
          ))}
        </div>
      </div>

      {/* Recent Errors */}
      <div>
        <RecentErrorsPanel errors={recentErrors} />
      </div>

      {/* Advanced Diagnostics Section */}
      <div className="border-t border-gray-600 pt-6">
        <div className="flex justify-center">
          <button
            onClick={() => setShowAdvancedDiagnostics(!showAdvancedDiagnostics)}
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
                onClick={runPhpProxyDiagnostics}
                disabled={isMonitoring}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isMonitoring ? 'Analyzing...' : 'Run Deep Scan'}
              </button>
            </div>
            
            {phpDiagnostics && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-800 p-4 rounded border">
                    <div className="text-sm font-medium text-gray-300 mb-2">Node.js → PHP</div>
                    <div className={`text-lg font-bold ${
                      phpDiagnostics.nodeJsToPhp.status === 'healthy' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {phpDiagnostics.nodeJsToPhp.status}
                    </div>
                    {phpDiagnostics.nodeJsToPhp.details.error && (
                      <div className="text-xs text-red-300 mt-1">
                        {phpDiagnostics.nodeJsToPhp.details.error}
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded border">
                    <div className="text-sm font-medium text-gray-300 mb-2">PHP Service</div>
                    <div className={`text-lg font-bold ${
                      phpDiagnostics.phpHealth.status === 'healthy' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {phpDiagnostics.phpHealth.status}
                    </div>
                    {phpDiagnostics.phpHealth.details.error && (
                      <div className="text-xs text-red-300 mt-1">
                        {phpDiagnostics.phpHealth.details.error}
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded border">
                    <div className="text-sm font-medium text-gray-300 mb-2">PHP → Tebra</div>
                    <div className={`text-lg font-bold ${
                      phpDiagnostics.phpToTebra.status === 'healthy' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {phpDiagnostics.phpToTebra.status}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Providers: {phpDiagnostics.phpToTebra.details.providerCount || 0}
                    </div>
                  </div>
                </div>
                
                {phpDiagnostics.recommendations && phpDiagnostics.recommendations.length > 0 && (
                  <div className="bg-blue-900/20 border border-blue-500/20 p-4 rounded">
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
        )}
      </div>
    </div>
  );
};

export default TebraDebugDashboard;