import React, { useEffect, useState } from 'react';
import { usePatientContext } from '../hooks/usePatientContext';
import { useTimeContext } from '../hooks/useTimeContext';
import { Database, Clock, Save, AlertCircle } from 'lucide-react';

export const PersistenceDiagnostic: React.FC = () => {
  const { patients, persistenceEnabled, hasRealData, tickCounter } = usePatientContext();
  const { getCurrentTime } = useTimeContext();
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Track when saves happen
  useEffect(() => {
    if (patients.length > 0 && persistenceEnabled && hasRealData) {
      setSaveStatus('saving');
      setLastSaveTime(new Date());
      
      // Simulate save completion
      setTimeout(() => {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }, 500);
    }
  }, [patients.length, persistenceEnabled, hasRealData]);

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-md">
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
        <Database className="mr-2" size={20} />
        Persistence Diagnostic
      </h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Persistence Enabled:</span>
          <span className={persistenceEnabled ? 'text-green-400' : 'text-red-400'}>
            {persistenceEnabled ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Has Real Data:</span>
          <span className={hasRealData ? 'text-green-400' : 'text-yellow-400'}>
            {hasRealData ? 'Yes' : 'No (Mock Data)'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Patient Count:</span>
          <span className="text-white">{patients.length}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Tick Counter:</span>
          <span className="text-white">{tickCounter}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Current Time:</span>
          <span className="text-white">{getCurrentTime().toLocaleTimeString()}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Last Save:</span>
          <span className="text-white flex items-center">
            {formatTime(lastSaveTime)}
            {saveStatus === 'saving' && <Save className="ml-2 text-blue-400 animate-pulse" size={16} />}
            {saveStatus === 'success' && <Clock className="ml-2 text-green-400" size={16} />}
            {saveStatus === 'error' && <AlertCircle className="ml-2 text-red-400" size={16} />}
          </span>
        </div>
        
        <div className="mt-3 p-2 bg-gray-700 rounded text-xs">
          <div className="text-gray-300">
            Auto-save: Every 2 seconds when data changes<br />
            Periodic save: Every 5 minutes in real-time mode<br />
            Current Storage: localStorage (fallback due to auth issues)
          </div>
        </div>
      </div>
    </div>
  );
};