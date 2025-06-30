/**
 * Metrics Card Component
 * Reusable card for displaying dashboard metrics
 */

import React from 'react';

interface MetricsCardProps {
  value: string | number;
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  icon?: React.ReactNode;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({ 
  value, 
  label, 
  variant = 'default',
  icon 
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-900/20 border-green-500/30 text-green-400';
      case 'warning':
        return 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400';
      case 'error':
        return 'bg-red-900/20 border-red-500/30 text-red-400';
      default:
        return 'bg-gray-700 border-gray-600 text-white';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getVariantClasses()}`}>
      {icon && (
        <div className="flex items-center justify-between mb-2">
          <div className="opacity-70">{icon}</div>
        </div>
      )}
      <div className="text-2xl font-bold mb-1">
        {value}
      </div>
      <div className="text-sm text-gray-300 opacity-80">
        {label}
      </div>
    </div>
  );
};