/**
 * Status Indicator Component
 * Reusable component for displaying step health status
 */

import React from 'react';
import { CheckCircle, AlertTriangle, WifiOff, Wifi } from 'lucide-react';
import { StepStatus } from '../../constants/tebraDebug';

interface StatusIndicatorProps {
  status: StepStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const iconClass = sizeClasses[size];

  switch (status) {
    case 'healthy':
      return <CheckCircle className={`${iconClass} text-green-500`} />;
    case 'warning':
      return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
    case 'error':
      return <WifiOff className={`${iconClass} text-red-500`} />;
    default:
      return <Wifi className={`${iconClass} text-gray-500`} />;
  }
};

export const getStatusColor = (status: StepStatus): string => {
  switch (status) {
    case 'healthy':
      return 'bg-green-900/20 border-green-500/30';
    case 'warning':
      return 'bg-yellow-900/20 border-yellow-500/30';
    case 'error':
      return 'bg-red-900/20 border-red-500/30';
    default:
      return 'bg-gray-900/20 border-gray-500/30';
  }
};

export const getStatusTextColor = (status: StepStatus): string => {
  switch (status) {
    case 'healthy':
      return 'text-green-400';
    case 'warning':
      return 'text-yellow-400';
    case 'error':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};