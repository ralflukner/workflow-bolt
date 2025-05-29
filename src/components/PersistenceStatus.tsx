import React, { useState, useEffect } from 'react';
import { usePatientContext } from '../hooks/usePatientContext';
import { dailySessionService } from '../services/firebase/dailySessionService';
import { localSessionService } from '../services/localStorage/localSessionService';
import { isFirebaseConfigured } from '../config/firebase';

interface SessionStats {
  currentSessionDate: string;
  hasCurrentSession: boolean;
  totalSessions: number;
}

export const PersistenceStatus: React.FC = () => {
  const { 
    persistenceEnabled, 
    togglePersistence, 
    saveCurrentSession, 
    patients,
    hasRealData,
    isLoading 
  } = usePatientContext();
  
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Determine which storage service to use
  const storageService = isFirebaseConfigured ? dailySessionService : localSessionService;
  const storageType = isFirebaseConfigured ? 'Firebase' : 'LocalStorage';

  // Load session statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await storageService.getSessionStats();
        setSessionStats(stats);
      } catch (error) {
        console.error(`Failed to load session stats from ${storageType}:`, error);
      }
    };

    if (persistenceEnabled) {
      loadStats();
      const interval = setInterval(loadStats, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [persistenceEnabled, patients.length, storageService, storageType]);

  const handleManualSave = async () => {
    if (!hasRealData) {
      alert('No real patient data to save. Add or import patients first.');
      return;
    }

    setIsSaving(true);
    try {
      await saveCurrentSession();
      setLastSaved(new Date().toLocaleTimeString());
      
      // Refresh stats
      const stats = await storageService.getSessionStats();
      setSessionStats(stats);
      
      alert(`Session saved successfully to ${storageType}!`);
    } catch (error) {
      console.error('Manual save failed:', error);
      alert(`Failed to save session to ${storageType}. Check console for details.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePurgeData = async () => {
    if (!confirm(`This will clear all session data from ${storageType}. Are you sure?`)) {
      return;
    }

    setIsPurging(true);
    try {
      if ('clearSession' in storageService) {
        await storageService.clearSession();
      }
      
      // Refresh stats
      const stats = await storageService.getSessionStats();
      setSessionStats(stats);
      
      alert(`Session data cleared from ${storageType}!`);
    } catch (error) {
      console.error('Purge failed:', error);
      alert(`Failed to clear session data from ${storageType}. Check console for details.`);
    } finally {
      setIsPurging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="text-sm text-gray-600">Loading session data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Data Persistence</h3>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            persistenceEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {persistenceEnabled ? 'Enabled' : 'Disabled'}
          </span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            isFirebaseConfigured ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {storageType}
          </span>
        </div>
      </div>

      {persistenceEnabled && sessionStats && (
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <span className="text-gray-600">Session Date:</span>
            <p className="font-medium">{sessionStats.currentSessionDate}</p>
          </div>
          <div>
            <span className="text-gray-600">Current Session:</span>
            <p className={`font-medium ${sessionStats.hasCurrentSession ? 'text-green-600' : 'text-gray-500'}`}>
              {sessionStats.hasCurrentSession ? 'Active' : 'None'}
            </p>
          </div>
          <div>
            <span className="text-gray-600">Patient Count:</span>
            <p className="font-medium">{patients.length}</p>
          </div>
          <div>
            <span className="text-gray-600">Data Type:</span>
            <p className={`font-medium ${hasRealData ? 'text-green-600' : 'text-blue-600'}`}>
              {hasRealData ? 'Real Data' : 'Mock Data'}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={togglePersistence}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
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
              disabled={isSaving || !hasRealData}
              className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : `Save to ${storageType}`}
            </button>

            <button
              onClick={handlePurgeData}
              disabled={isPurging}
              className="px-3 py-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPurging ? 'Clearing...' : `Clear ${storageType}`}
            </button>
          </>
        )}
      </div>

      {lastSaved && (
        <p className="text-xs text-green-600 mb-2">
          Last saved: {lastSaved}
        </p>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        {isFirebaseConfigured ? (
          <>
            <p>• Using Firebase for cloud data persistence</p>
            <p>• Data is shared across devices and auto-purged daily</p>
            <p>• HIPAA compliant with 24-hour retention policy</p>
          </>
        ) : (
          <>
            <p>• Using browser localStorage for local persistence</p>
            <p>• Data only available on this device/browser</p>
            <p>• Data clears automatically at end of day</p>
          </>
        )}
        <p>• Only real patient data is auto-saved (not mock data)</p>
      </div>
    </div>
  );
}; 