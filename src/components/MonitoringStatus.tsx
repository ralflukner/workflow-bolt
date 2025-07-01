import React, { Component } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Clock, Wifi, Activity, ExternalLink, AlertCircle } from 'lucide-react';
import { tebraTestConnection } from '../services/tebraApi';

interface MonitoringStatusProps {
  className?: string;
}

interface ServiceStatus {
  proxy: 'healthy' | 'warning' | 'error' | 'unknown';
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

interface State {
  status: ServiceStatus;
  isExpanded: boolean;
}

// NOTE: useEffect is not allowed in this project. See docs/NO_USE_EFFECT_POLICY.md
class MonitoringStatus extends Component<MonitoringStatusProps, State> {
  constructor(props: MonitoringStatusProps) {
    super(props);

    this.state = {
      status: {
        proxy: 'unknown',
        lastCheck: 'Never',
        latency: 0,
        errors: 0,
        responseTime: 0,
      },
      isExpanded: false,
    };
  }

  // -------------------------------------------------------------
  // Helpers and business logic
  // -------------------------------------------------------------

  checkProxyHealth = async () => {
    try {
      const startTime = performance.now();
      const result = await tebraTestConnection();
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (result && 'data' in result ? (result as any).data : result) as {
        success: boolean;
        performanceMetrics?: {
          soap_duration_ms?: number;
          total_duration_ms?: number;
          cacheHit?: boolean;
        };
        message?: string;
        timestamp?: string;
        correlationId?: string;
      };

      if (data.success) {
        let proxyState: 'healthy' | 'warning' = 'healthy';
        if (responseTime > 5000) {
          proxyState = 'warning';
        } else if (responseTime > 3500) {
          proxyState = 'warning';
        }

        this.setState({
          status: {
            proxy: proxyState,
            lastCheck: new Date().toLocaleTimeString(),
            responseTime,
            latency: responseTime,
            errors: 0,
            performanceMetrics: data.performanceMetrics
              ? {
                  soapDuration: data.performanceMetrics.soap_duration_ms,
                  totalDuration: data.performanceMetrics.total_duration_ms,
                  cacheHit:
                    'cacheHit' in data.performanceMetrics
                      ? (data.performanceMetrics as { cacheHit: boolean }).cacheHit
                      : undefined,
                }
              : undefined,
            errorDetails: undefined,
          },
        });
      } else {
        this.setState({
          status: {
            proxy: 'error',
            lastCheck: new Date().toLocaleTimeString(),
            responseTime,
            errors: 1,
            errorDetails: {
              type: this.parseErrorType(data.message || 'Unknown error'),
              message: data.message || 'Connection test failed',
              timestamp: data.timestamp || new Date().toISOString(),
              correlationId: data.correlationId,
            },
          },
        });
      }
    } catch (error) {
      console.error('Proxy health check failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorType = this.parseErrorType(errorMessage);

      this.setState({
        status: {
          proxy: 'error',
          lastCheck: new Date().toLocaleTimeString(),
          errors: 1,
          errorDetails: {
            type: errorType,
            message: errorMessage,
            timestamp: new Date().toISOString(),
          },
        },
      });
    }
  };

  parseErrorType = (
    errorMessage: string,
  ): 'connection' | 'authentication' | 'tebra_service' | 'internal_service_fault' | 'unknown' => {
    const message = errorMessage.toLowerCase();

    if (message.includes('internalservicefault')) {
      return 'internal_service_fault';
    } else if (
      message.includes('auth') ||
      message.includes('unauthorized') ||
      message.includes('forbidden')
    ) {
      return 'authentication';
    } else if (message.includes('tebra') || message.includes('soap')) {
      return 'tebra_service';
    } else if (
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('timeout')
    ) {
      return 'connection';
    }

    return 'unknown';
  };

  getStatusIcon = () => {
    switch (this.state.status.proxy) {
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

  getStatusColor = () => {
    switch (this.state.status.proxy) {
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

  getStatusText = () => {
    const { status } = this.state;
    switch (status.proxy) {
      case 'healthy':
        return 'Tebra Service Online';
      case 'warning': {
        if (status.responseTime && status.responseTime < 4000) {
          return 'Tebra Service Slow (Rate Limited)';
        }
        return 'Tebra Service Issues';
      }
      case 'error':
        return 'Tebra Service Offline';
      default:
        return 'Tebra Service Unknown';
    }
  };

  getResponseTimeColor = () => {
    const { status } = this.state;
    if (!status.responseTime) return 'text-gray-400';
    if (status.responseTime < 1500) return 'text-green-400';
    if (status.responseTime < 3500) return 'text-yellow-400';
    return 'text-red-400';
  };

  getResponseTimeLabel = () => {
    const { status } = this.state;
    if (!status.responseTime) return '';
    if (status.responseTime < 1000) return 'Excellent';
    if (status.responseTime < 1500) return 'Fast';
    if (status.responseTime < 2500) return 'Normal';
    if (status.responseTime < 3500) return 'Rate Limited';
    return 'Very Slow';
  };

  getErrorTypeLabel = (
    type: 'connection' | 'authentication' | 'tebra_service' | 'internal_service_fault' | 'unknown',
  ) => {
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

  getErrorActionButton = (
    type: 'connection' | 'authentication' | 'tebra_service' | 'internal_service_fault' | 'unknown',
  ) => {
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
            onClick={() =>
              window.open(
                'https://console.cloud.google.com/security/secret-manager?project=luknerlumina-firebase',
                '_blank',
              )
            }
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1"
          >
            <span>Check Credentials</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        );
      case 'connection':
        return (
          <button
            onClick={this.checkProxyHealth}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Retry Connection
          </button>
        );
      default:
        return (
          <button
            onClick={() =>
              window.open(
                'https://console.cloud.google.com/run/detail/us-central1/tebra-php-api/logs?project=luknerlumina-firebase',
                '_blank',
              )
            }
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1"
          >
            <span>View Logs</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        );
    }
  };

  // -------------------------------------------------------------
  // Render
  // -------------------------------------------------------------

  render() {
    const { className } = this.props;
    const { status, isExpanded } = this.state;

    return (
      <div className={`${className ?? ''}`}>
        <div
          className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 ${this.getStatusColor()}`}
          onClick={() => this.setState({ isExpanded: !isExpanded })}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {this.getStatusIcon()}
              <div>
                <div className="text-sm font-medium text-white">{this.getStatusText()}</div>
                <div className="text-xs text-gray-400">Last check: {status.lastCheck}</div>
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
                aria-label="Refresh status"
                title="Refresh status"
                onClick={(e) => {
                  e.stopPropagation();
                  this.checkProxyHealth();
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
                  <div className={`font-mono ${this.getResponseTimeColor()}`}>
                    {status.responseTime ? `${status.responseTime}ms` : 'N/A'}
                    {status.responseTime && (
                      <span className="ml-1 text-xs">{this.getResponseTimeLabel()}</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Status</div>
                  <div className="text-white capitalize flex items-center space-x-1">
                    <span>{status.proxy}</span>
                    {status.proxy === 'warning' && (
                      <AlertTriangle className="w-3 h-3 text-yellow-500" />
                    )}
                    {status.proxy === 'error' && (
                      <XCircle className="w-3 h-3 text-red-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Rate Limiting Info */}
              {status.responseTime &&
                status.responseTime >= 2000 &&
                status.responseTime < 4000 &&
                status.proxy !== 'error' && (
                  <div className="mb-4 p-2 bg-blue-900/20 border border-blue-700 rounded">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <div className="text-xs text-blue-400 font-medium">Rate Limiting Active</div>
                    </div>
                    <div className="text-xs text-gray-300">
                      Tebra API intentionally limits request frequency to prevent abuse. Response times of 2-4
                      seconds are normal and expected.
                    </div>
                  </div>
                )}

              {/* Performance Metrics (when available) */}
              {status.performanceMetrics &&
                (status.performanceMetrics.soapDuration || status.performanceMetrics.totalDuration) && (
                  <div className="mb-4 p-2 bg-gray-800 rounded border border-gray-700">
                    <div className="text-xs text-gray-400 mb-2">Performance Breakdown</div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {status.performanceMetrics.soapDuration && (
                        <div>
                          <div className="text-gray-500">SOAP Call</div>
                          <div className="text-white font-mono">
                            {status.performanceMetrics.soapDuration}ms
                          </div>
                        </div>
                      )}
                      {status.performanceMetrics.totalDuration && (
                        <div>
                          <div className="text-gray-500">Total Time</div>
                          <div className="text-white font-mono">
                            {status.performanceMetrics.totalDuration}ms
                          </div>
                        </div>
                      )}
                    </div>
                    {status.performanceMetrics.cacheHit !== undefined && (
                      <div className="mt-2 text-xs">
                        <span className="text-gray-500">Cache: </span>
                        <span
                          className={
                            status.performanceMetrics.cacheHit ? 'text-green-400' : 'text-yellow-400'
                          }
                        >
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
                      {this.getErrorTypeLabel(status.errorDetails.type)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-300 mb-2">{status.errorDetails.message}</div>
                  {status.errorDetails.correlationId && (
                    <div className="text-xs text-gray-500 font-mono">ID: {status.errorDetails.correlationId}</div>
                  )}
                  <div className="text-xs text-gray-400 mt-2">
                    Note: If you see rate limiting errors with 2-4 second response times, this is normal behavior
                    from Tebra's API.
                  </div>
                  <div className="mt-2">{this.getErrorActionButton(status.errorDetails.type)}</div>
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
  }
}

export default MonitoringStatus;