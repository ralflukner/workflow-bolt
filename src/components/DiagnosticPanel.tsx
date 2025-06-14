import React, { useState, useEffect } from 'react';
import { usePatientContext } from '../hooks/usePatientContext';
import { useFirebaseAuth } from '../services/authBridge';
import { isFirebaseConfigured } from '../config/firebase';
import { dailySessionService } from '../services/firebase/dailySessionService';
import { localSessionService } from '../services/localStorage/localSessionService';
import { SessionStats } from '../services/storageService';

export const DiagnosticPanel: React.FC = () => {
  const {
    patients,
    hasRealData,
    persistenceEnabled,
    isLoading,
    saveCurrentSession,
    tickCounter
  } = usePatientContext();

  const { ensureFirebaseAuth } = useFirebaseAuth();
  
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'failed'>('checking');
  const [lastSaveAttempt, setLastSaveAttempt] = useState<string>('None');
  const [lastLoadAttempt, setLastLoadAttempt] = useState<string>('None');
  const [saveError, setSaveError] = useState<string>('');
  const [storageStats, setStorageStats] = useState<SessionStats | null>(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const success = await ensureFirebaseAuth();
        setAuthStatus(success ? 'authenticated' : 'failed');
      } catch (error) {
        setAuthStatus('failed');
        console.error('Auth check failed:', error);
      }
    };

    const firebaseReady = isFirebaseConfigured();
    if (firebaseReady) {
      checkAuth();
    } else {
      setAuthStatus('authenticated'); // localStorage doesn't need auth
    }
  }, [ensureFirebaseAuth]);

  // Load storage stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const firebaseReady = isFirebaseConfigured();
        const service = firebaseReady ? dailySessionService : localSessionService;
        const stats = await service.getStats();
        setStorageStats(stats);
      } catch (error) {
        console.error('Failed to load storage stats:', error);
      }
    };

    loadStats();
  }, [patients.length]);

  // Test manual save
  const testManualSave = async () => {
    const timestamp = new Date().toISOString();
    setLastSaveAttempt(`Attempting at ${timestamp}`);
    setSaveError('');

    try {
      await saveCurrentSession();
      setLastSaveAttempt(`Success at ${timestamp}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSaveError(errorMessage);
      setLastSaveAttempt(`Failed at ${timestamp}: ${errorMessage}`);
    }
  };

  // Test manual load
  const testManualLoad = async () => {
    const timestamp = new Date().toISOString();
    setLastLoadAttempt(`Attempting at ${timestamp}`);

    try {
      const service = isFirebaseConfigured() ? dailySessionService : localSessionService;
      const patients = await service.loadTodaysSession();
      setLastLoadAttempt(`Success at ${timestamp} - Found ${patients.length} patients`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLastLoadAttempt(`Failed at ${timestamp}: ${errorMessage}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'authenticated':
      case 'true':
      case 'Success':
        return 'text-green-400';
      case 'failed':
      case 'false':
      case 'Failed':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg mb-4">
      <h3 className="text-lg font-semibold text-white mb-4">🔍 Persistence Diagnostics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {/* Configuration Status */}
        <div className="bg-gray-700 p-3 rounded">
          <h4 className="font-medium text-white mb-2">Configuration</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-300">Firebase Configured:</span>
              <span className={getStatusColor(isFirebaseConfigured().toString())}>
                {isFirebaseConfigured().toString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Storage Service:</span>
              <span className="text-blue-400">
                {isFirebaseConfigured() ? 'Firebase' : 'LocalStorage'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Auth Status:</span>
              <span className={getStatusColor(authStatus)}>
                {authStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Data Status */}
        <div className="bg-gray-700 p-3 rounded">
          <h4 className="font-medium text-white mb-2">Data Status</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-300">Patients Count:</span>
              <span className="text-blue-400">{patients.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Has Real Data:</span>
              <span className={getStatusColor((hasRealData ?? false).toString())}>
                {(hasRealData ?? false).toString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Persistence Enabled:</span>
              <span className={getStatusColor((persistenceEnabled ?? false).toString())}>
                {(persistenceEnabled ?? false).toString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Is Loading:</span>
              <span className={getStatusColor((!(isLoading ?? false)).toString())}>
                {(isLoading ?? false).toString()}
              </span>
            </div>
          </div>
        </div>

        {/* Time & Updates */}
        <div className="bg-gray-700 p-3 rounded">
          <h4 className="font-medium text-white mb-2">Time & Updates</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-300">Tick Counter:</span>
              <span className="text-blue-400">{tickCounter ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Current Time:</span>
              <span className="text-blue-400 text-xs">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        {/* Storage Statistics */}
        <div className="bg-gray-700 p-3 rounded">
          <h4 className="font-medium text-white mb-2">Storage Stats</h4>
          <div className="space-y-1">
            {storageStats ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-300">Backend:</span>
                  <span className="text-blue-400">{storageStats.backend}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Has Session:</span>
                  <span className={getStatusColor(storageStats.hasCurrentSession?.toString() || 'false')}>
                    {storageStats.hasCurrentSession?.toString() || 'false'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Session Date:</span>
                  <span className="text-blue-400 text-xs">{storageStats.currentSessionDate}</span>
                </div>
                {storageStats.totalSessions !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Sessions:</span>
                    <span className="text-blue-400">{storageStats.totalSessions}</span>
                  </div>
                )}
              </>
            ) : (
              <span className="text-gray-400">Loading...</span>
            )}
          </div>
        </div>

        {/* Test Operations */}
        <div className="bg-gray-700 p-3 rounded md:col-span-2">
          <h4 className="font-medium text-white mb-2">Test Operations</h4>
          
          <div className="space-y-2 mb-3">
            <div className="flex gap-2">
              <button
                onClick={testManualSave}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-500"
              >
                Test Save
              </button>
              <button
                onClick={testManualLoad}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-500"
              >
                Test Load
              </button>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <div>
              <span className="text-gray-300">Last Save:</span>
              <span className={`ml-2 ${saveError ? 'text-red-400' : 'text-blue-400'}`}>
                {lastSaveAttempt}
              </span>
            </div>
            <div>
              <span className="text-gray-300">Last Load:</span>
              <span className="ml-2 text-blue-400">{lastLoadAttempt}</span>
            </div>
            {saveError && (
              <div className="text-red-400 mt-2 p-2 bg-red-900/20 rounded">
                {saveError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 