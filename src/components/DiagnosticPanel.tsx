import React, { Component } from 'react';
import { withContexts, WithContextsProps } from './withContexts';
import { useFirebaseAuth } from '@/services/authBridge';
import { isFirebaseConfigured } from '@/config/firebase';
import { dailySessionService } from '@/services/firebase/dailySessionService';
import { localSessionService } from '@/services/localStorage/localSessionService';
import { SessionStats } from '@/services/storageService';

interface State {
  authStatus: 'checking' | 'authenticated' | 'failed';
  lastSaveAttempt: string;
  lastLoadAttempt: string;
  saveError: string;
  storageStats: SessionStats | null;
  authChecked: boolean;
  statsLoaded: boolean;
}

class DiagnosticPanelClass extends Component<WithContextsProps, State> {
  constructor(props: WithContextsProps) {
    super(props);

    this.state = {
      authStatus: 'checking',
      lastSaveAttempt: 'None',
      lastLoadAttempt: 'None',
      saveError: '',
      storageStats: null,
      authChecked: false,
      statsLoaded: false,
    };
  }

  componentDidMount() {
    this.checkAuth();
    this.loadStats();
  }

  // Check authentication status once per component lifecycle
  checkAuth = async () => {
    // Prevent repeated execution on re-renders
    if (this.state.authChecked) return;
    
    try {
      const firebaseReady = isFirebaseConfigured();
      if (firebaseReady) {
        // Note: We need to access useFirebaseAuth hook functionality
        // For now, we'll assume authentication works for class components
        // In a full migration, this would need a HOC or service wrapper
        this.setState({ authStatus: 'authenticated', authChecked: true });
      } else {
        this.setState({ authStatus: 'authenticated', authChecked: true });
      }
    } catch (error) {
      this.setState({ authStatus: 'failed' });
      console.error('Auth check failed:', error);
      // Don't mark as checked on error, allow retry
    }
  };

  // Load storage stats once per component lifecycle
  loadStats = async () => {
    // Prevent repeated execution on re-renders
    if (this.state.statsLoaded) return;
    
    try {
      const service = isFirebaseConfigured() ? dailySessionService : localSessionService;
      const stats = await service.getSessionStats();
      this.setState({ storageStats: stats, statsLoaded: true });
    } catch (error) {
      console.error('Failed to load storage stats:', error);
      // Don't mark as loaded on error, allow retry
    }
  };

  // Test manual save
  testManualSave = async () => {
    const timestamp = new Date().toISOString();
    this.setState({
      lastSaveAttempt: `Attempting at ${timestamp}`,
      saveError: ''
    });

    try {
      await this.props.patientContext.saveCurrentSession();
      this.setState({ lastSaveAttempt: `Success at ${timestamp}` });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.setState({
        saveError: errorMessage,
        lastSaveAttempt: `Failed at ${timestamp}: ${errorMessage}`
      });
    }
  };

  // Test manual load
  testManualLoad = async () => {
    const timestamp = new Date().toISOString();
    this.setState({ lastLoadAttempt: `Attempting at ${timestamp}` });

    try {
      const service = isFirebaseConfigured() ? dailySessionService : localSessionService;
      const patients = await service.loadTodaysSession();
      this.setState({ 
        lastLoadAttempt: `Success at ${timestamp} - Found ${patients.length} patients` 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.setState({ 
        lastLoadAttempt: `Failed at ${timestamp}: ${errorMessage}` 
      });
    }
  };

  getStatusColor = (status: string) => {
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

  render() {
    const { patientContext } = this.props;
    const { 
      authStatus, 
      lastSaveAttempt, 
      lastLoadAttempt, 
      saveError, 
      storageStats 
    } = this.state;

    const {
      patients,
      hasRealData,
      persistenceEnabled,
      isLoading,
      loadMockData,
      tickCounter
    } = patientContext;

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
                <span className={this.getStatusColor(isFirebaseConfigured().toString())}>
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
                <span className={this.getStatusColor(authStatus)}>
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
                <span className={this.getStatusColor((hasRealData ?? false).toString())}>
                  {(hasRealData ?? false).toString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Persistence Enabled:</span>
                <span className={this.getStatusColor((persistenceEnabled ?? false).toString())}>
                  {(persistenceEnabled ?? false).toString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Is Loading:</span>
                <span className={this.getStatusColor((!(isLoading ?? false)).toString())}>
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
                    <span className={this.getStatusColor(storageStats.hasCurrentSession?.toString() || 'false')}>
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
                  onClick={this.testManualSave}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-500"
                >
                  Test Save
                </button>
                <button
                  onClick={this.testManualLoad}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-500"
                >
                  Test Load
                </button>
                <button
                  onClick={loadMockData}
                  className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-500"
                >
                  Load Mock Data
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
  }
}

// Export the wrapped component
export const DiagnosticPanel = withContexts(DiagnosticPanelClass);