import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTimeContext } from '../hooks/useTimeContext';
import { TebraIntegrationService, SyncResult, createTebraConfig } from '../tebra-soap/tebra-integration-service';
import { TebraCredentials } from '../tebra-soap/tebra-api-service.types';

const TebraIntegration: React.FC = () => {
  const { getCurrentTime, timeMode } = useTimeContext();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [integrationService, setIntegrationService] = useState<TebraIntegrationService | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const credentials = useMemo<TebraCredentials>(() => ({
    username: process.env.VITE_TEBRA_USERNAME || '',
    password: process.env.VITE_TEBRA_PASSWORD || '',
    customerKey: process.env.VITE_TEBRA_CUSTOMER_KEY || '',
    wsdlUrl: process.env.VITE_TEBRA_WSDL_URL || '',
  }), []);

  // Initialize default date using useMemo instead of useEffect
  React.useMemo(() => {
    const currentDate = getCurrentTime();
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  }, [getCurrentTime]);

  // Use React Query for Tebra service initialization
  const { data: tebraService } = useQuery({
    queryKey: ['tebraService', credentials],
    queryFn: async () => {
      // Check if credentials are properly configured
      if (!credentials.username || !credentials.password || !credentials.wsdlUrl) {
        console.warn('Tebra credentials missing. Please set VITE_TEBRA_USERNAME, VITE_TEBRA_PASSWORD, and VITE_TEBRA_WSDL_URL in .env.local');
        setStatusMessage('Tebra credentials not configured - environment variables missing');
        setIsConnected(false);
        return null;
      }
      
      // Validate credential format
      if (credentials.username.trim() === '' || 
          credentials.password.trim() === '' || 
          credentials.wsdlUrl.trim() === '') {
        setStatusMessage('Tebra credentials are invalid - check environment variables');
        console.warn('Tebra credentials are empty or invalid. Please check your environment variables.');
        setIsConnected(false);
        return null;
      }

      try {
        const config = createTebraConfig(credentials, {
          syncInterval: 30, // 30 minutes
          lookAheadDays: 7, // 1 week ahead
          autoSync: false, // Manual sync only
          fallbackToMockData: true
        });

        const service = new TebraIntegrationService(config);
        const initialized = await service.initialize();
        
        setIntegrationService(service);
        setIsConnected(initialized && service.isApiConnected());
        
        if (initialized) {
          setStatusMessage('Connected to Tebra EHR');
        } else {
          setStatusMessage('Connected with fallback mode (API unavailable)');
        }
        
        return service;
      } catch (error) {
        console.error('Failed to initialize Tebra integration:', error);
        setStatusMessage('Failed to connect to Tebra EHR');
        setIsConnected(false);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true
  });

  // Cleanup function using ref pattern
  React.useRef(() => {
    return () => {
      tebraService?.cleanup();
    };
  }).current;

  const handleImportFromTebra = async () => {
    if (!integrationService) {
      setStatusMessage('Integration service not initialized. Please check environment variables and reload.');
      console.error('Attempted to import from Tebra but integration service is not initialized');
      return;
    }

    setIsLoading(true);
    setStatusMessage('Importing schedule from Tebra EHR...');

    try {
      const result = await integrationService.forceSync();
      setLastSyncResult(result);

      if (result.success) {
        setStatusMessage(
          `Successfully imported ${result.appointmentsFound} appointments and ${result.patientsFound} patients from Tebra EHR`
        );
        
        // Refresh the current patient list
        try {
          window.location.reload(); // Simple refresh - could be improved with context refresh
        } catch {
          console.log('Page reload not available in test environment');
        }
      } else {
        setStatusMessage(`Import failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Import failed:', error);
      setStatusMessage(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportToTebra = async () => {
    setIsLoading(true);
    setStatusMessage('Export to Tebra EHR is not yet implemented');
    
    // TODO: Implement export functionality
    // This would require Tebra API methods to create/update appointments
    
    setTimeout(() => {
      setIsLoading(false);
      setStatusMessage('Export functionality coming soon');
    }, 1000);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const formatSyncResult = (result: SyncResult) => {
    const date = result.lastSyncTime.toLocaleString();
    if (result.success) {
      return `Last sync: ${date} - ${result.appointmentsFound} appointments, ${result.patientsFound} patients`;
    } else {
      return `Last sync: ${date} - Failed (${result.errors.length} errors)`;
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
        <span className="mr-2">🏥</span>
        Tebra EHR Integration
        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
          isConnected ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
        }`}>
          {isConnected ? 'Connected' : 'Fallback Mode'}
        </span>
      </h2>

      <div className="space-y-4">
        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Date {timeMode.simulated ? '(Simulated Time)' : '(Real Time)'}
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={handleImportFromTebra}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span>📥</span>
            )}
            <span>Import from Tebra</span>
          </button>

          <button
            onClick={handleExportToTebra}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span>📤</span>
            )}
            <span>Export to Tebra</span>
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="bg-gray-700 rounded-lg p-3">
            <p className="text-gray-300 text-sm">{statusMessage}</p>
          </div>
        )}

        {/* Last Sync Result */}
        {lastSyncResult && (
          <div className="bg-gray-700 rounded-lg p-3">
            <h4 className="text-white font-medium mb-2">Last Sync Result</h4>
            <p className="text-gray-300 text-sm">{formatSyncResult(lastSyncResult)}</p>
            {lastSyncResult.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-red-400 text-sm font-medium">Errors:</p>
                <ul className="text-red-300 text-xs ml-4">
                  {lastSyncResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Connection Info */}
        <div className="bg-gray-700 rounded-lg p-3">
          <h4 className="text-white font-medium mb-2">Connection Info</h4>
          <div className="text-gray-300 text-sm space-y-1">
            <p>User: {credentials.username ? '***@luknerclinic.com' : 'Not configured'}</p>
            <p>Status: {isConnected ? 'API Connected' : 'Using Fallback Data'}</p>
            <p>Current Mode: {timeMode.simulated ? 'Simulated Time' : 'Real Time'}</p>
          </div>
        </div>

        {/* Rate Limiting Info */}
        <div className="bg-gray-700 rounded-lg p-3">
          <h4 className="text-white font-medium mb-2">Rate Limiting</h4>
          <div className="text-gray-300 text-sm space-y-1">
            <p>✅ Tebra API rate limits are automatically enforced</p>
            <p>• GetPatient: 1 call every ¼ second</p>
            <p>• GetAppointments: 1 call per second</p>
            <p>• GetProviders: 1 call every ½ second</p>
            <p>• SearchPatient: 1 call every ¼ second</p>
            <p className="text-xs text-gray-400 mt-2">
              All API calls automatically wait for appropriate intervals to comply with Tebra's documented rate limits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TebraIntegration;          