/**
 * Data Flow Step Card Component
 * Displays the status and details of a single step in the Tebra integration chain
 */

import React from 'react';
import { DataFlowStep } from '../../constants/tebraDebug';
import { StatusIndicator, getStatusColor, getStatusTextColor } from './StatusIndicator';

interface DataFlowStepCardProps {
  step: DataFlowStep;
  showDetails?: boolean;
}

export const DataFlowStepCard: React.FC<DataFlowStepCardProps> = ({ 
  step, 
  showDetails = true 
}) => {
  const formatResponseTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className={`p-4 rounded-lg border-l-4 ${getStatusColor(step.status)}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <StatusIndicator status={step.status} />
          <div>
            <div className="font-medium text-white">{step.name}</div>
            {showDetails && (
              <div className="text-sm text-gray-300">
                Last check: {step.lastCheck.toLocaleTimeString()}
                {step.responseTime > 0 && (
                  <> • Response: {formatResponseTime(step.responseTime)}</>
                )}
                {step.correlationId && (
                  <> • ID: {step.correlationId}</>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-sm font-medium ${getStatusTextColor(step.status)}`}>
            {step.status.toUpperCase()}
          </div>
        </div>
      </div>
      
      {step.errorMessage && (
        <div className="mt-3 text-sm text-red-300 bg-red-900/20 p-3 rounded border-l-2 border-red-500">
          <strong>Error:</strong> {step.errorMessage}
        </div>
      )}
    </div>
  );
};