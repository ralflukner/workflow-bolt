import React, { useState, useEffect } from 'react';
import { usePatientContext } from '../hooks/usePatientContext';
import { dailySessionService } from '../services/firebase/dailySessionService';

interface SessionStats {
  currentSessionDate: string;
  hasCurrentSession: boolean;
  totalSessions: number;
  oldestSession?: string;
}

export const PersistenceStatus: React.FC = () => {
  const { 
    persistenceEnabled, 
    togglePersistence, 
    saveCurrentSession, 
    isLoading,
    patients 
  } = usePatientContext();
  
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [saving, setSaving] = useState(false);
  const [purging, setPurging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load session statistics
  useEffect(() => {
    if (!persistenceEnabled) return;

    const loadStats = async () => {
      try {
        const stats = await dailySessionService.getSessionStats();
        setSessionStats(stats);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session stats');
      }
    };

    loadStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [persistenceEnabled]);

  const handleManualSave = async () => {
    if (!persistenceEnabled) return;
    
    try {
      setSaving(true);
      setError(null);
      await saveCurrentSession();
      
      // Refresh stats after save
      const stats = await dailySessionService.getSessionStats();
      setSessionStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save session');
    } finally {
      setSaving(false);
    }
  };

  const handleForcePurge = async () => {
    if (!persistenceEnabled) return;
    
    const confirmed = window.confirm(
      'This will permanently delete ALL session data from Firebase. This action cannot be undone. Are you sure?'
    );
    
    if (!confirmed) return;
    
    try {
      setPurging(true);
      setError(null);
      await dailySessionService.purgeAllSessions();
      
      // Refresh stats after purge
      const stats = await dailySessionService.getSessionStats();
      setSessionStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to purge sessions');
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Data Persistence</h3>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            persistenceEnabled 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {persistenceEnabled ? 'Enabled' : 'Disabled'}
          </span>
          {isLoading && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Loading...
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {persistenceEnabled && sessionStats && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Today's Session:</span>
            <p className="text-gray-900">{sessionStats.currentSessionDate}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Session Exists:</span>
            <p className={sessionStats.hasCurrentSession ? 'text-green-600' : 'text-red-600'}>
              {sessionStats.hasCurrentSession ? 'Yes' : 'No'}
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Total Sessions:</span>
            <p className="text-gray-900">{sessionStats.totalSessions}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Current Patients:</span>
            <p className="text-gray-900">{patients.length}</p>
          </div>
          {sessionStats.oldestSession && (
            <div className="col-span-2">
              <span className="font-medium text-gray-700">Oldest Session:</span>
              <p className="text-gray-900">{sessionStats.oldestSession}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2 border-t">
        <button
          onClick={togglePersistence}
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            persistenceEnabled
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {persistenceEnabled ? 'Disable' : 'Enable'} Persistence
        </button>

        {persistenceEnabled && (
          <>
            <button
              onClick={handleManualSave}
              disabled={saving || isLoading}
              className="px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Manual Save'}
            </button>

            <button
              onClick={handleForcePurge}
              disabled={purging || isLoading}
              className="px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {purging ? 'Purging...' : 'Force Purge All'}
            </button>
          </>
        )}
      </div>

      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
        <p className="font-medium mb-1">HIPAA Compliance Notes:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Patient data is automatically purged after 24 hours</li>
          <li>Data is encrypted in transit and at rest</li>
          <li>Access is logged and auditable</li>
          <li>Only current day sessions are retained</li>
        </ul>
      </div>
    </div>
  );
}; 