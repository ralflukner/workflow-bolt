import React, { useState, useEffect, useCallback } from 'react';
import { useTimeContext } from '../hooks/useTimeContext';
import { usePatientContext } from '../hooks/usePatientContext';
import tebraApi from '../services/tebraApi';
import { TebraConnectionDebuggerSimple } from './TebraConnectionDebuggerSimple';
import { doc, onSnapshot, getFirestore } from 'firebase/firestore';
import { useFirebaseAuth } from '../services/authBridge';

interface SyncResult {
  success: boolean;
  message: string;
  patientCount?: number;
  lastSync?: Date;
}

// Wrapper type for PHP API responses used in this component
interface PhpApiEnvelope<T = unknown> {
  data: {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
  };
}

interface TebraApiResponse {
  data: {
    success: boolean;
    data?: {
      appointments?: unknown[];
    };
    error?: string;
    message?: string;
  };
}

const TebraIntegration: React.FC = () => {
  const { getCurrentTime } = useTimeContext();
  const { refreshFromFirebase } = usePatientContext();
  const { ensureFirebaseAuth } = useFirebaseAuth();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [connectionTested, setConnectionTested] = useState(false);
  const [todayAppointmentCount, setTodayAppointmentCount] = useState<number | null>(null);
  const [tomorrowAppointmentCount, setTomorrowAppointmentCount] = useState<number | null>(null);
  const [appointmentCountLoading, setAppointmentCountLoading] = useState(false);

  // Define functions before useEffects to avoid hoisting issues
  const fetchAppointmentCounts = useCallback(async () => {
    setAppointmentCountLoading(true);
    try {
      // Get today's date
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Get tomorrow's date
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      // Fetch appointment counts from Tebra
      const [todayAppointments, tomorrowAppointments] = await Promise.all([
        tebraApi.getAppointments({ fromDate: todayStr, toDate: todayStr }),
        tebraApi.getAppointments({ fromDate: tomorrowStr, toDate: tomorrowStr })
      ]);
      
      const extractCount = <T extends { appointments?: unknown[] }>(resp: PhpApiEnvelope<T>): number => {
        const appts = resp?.data?.data?.appointments;
        return Array.isArray(appts) ? appts.length : 0;
      };

      setTodayAppointmentCount(extractCount(todayAppointments));
      setTomorrowAppointmentCount(extractCount(tomorrowAppointments));
    } catch (error) {
      console.error('Failed to fetch appointment counts:', error);
      // Don't update counts on error, keep them as null
    } finally {
      setAppointmentCountLoading(false);
    }
  }, []);

  const testConnection = useCallback(async () => {
    setIsLoading(true);
    setStatusMessage('Testing Tebra API connection...');
    
    try {
      // Call PHP API directly (Firebase Functions no longer handle Tebra)
      console.log('🔄 Testing connection to Tebra PHP API...');
      
      const result = await tebraApi.testConnection();
      console.log('📨 PHP API response:', result);
      
      const data = result.data;
      const connected = data?.success || false;
      
      setIsConnected(connected);
      setConnectionTested(true);
      
      if (connected) {
        setStatusMessage('✅ Connected to Tebra API via PHP backend');
        // Fetch appointment counts when connected
        fetchAppointmentCounts();
      } else {
        const errorMessage = data?.error || data?.message || 'Check configuration';
        setStatusMessage(`❌ Failed to connect to Tebra API. ${errorMessage}`);
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setIsConnected(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStatusMessage(`❌ Connection test failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAppointmentCounts]);

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
  }, [connectionTested, testConnection]);

  // Refresh appointment counts periodically when connected
  useEffect(() => {
    if (isConnected) {
      // Fetch immediately when connected
      fetchAppointmentCounts();
      
      // Then refresh every 5 minutes
      const interval = setInterval(fetchAppointmentCounts, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [isConnected, fetchAppointmentCounts]);

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
      const response = await tebraApi.searchPatients({ lastName: 'Test' });
      const patients = Array.isArray(response?.data?.data) ? response.data.data : [];
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
      const response = await tebraApi.getProviders();
      const providersList = Array.isArray(response?.data?.data) ? response.data.data : [];
      setStatusMessage(`✅ Retrieved ${providersList.length} providers from Tebra.`);
      console.log('Providers:', providersList);
    } catch (error) {
      console.error('Get providers failed:', error);
      setStatusMessage(`❌ Failed to get providers: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestAppointments = async (date: string) => {
    if (!isConnected) {
      setStatusMessage('❌ Cannot test: Not connected to Tebra API');
      return;
    }

    setIsLoading(true);
    setStatusMessage(`Testing raw appointments for ${date}...`);

    try {
      const apiResp = await tebraApi.testAppointments();
      console.log('Raw Tebra response:', apiResp);
      setStatusMessage('✅ Test complete. Check console for raw data.');

      const appointments = apiResp?.data?.data?.appointments || [];
      if (Array.isArray(appointments)) {
        console.log('Appointments found:', appointments.length);
        if (appointments.length > 0) {
          console.log('First appointment:', appointments[0]);
        }
      }
    } catch (error) {
      console.error('Test failed:', error);
      setStatusMessage(`❌ Test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async (specificDate?: string) => {
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
        setIsLoading(false); // Ensure the loading spinner is cleared
        return;
      }

      const dateToSync = specificDate || new Date().toLocaleDateString('en-CA');
      console.log(`[TebraIntegrationNew] Manual sync requested for date: ${dateToSync}`);
      console.log(`[TebraIntegrationNew] Current local time: ${new Date().toISOString()}`);
      console.log(`[TebraIntegrationNew] Specific date parameter: ${specificDate || 'not provided'}`);
      
      setStatusMessage(`Syncing schedule for ${dateToSync}...`);
      const apiResp = await tebraApi.syncSchedule(dateToSync) as TebraApiResponse;
      const resultSuccess = apiResp?.data?.success;
      const resultMessage = apiResp?.data?.message || apiResp?.data?.error;
      const appointments = apiResp?.data?.data?.appointments || [];

      if (resultSuccess) {
        const patientCount = appointments.length;
        setStatusMessage(`✅ Sync completed. Imported ${patientCount} appointments for ${dateToSync}.`);
        setLastSyncResult({
          success: true,
          message: `Synced ${dateToSync}`,
          patientCount,
          lastSync: new Date(),
        });

        await refreshFromFirebase();
        fetchAppointmentCounts();
      } else {
        setStatusMessage(`❌ Sync failed: ${resultMessage || 'Unknown error'}`);
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
          type="button"
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
        
        {/* Appointment Counts from Tebra */}
        <div className="mb-3 text-sm text-gray-300">
          <div className="text-xs text-gray-400 mb-1">Appointments in Tebra EHR:</div>
          {appointmentCountLoading ? (
            <span>Loading appointment counts...</span>
          ) : (
            <div className="space-y-1">
              <div>
                Today: {todayAppointmentCount !== null ? (
                  <span className="font-semibold text-white">{todayAppointmentCount} appointments</span>
                ) : (
                  <span className="text-gray-500">--</span>
                )}
              </div>
              <div>
                Tomorrow: {tomorrowAppointmentCount !== null ? (
                  <span className="font-semibold text-white">{tomorrowAppointmentCount} appointments</span>
                ) : (
                  <span className="text-gray-500">--</span>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleManualSync()}
            disabled={isLoading || !isConnected}
            aria-label="Manually sync today's schedule from Tebra EHR"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Syncing...' : `Sync Today (${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })})`}
          </button>
          <button
            type="button"
            onClick={() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              handleManualSync(tomorrow.toISOString().split('T')[0]);
            }}
            disabled={isLoading || !isConnected}
            aria-label="Manually sync tomorrow's schedule from Tebra EHR"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Syncing...' : `Sync Tomorrow (${new Date(new Date().setDate(new Date().getDate() + 1)).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })})`}
          </button>
        </div>
      </div>

      {/* Test Operations & Last Sync Result */}
      <div className="border-t border-gray-700 pt-4">
        <h3 className="text-lg font-medium text-white mb-2">Test Operations</h3>
        <div className="flex space-x-2 mb-4">
          <button
            type="button"
            onClick={handleTestPatientSearch}
            disabled={isLoading || !isConnected}
            aria-label="Test patient search functionality by searching for test patients in Tebra EHR"
            className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Test Patient Search
          </button>

          <button
            type="button"
            onClick={handleGetProviders}
            disabled={isLoading || !isConnected}
            aria-label="Retrieve and display all healthcare providers from Tebra EHR system"
            className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Get Providers
          </button>

          <button
            type="button"
            onClick={() => handleTestAppointments('2025-06-11')}
            disabled={isLoading || !isConnected}
            aria-label="Test raw appointment data for June 11"
            className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Test June 11 Raw Data
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