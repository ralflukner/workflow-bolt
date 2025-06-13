import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Clock, Wifi, Activity } from 'lucide-react';
import { tebraApiService } from '../services/tebraApiService';

interface MonitoringStatusProps {
  className?: string;
}

interface ServiceStatus {
  proxy: 'healthy' | 'error' | 'warning' | 'unknown';
  lastCheck: string;
  latency?: number;
  errors?: number;
  responseTime?: number;
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

  const checkProxyHealth = async () => {
    try {
      const startTime = performance.now();
      
      // Use Firebase Function instead of direct proxy call
      const isConnected = await tebraApiService.testConnection();
      
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      if (isConnected) {
        setStatus({
          proxy: 'healthy',
          lastCheck: new Date().toLocaleTimeString(),
          responseTime,
          latency: responseTime,
          errors: 0
        });
      } else {
        setStatus({
          proxy: 'error',
          lastCheck: new Date().toLocaleTimeString(),
          responseTime,
          errors: 1
        });
      }
    } catch (error) {
      console.error('Proxy health check failed:', error);
      setStatus({
        proxy: 'error',
        lastCheck: new Date().toLocaleTimeString(),
        errors: 1
      });
    }
  };

  useEffect(() => {
    // Initial check
    checkProxyHealth();
    
    // Check every 2 minutes
    const interval = setInterval(checkProxyHealth, 120000);
    
    return () => clearInterval(interval);
  }, []);

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
        return 'Tebra Service Issues';
      case 'error':
        return 'Tebra Service Offline';
      default:
        return 'Tebra Service Unknown';
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
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-gray-400">Response Time</div>
                <div className="text-white font-mono">
                  {status.responseTime ? `${status.responseTime}ms` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Status</div>
                <div className="text-white capitalize">{status.proxy}</div>
              </div>
            </div>
            
            <div className="mt-3 flex justify-between items-center">
              <div className="text-xs text-gray-400">
                Monitoring: Firebase Functions → Tebra Proxy → Tebra API
              </div>
              <a
                href="https://console.cloud.google.com/monitoring/alerting/policies?project=luknerlumina-firebase"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                View Alerts →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitoringStatus;