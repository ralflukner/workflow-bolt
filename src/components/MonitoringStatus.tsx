import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Clock, Wifi, Activity, ExternalLink, AlertCircle } from 'lucide-react';
import { tebraTestConnection } from '../services/tebraApi';

interface MonitoringStatusProps {
  className?: string;
}

interface ServiceStatus {
  proxy: 'healthy' | 'error' | 'warning' | 'unknown';
  lastCheck: string;
  latency?: number;
  errors?: number;
  responseTime?: number;
  errorDetails?: {
    type: 'connection' | 'authentication' | 'tebra_service' | 'internal_service_fault' | 'unknown';
    message: string;
    timestamp: string;
    correlationId?: string;
  };
  performanceMetrics?: {
    soapDuration?: number;
    totalDuration?: number;
    cacheHit?: boolean;
  };
}

const MonitoringStatus: React.FC<MonitoringStatusProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<ServiceStatus>({
    proxy: 'unknown',
    lastCheck: 'Never',
    latency: 0,
    errors: 0,
    responseTime: 0
  });
  const [isExpanded, setIsExpanded] = useState(false);

  const checkProxyHealth = useCallback(async () => {
    try {
      const startTime = performance.now();
      
      // Call Firebase Function and capture detailed response
      const result = await tebraTestConnection();
      
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      if (result.success) {
        // Determine status based on response time thresholds (adjusted for rate limiting)
        let proxyState: 'healthy' | 'warning' = 'healthy';
        if (responseTime > 5000) {
          proxyState = 'warning'; // Exceptionally slow - likely an issue
        } else if (responseTime > 3500) {
          proxyState = 'warning'; // Slow due to rate limiting or load
        }
        // Note: 2000-3500ms is normal for rate-limited Tebra API
        
        setStatus({
          proxy: proxyState,
          lastCheck: new Date().toLocaleTimeString(),
          responseTime,
          latency: responseTime,
          errors: 0,
          performanceMetrics: result.performanceMetrics ? {
            soapDuration: result.performanceMetrics.soap_duration_ms,
            totalDuration: result.performanceMetrics.total_duration_ms,
            cacheHit: 'cacheHit' in result.performanceMetrics ? (result.performanceMetrics as { cacheHit: boolean }).cacheHit : undefined
          } : undefined,
          errorDetails: undefined // Clear any previous errors
        });
      } else {
        // More detailed error information
        setStatus({
          proxy: 'error',
          lastCheck: new Date().toLocaleTimeString(),
          responseTime,
          errors: 1,
          errorDetails: {
            type: parseErrorType(result.message || 'Unknown error'),
            message: result.message || 'Connection test failed',
            timestamp: result.timestamp || new Date().toISOString(),
            correlationId: result.correlationId
          }
        });
      }
    } catch (error) {
      console.error('Proxy health check failed:', error);
      
      // Parse error from JavaScript error object
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorType = parseErrorType(errorMessage);
      
      setStatus({
        proxy: 'error',
        lastCheck: new Date().toLocaleTimeString(),
        errors: 1,
        errorDetails: {
          type: errorType,
          message: errorMessage,
          timestamp: new Date().toISOString()
        }
      });
    }
  }, []);

  const parseErrorType = (errorMessage: string): 'connection' | 'authentication' | 'tebra_service' | 'internal_service_fault' | 'unknown' => {
    const message = errorMessage.toLowerCase();
    
    if (message.includes('internalservicefault')) {
      return 'internal_service_fault';
    } else if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'authentication';
    } else if (message.includes('tebra') || message.includes('soap')) {
      return 'tebra_service';
    } else if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
      return 'connection';
    }
    
    return 'unknown';
  };

  useEffect(() => {
    // Initial check
    checkProxyHealth();
    
    // Check every 2 minutes for better responsiveness
    const interval = setInterval(checkProxyHealth, 120000);
    
    return () => clearInterval(interval);
  }, [checkProxyHealth]);

  const getStatusIcon = () => {
    switch (status.proxy) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status.proxy) {
      case 'healthy':
        return 'border-green-500 bg-green-500/10';
      case 'warning':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'error':
        return 'border-red-500 bg-red-500/10';
      default:
        return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getStatusText = () => {
    switch (status.proxy) {
      case 'healthy':
        return 'Tebra Service Online';
      case 'warning':
        // Provide context for warnings - might just be rate limiting
        if (status.responseTime && status.responseTime < 4000) {
          return 'Tebra Service Slow (Rate Limited)';
        }
        return 'Tebra Service Issues';
      case 'error':
        return 'Tebra Service Offline';
      default:
        return 'Tebra Service Unknown';
    }
  };

  const getResponseTimeColor = () => {
    if (!status.responseTime) return 'text-gray-400';
    
    // Adjusted for rate-limited Tebra API
    if (status.responseTime < 1500) return 'text-green-400';  // Fast for Tebra
    if (status.responseTime < 3500) return 'text-yellow-400'; // Normal for rate-limited API
    return 'text-red-400'; // Slow even for rate-limited API
  };

  const getResponseTimeLabel = () => {
    if (!status.responseTime) return '';
    
    // Adjusted labels for rate-limited service
    if (status.responseTime < 1000) return 'Excellent';
    if (status.responseTime < 1500) return 'Fast';
    if (status.responseTime < 2500) return 'Normal';
    if (status.responseTime < 3500) return 'Rate Limited';
    return 'Very Slow';
  };

  const getErrorTypeLabel = (type: 'connection' | 'authentication' | 'tebra_service' | 'internal_service_fault' | 'unknown') => {
    switch (type) {
      case 'internal_service_fault':
        return 'Tebra Internal Service Error';
      case 'authentication':
        return 'Authentication Error';
      case 'tebra_service':
        return 'Tebra Service Error';
      case 'connection':
        return 'Network Connection Error';
      default:
        return 'Unknown Error';
    }
  };

  const getErrorActionButton = (type: 'connection' | 'authentication' | 'tebra_service' | 'internal_service_fault' | 'unknown') => {
    switch (type) {
      case 'internal_service_fault':
        return (
          <div className="text-xs text-gray-400">
            This is a Tebra server issue. Please try again in a few minutes.
          </div>
        );
      case 'authentication':
        return (
          <button
            onClick={() => window.open('https://console.cloud.google.com/security/secret-manager?project=luknerlumina-firebase', '_blank')}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1"
          >
            <span>Check Credentials</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        );
      case 'connection':
        return (
          <button
            onClick={checkProxyHealth}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Retry Connection
          </button>
        );
      default:
        return (
          <button
            onClick={() => window.open('https://console.cloud.google.com/run/detail/us-central1/tebra-php-api/logs?project=luknerlumina-firebase', '_blank')}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1"
          >
            <span>View Logs</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        );
    }
  };

  return (
    <div className={`${className}`}>
      <div 
        className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 ${getStatusColor()}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <div className="text-sm font-medium text-white">
                {getStatusText()}
              </div>
              <div className="text-xs text-gray-400">
                Last check: {status.lastCheck}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {status.proxy === 'healthy' && status.responseTime && (
              <div className="text-xs text-gray-400 flex items-center space-x-1">
                <Activity className="w-3 h-3" />
                <span>{status.responseTime}ms</span>
              </div>
            )}
            <button
              className="text-gray-400 hover:text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                checkProxyHealth();
              }}
            >
              <Wifi className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-600">
            {/* Main Metrics */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-4">
              <div>
                <div className="text-gray-400">Response Time</div>
                <div className={`font-mono ${getResponseTimeColor()}`}>
                  {status.responseTime ? `${status.responseTime}ms` : 'N/A'}
                  {status.responseTime && (
                    <span className="ml-1 text-xs">
                      {getResponseTimeLabel()}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Status</div>
                <div className="text-white capitalize flex items-center space-x-1">
                  <span>{status.proxy}</span>
                  {status.proxy === 'warning' && <AlertTriangle className="w-3 h-3 text-yellow-500" />}
                  {status.proxy === 'error' && <XCircle className="w-3 h-3 text-red-500" />}
                </div>
              </div>
            </div>

            {/* Rate Limiting Info */}
            {status.responseTime && status.responseTime >= 2000 && status.responseTime < 4000 && status.proxy !== 'error' && (
              <div className="mb-4 p-2 bg-blue-900/20 border border-blue-700 rounded">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <div className="text-xs text-blue-400 font-medium">
                    Rate Limiting Active
                  </div>
                </div>
                <div className="text-xs text-gray-300">
                  Tebra API intentionally limits request frequency to prevent abuse. 
                  Response times of 2-4 seconds are normal and expected.
                </div>
              </div>
            )}

            {/* Performance Metrics (when available) */}
            {status.performanceMetrics && (status.performanceMetrics.soapDuration || status.performanceMetrics.totalDuration) && (
              <div className="mb-4 p-2 bg-gray-800 rounded border border-gray-700">
                <div className="text-xs text-gray-400 mb-2">Performance Breakdown</div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {status.performanceMetrics.soapDuration && (
                    <div>
                      <div className="text-gray-500">SOAP Call</div>
                      <div className="text-white font-mono">{status.performanceMetrics.soapDuration}ms</div>
                    </div>
                  )}
                  {status.performanceMetrics.totalDuration && (
                    <div>
                      <div className="text-gray-500">Total Time</div>
                      <div className="text-white font-mono">{status.performanceMetrics.totalDuration}ms</div>
                    </div>
                  )}
                </div>
                {status.performanceMetrics.cacheHit !== undefined && (
                  <div className="mt-2 text-xs">
                    <span className="text-gray-500">Cache: </span>
                    <span className={status.performanceMetrics.cacheHit ? 'text-green-400' : 'text-yellow-400'}>
                      {status.performanceMetrics.cacheHit ? 'Hit' : 'Miss'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Error Details (when there's an error) */}
            {status.errorDetails && (
              <div className="mb-4 p-2 bg-red-900/20 border border-red-700 rounded">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <div className="text-xs text-red-400 font-medium">
                    {getErrorTypeLabel(status.errorDetails.type)}
                  </div>
                </div>
                <div className="text-xs text-gray-300 mb-2">
                  {status.errorDetails.message}
                </div>
                {status.errorDetails.correlationId && (
                  <div className="text-xs text-gray-500 font-mono">
                    ID: {status.errorDetails.correlationId}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-2">
                  Note: If you see rate limiting errors with 2-4 second response times, this is normal behavior from Tebra's API.
                </div>
                <div className="mt-2">
                  {getErrorActionButton(status.errorDetails.type)}
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-400">
                Monitoring: Firebase Functions → Tebra Proxy → Tebra API (Rate Limited)
              </div>
              <div className="flex space-x-2">
                <a
                  href="https://console.cloud.google.com/run/detail/us-central1/tebra-php-api/logs?project=luknerlumina-firebase"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1"
                >
                  <span>Logs</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://console.cloud.google.com/monitoring/alerting/policies?project=luknerlumina-firebase"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1"
                >
                  <span>Alerts</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitoringStatus;