import React, { Component } from 'react';
// import { useQuery } from '@tanstack/react-query'; // TODO: Implement query for persistence status
import { withContexts, WithContextsProps } from './withContexts';
import { dailySessionService } from '../services/firebase/dailySessionService';
import { localSessionService } from '../services/localStorage/localSessionService';
import { isFirebaseConfigured } from '../config/firebase';
import { StorageService, SessionStats } from '../services/storageService';

// Type guard to check if stats are from Firebase
const isFirebaseStats = (stats: SessionStats): stats is SessionStats & { totalSessions: number } => {
  return stats.backend === 'firebase' && 'totalSessions' in stats;
};

// Type guard to check if stats are from LocalStorage
const isLocalStats = (stats: SessionStats): stats is SessionStats & { lastUpdated: string } => {
  return stats.backend === 'local' && 'lastUpdated' in stats;
};

interface State {
  sessionStats: SessionStats | null;
  isSaving: boolean;
  isPurging: boolean;
  lastSaved: string | null;
  showToast: boolean;
  toastMessage: string;
  toastType: 'success' | 'info' | 'error';
  storageService: StorageService;
  storageType: 'Firebase' | 'LocalStorage';
}

// NOTE: useEffect is not allowed in this project. See docs/NO_USE_EFFECT_POLICY.md
class PersistenceStatusClass extends Component<WithContextsProps, State> {
  private statsInterval: NodeJS.Timeout | null = null;
  private toastTimeout: NodeJS.Timeout | null = null;

  constructor(props: WithContextsProps) {
    super(props);

    // Determine which storage service to use (stable during component lifetime)
    const { storageService, storageType } = isFirebaseConfigured()
      ? { storageService: dailySessionService as StorageService, storageType: 'Firebase' as const }
      : { storageService: localSessionService as StorageService, storageType: 'LocalStorage' as const };

    this.state = {
      sessionStats: null,
      isSaving: false,
      isPurging: false,
      lastSaved: null,
      showToast: false,
      toastMessage: '',
      toastType: 'info',
      storageService,
      storageType,
    };
  }

  componentDidMount() {
    this.loadStats();
    if (this.props.patientContext.persistenceEnabled) {
      this.statsInterval = setInterval(() => this.loadStats(), 120000); // Refresh stats every 2 minutes
    }
  }

  componentDidUpdate(prevProps: WithContextsProps) {
    const { persistenceEnabled, patients } = this.props.patientContext;
    const prevPersistenceEnabled = prevProps.patientContext.persistenceEnabled;
    const prevPatientsLength = prevProps.patientContext.patients.length;

    // Handle persistence enabled state changes
    if (persistenceEnabled !== prevPersistenceEnabled) {
      if (persistenceEnabled) {
        this.loadStats();
        this.statsInterval = setInterval(() => this.loadStats(), 120000);
      } else {
        if (this.statsInterval) {
          clearInterval(this.statsInterval);
          this.statsInterval = null;
        }
      }
    }

    // Reload stats when patient count changes
    if (persistenceEnabled && patients.length !== prevPatientsLength) {
      this.loadStats();
    }
  }

  componentWillUnmount() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }

  loadStats = async () => {
    const { persistenceEnabled } = this.props.patientContext;
    if (!persistenceEnabled) return;

    try {
      const stats = await this.state.storageService.getSessionStats();
      this.setState({ sessionStats: stats });
    } catch (error) {
      console.error(`Failed to load session stats from ${this.state.storageType}:`, error);
    }
  };

  showToastMessage = (message: string, type: 'success' | 'info' | 'error') => {
    this.setState({
      toastMessage: message,
      toastType: type,
      showToast: true,
    });
    
    // Clear any existing timeout
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    // Auto-hide toast after 4 seconds
    this.toastTimeout = setTimeout(() => {
      this.setState({ showToast: false });
    }, 4000);
  };

  handleManualSave = async () => {
    const { hasRealData, saveCurrentSession } = this.props.patientContext;
    const { storageService, storageType } = this.state;

    if (!hasRealData) {
      this.showToastMessage(
        'No real patient data to save. Add or import patients first, or load mock data and then modify it to make it "real".',
        'info'
      );
      return;
    }

    this.setState({ isSaving: true });
    try {
      await saveCurrentSession();
      this.setState({ lastSaved: new Date().toLocaleTimeString() });
      
      // Refresh stats
      const stats = await storageService.getSessionStats();
      this.setState({ sessionStats: stats });
      
      this.showToastMessage(`Session saved successfully to ${storageType}!`, 'success');
    } catch (error) {
      console.error('Manual save failed:', error);
      this.showToastMessage(`Failed to save session to ${storageType}. Check console for details.`, 'error');
    } finally {
      this.setState({ isSaving: false });
    }
  };

  handlePurgeData = async () => {
    const { storageService, storageType } = this.state;

    if (!confirm(`This will clear all session data from ${storageType}. Are you sure?`)) {
      return;
    }

    this.setState({ isPurging: true });
    try {
      if (storageService.clearSession) {
        await storageService.clearSession();
      }
      
      // Refresh stats
      const stats = await storageService.getSessionStats();
      this.setState({ sessionStats: stats });
      
      this.showToastMessage(`Session data cleared from ${storageType}!`, 'success');
    } catch (error) {
      console.error('Purge failed:', error);
      this.showToastMessage(`Failed to clear session data from ${storageType}. Check console for details.`, 'error');
    } finally {
      this.setState({ isPurging: false });
    }
  };

  render() {
    const { patientContext } = this.props;
    const { persistenceEnabled, togglePersistence, patients, hasRealData, isLoading } = patientContext;
    const { sessionStats, isSaving, isPurging, lastSaved, showToast, toastMessage, toastType, storageType } = this.state;

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
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg mb-4">
      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border max-w-sm ${
          toastType === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : toastType === 'error'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {toastType === 'success' && (
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {toastType === 'error' && (
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {toastType === 'info' && (
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{toastMessage}</p>
            </div>
            <button
              onClick={() => this.setState({ showToast: false })}
              className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Data Persistence</h3>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            persistenceEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {persistenceEnabled ? 'Enabled' : 'Disabled'}
          </span>
          <div className={`px-2 py-1 rounded text-sm ${
            isFirebaseConfigured() ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {storageType}
          </div>
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
          {isFirebaseStats(sessionStats) && (
            <div>
              <span className="text-gray-600">Total Sessions:</span>
              <p className="font-medium">{sessionStats.totalSessions}</p>
            </div>
          )}
          {isLocalStats(sessionStats) && sessionStats.lastUpdated && (
            <div>
              <span className="text-gray-600">Last Updated:</span>
              <p className="font-medium">{new Date(sessionStats.lastUpdated).toLocaleTimeString()}</p>
            </div>
          )}
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
              onClick={this.handleManualSave}
              disabled={isSaving || !hasRealData}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                !hasRealData 
                  ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={!hasRealData ? 'No real patient data to save' : `Save current session to ${storageType}`}
            >
              {isSaving ? 'Saving...' : `Save to ${storageType}`}
            </button>

            <button
              onClick={this.handlePurgeData}
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
        {isFirebaseConfigured() ? (
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

      {isFirebaseConfigured() ? (
        <div className="mt-4">
          {/* Firebase specific content */}
        </div>
      ) : (
        <div className="mt-4">
          {/* LocalStorage specific content */}
        </div>
      )}
    </div>
    );
  }
}

// Export the wrapped component
export const PersistenceStatus = withContexts(PersistenceStatusClass); 