/**
 * Recent Errors Panel Component
 * Displays a scrollable list of recent errors with timestamps
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { RecentError } from '../../constants/tebraDebug';

interface RecentErrorsPanelProps {
  errors: RecentError[];
  maxHeight?: string;
}

export const RecentErrorsPanel: React.FC<RecentErrorsPanelProps> = ({ 
  errors, 
  maxHeight = 'max-h-64' 
}) => {
  if (errors.length === 0) {
    return (
      <div className="bg-green-900/20 border border-green-500/20 p-4 rounded-lg">
        <div className="flex items-center space-x-2 text-green-300">
          <AlertTriangle className="w-5 h-5" />
          <span>No recent errors - all systems operational</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-700 rounded-lg border border-gray-600">
      <div className="p-4 border-b border-gray-600">
        <div className="flex items-center space-x-2 text-red-300">
          <AlertTriangle className="w-5 h-5" />
          <h4 className="font-medium">Recent Issues ({errors.length})</h4>
        </div>
      </div>
      
      <div className={`${maxHeight} overflow-y-auto`}>
        <div className="space-y-1">
          {errors.map((error, index) => (
            <div 
              key={`${error.correlationId}-${index}`} 
              className="p-3 border-b border-gray-600 last:border-b-0 hover:bg-gray-600/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium text-red-300 text-sm">
                  {error.step}
                </div>
                <div className="text-xs text-gray-400">
                  {error.timestamp.toLocaleTimeString()}
                </div>
              </div>
              <div className="text-sm text-red-200 leading-relaxed">
                {error.error}
              </div>
              {error.correlationId && (
                <div className="text-xs text-gray-500 mt-1">
                  ID: {error.correlationId}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};