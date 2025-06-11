import React, { useState, useEffect } from 'react';
import { useTimeContext } from '../hooks/useTimeContext';
import { tebraApiService } from '../services/tebraApiService';
import { TebraConnectionDebuggerSimple } from './TebraConnectionDebuggerSimple';
import { doc, onSnapshot, getFirestore } from 'firebase/firestore';
import { useFirebaseAuth } from '../services/authBridge';

interface SyncResult {
  success: boolean;
  message: string;
  patientCount?: number;
  lastSync?: Date;
}

const TebraIntegration: React.FC = () => {
  const { getCurrentTime } = useTimeContext();
  const { ensureFirebaseAuth } = useFirebaseAuth();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [connectionTested, setConnectionTested] = useState(false);

  useEffect(() => {
    // Set default date to current time
    const currentDate = getCurrentTime();
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  }, [getCurrentTime]);

  // Test connection on component mount
  useEffect(() => {
    if (!connectionTested) {
      testConnection();
    }
  }, [connectionTested]);

  const testConnection = async () => {
    setIsLoading(true);
    setStatusMessage('Testing Tebra API connection...');
    
    try {
      const connected = await tebraApiService.testConnection();
      setIsConnected(connected);
      setConnectionTested(true);
      
      if (connected) {
        setStatusMessage('✅ Connected to Tebra API via Firebase Functions');
      } else {
        setStatusMessage('❌ Failed to connect to Tebra API. Check configuration.');
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setIsConnected(false);
      setStatusMessage('❌ Connection test failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove handleSyncSchedule and instead listen to Firestore
  useEffect(() => {
    // Skip Firebase calls in test environment
    if (typeof window === 'undefined' || process.env.NODE_ENV === 'test') return;
    
    try {
      const db = getFirestore();
      const targetDate = selectedDate || new Date().toISOString().split('T')[0];
      const unsub = onSnapshot(doc(db, 'daily_sessions', targetDate), (snap) => {
        if (snap.exists()) {
          const patientCount = (snap.data().patients || []).length;
          setLastSyncResult({
            success: true,
            message: 'Auto-synced',
            patientCount,
            lastSync: snap.data().lastSync?.toDate ? snap.data().lastSync.toDate() : new Date()
          });
        }
      });
      return () => unsub();
    } catch (error) {
      console.error('Firestore listener error:', error);
    }
  }, [selectedDate]);

  const handleTestPatientSearch = async () => {
    if (!isConnected) {
      setStatusMessage('❌ Cannot search: Not connected to Tebra API');
      return;
    }

    setIsLoading(true);
    setStatusMessage('Testing patient search...');

    try {
      const patients = await tebraApiService.searchPatients({ lastName: 'Test' });
      setStatusMessage(`✅ Patient search test completed. Found ${patients.length} patients.`);
    } catch (error) {
      console.error('Patient search test failed:', error);
      setStatusMessage(`❌ Patient search test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetProviders = async () => {
    if (!isConnected) {
      setStatusMessage('❌ Cannot get providers: Not connected to Tebra API');
      return;
    }

    setIsLoading(true);
    setStatusMessage('Getting providers...');

    try {
      const providers = await tebraApiService.getProviders();
      setStatusMessage(`✅ Retrieved ${providers.length} providers from Tebra.`);
      console.log('Providers:', providers);
    } catch (error) {
      console.error('Get providers failed:', error);
      setStatusMessage(`❌ Failed to get providers: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (!isConnected) {
      setStatusMessage('❌ Cannot sync: Not connected to Tebra API');
      return;
    }

    setIsLoading(true);
    setStatusMessage('Authenticating for HIPAA-compliant access...');

    try {
      // Ensure Firebase authentication is set up for HIPAA compliance
      const authenticated = await ensureFirebaseAuth();
      if (!authenticated) {
        setStatusMessage('❌ Authentication failed - required for patient data access');
        return;
      }

      setStatusMessage('Manually syncing today\'s schedule...');
      const result = await tebraApiService.syncTodaysSchedule();
      if (result.success) {
        const patientCount = result.patients?.length || 0;
        setStatusMessage(`✅ Manual sync completed. Found ${patientCount} appointments for today.`);
        setLastSyncResult({
          success: true,
          message: 'Manual sync',
          patientCount,
          lastSync: new Date()
        });
      } else {
        setStatusMessage(`❌ Manual sync failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
      setStatusMessage(`❌ Manual sync failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-testid="tebra-integration" className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Tebra EHR Integration</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-300">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Status Message */}
      <div className="mb-4 p-3 bg-gray-700 rounded-lg">
        <p className="text-sm text-gray-300">{statusMessage}</p>
      </div>

      {/* Connection Test */}
      <div className="mb-4">
        <button
          onClick={testConnection}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Testing...' : 'Test Connection'}
        </button>

        <div className="mt-2">
          <TebraConnectionDebuggerSimple />
        </div>
      </div>

      {/* Manual Sync */}
      <div className="border-t border-gray-700 pt-4 mb-4">
        <h3 className="text-lg font-medium text-white mb-2">Manual Sync</h3>
        <button
          onClick={handleManualSync}
          disabled={isLoading || !isConnected}
          aria-label="Manually sync today's schedule from Tebra EHR"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Syncing...' : 'Sync Today\'s Schedule'}
        </button>
      </div>

      {/* Test Operations & Last Sync Result */}
      <div className="border-t border-gray-700 pt-4">
        <h3 className="text-lg font-medium text-white mb-2">Test Operations</h3>
        <div className="flex space-x-2 mb-4">
          <button
            onClick={handleTestPatientSearch}
            disabled={isLoading || !isConnected}
            aria-label="Test patient search functionality by searching for test patients in Tebra EHR"
            className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Test Patient Search
          </button>

          <button
            onClick={handleGetProviders}
            disabled={isLoading || !isConnected}
            aria-label="Retrieve and display all healthcare providers from Tebra EHR system"
            className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Get Providers
          </button>
        </div>

        {lastSyncResult && (
          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-lg font-medium text-white mb-2">Last Sync Result</h3>
            <div className="text-sm text-gray-300 space-y-1">
              <p>
                Status:{' '}
                <span className={lastSyncResult.success ? 'text-green-400' : 'text-red-400'}>
                  {lastSyncResult.success ? 'Success' : 'Failed'}
                </span>
              </p>
              <p>Message: {lastSyncResult.message}</p>
              {lastSyncResult.patientCount !== undefined && <p>Patients: {lastSyncResult.patientCount}</p>}
              {lastSyncResult.lastSync && <p>Time: {lastSyncResult.lastSync.toLocaleString()}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TebraIntegration; 