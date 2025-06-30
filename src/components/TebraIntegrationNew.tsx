import React, { useState } from 'react';
import { usePatientContext } from '../hooks/usePatientContext';
import tebraApi from '../services/tebraApi';
import { TebraConnectionDebuggerSimple } from './TebraConnectionDebuggerSimple';
import { useFirebaseAuth } from '../services/authBridge';

interface SyncResult {
  success: boolean;
  message: string;
  patientCount?: number;
  lastSync?: Date;
}

// Type for API response wrapper structure
interface ApiResponseWrapper {
  data: {
    success: boolean;
    data?: {
      appointments?: unknown[];
    };
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
  const { refreshFromFirebase } = usePatientContext();
  const { ensureFirebaseAuth } = useFirebaseAuth();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [todayAppointmentCount] = useState<number | null>(null);
  const [tomorrowAppointmentCount] = useState<number | null>(null);

  const handleTestPatientSearch = async () => {
    if (!isConnected) {
      setStatusMessage('❌ Cannot search: Not connected to Tebra API');
      return;
    }

    setIsLoading(true);
    setStatusMessage('Testing patient search...');

    try {
      const response = await tebraApi.searchPatients('Test') as ApiResponseWrapper;
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
      const response = await tebraApi.getProviders() as ApiResponseWrapper;
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
      const apiResp = await tebraApi.testAppointments() as ApiResponseWrapper;
      console.log('Raw Tebra response:', apiResp);
      setStatusMessage('✅ Test complete. Check console for raw data.');

      const appointmentsData = apiResp?.data?.data as { appointments?: unknown[] } | undefined;
      const appointments = appointmentsData?.appointments || [];
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
      const apiResp = await tebraApi.syncSchedule({ date: dateToSync }) as TebraApiResponse;
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
          onClick={() => setIsConnected(true)}
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