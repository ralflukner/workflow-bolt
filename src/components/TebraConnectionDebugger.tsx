import React, { useState, useEffect } from 'react';
import { tebraApiService } from '../services/tebraApiService';
import { app, isFirebaseConfigured } from '../config/firebase';
import { getFunctions } from 'firebase/functions';
import { checkFirebaseEnvVars } from '../utils/envUtils';

interface DebugInfo {
  firebaseConfigured: boolean;
  firebaseApp: boolean;
  functionsInstance: boolean;
  envVarsLoaded: string[];
  missingEnvVars: string[];
  connectionTest: {
    status: 'pending' | 'success' | 'failed';
    error?: string;
    duration?: number;
  };
}

export const TebraConnectionDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    firebaseConfigured: false,
    firebaseApp: false,
    functionsInstance: false,
    envVarsLoaded: [],
    missingEnvVars: [],
    connectionTest: { status: 'pending' as const }  // Note: this should be 'idle' or undefined initially
  });

  const [showDebug, setShowDebug] = useState(false);

  // Debug effect to monitor state changes
  useEffect(() => {
    console.log('TebraConnectionDebugger state updated:', {
      connectionTestStatus: debugInfo.connectionTest.status,
      fullDebugInfo: debugInfo
    });
  }, [debugInfo]);

  useEffect(() => {
    const checkEnvironment = () => {
      const { loaded, missing } = checkFirebaseEnvVars();

      let functionsInstance = false;
      try {
        if (app) {
          getFunctions(app);
          functionsInstance = true;
        }
      } catch (error) {
        console.error('Functions instance error:', error);
      }

      setDebugInfo(prev => ({
        ...prev,
        firebaseConfigured: isFirebaseConfigured(),
        firebaseApp: !!app,
        functionsInstance,
        envVarsLoaded: loaded,
        missingEnvVars: missing
      }));
    };

    checkEnvironment();
  }, []);

  const testConnection = async () => {
    console.log('TebraConnectionDebugger: Starting test connection');
    
    // First, let's test if state updates work at all
    setDebugInfo(prev => ({
      ...prev,
      connectionTest: { status: 'pending' }
    }));

    // Add a small delay to ensure the pending state renders
    await new Promise(resolve => setTimeout(resolve, 100));

    const startTime = Date.now();
    try {
      const result = await tebraApiService.testConnection();
      const duration = Date.now() - startTime;
      console.log('TebraConnectionDebugger: Test result:', result, 'Duration:', duration);

      // Force a complete new object to ensure React detects the change
      setDebugInfo(prev => {
        const newState = {
          ...prev,
          connectionTest: {
            status: result ? 'success' : 'failed',
            duration,
            error: result ? undefined : 'Connection returned false'
          }
        };
        console.log('Setting new state:', newState);
        return newState;
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('TebraConnectionDebugger: Test failed:', error);
      
      setDebugInfo(prev => {
        const newState = {
          ...prev,
          connectionTest: {
            status: 'failed',
            duration,
            error: error instanceof Error ? error.message : String(error)
          }
        };
        console.log('Setting error state:', newState);
        return newState;
      });
    }
  };

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        className="text-xs text-gray-400 hover:text-gray-300 underline"
      >
        Debug Connection
      </button>
    );
  }

  return (
    <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-white">Firebase Connection Debug</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-gray-400 hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 text-xs">
        {/* Firebase Configuration */}
        <div>
          <h4 className="font-medium text-gray-200 mb-1">Firebase Setup</h4>
          <div className="space-y-1">
            <div className={`flex items-center gap-2 ${debugInfo.firebaseConfigured ? 'text-green-400' : 'text-red-400'}`}>
              <span>{debugInfo.firebaseConfigured ? '✅' : '❌'}</span>
              <span>Firebase Configured: {debugInfo.firebaseConfigured ? 'Yes' : 'No'}</span>
            </div>
            <div className={`flex items-center gap-2 ${debugInfo.firebaseApp ? 'text-green-400' : 'text-red-400'}`}>
              <span>{debugInfo.firebaseApp ? '✅' : '❌'}</span>
              <span>Firebase App: {debugInfo.firebaseApp ? 'Initialized' : 'Not initialized'}</span>
            </div>
            <div className={`flex items-center gap-2 ${debugInfo.functionsInstance ? 'text-green-400' : 'text-red-400'}`}>
              <span>{debugInfo.functionsInstance ? '✅' : '❌'}</span>
              <span>Functions Instance: {debugInfo.functionsInstance ? 'Available' : 'Not available'}</span>
            </div>
          </div>
        </div>

        {/* Environment Variables */}
        <div>
          <h4 className="font-medium text-gray-200 mb-1">Environment Variables</h4>
          <div className="space-y-1">
            <div className="text-green-400">
              ✅ Loaded ({debugInfo.envVarsLoaded.length}): {debugInfo.envVarsLoaded.join(', ')}
            </div>
            {debugInfo.missingEnvVars.length > 0 && (
              <div className="text-red-400">
                ❌ Missing ({debugInfo.missingEnvVars.length}): {debugInfo.missingEnvVars.join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* Connection Test */}
        <div>
          <h4 className="font-medium text-gray-200 mb-1">Connection Test</h4>
          <button
            onClick={testConnection}
            disabled={debugInfo.connectionTest.status === 'pending'}
            className="mb-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded text-xs"
          >
            {debugInfo.connectionTest.status === 'pending' ? 'Testing...' : 'Test Now'}
          </button>

          <div className="space-y-1">
            {/* Debug log removed for production */}
            <div className={`flex items-center gap-2 ${
              debugInfo.connectionTest.status === 'success' ? 'text-green-400' :
              debugInfo.connectionTest.status === 'failed' ? 'text-red-400' :
              'text-yellow-400'
            }`}>
              <span>
                {debugInfo.connectionTest.status === 'success' ? '✅' :
                 debugInfo.connectionTest.status === 'failed' ? '❌' : '⏳'}
              </span>
              <span>
                Status: {debugInfo.connectionTest.status}
                {debugInfo.connectionTest.duration && ` (${debugInfo.connectionTest.duration}ms)`}
              </span>
            </div>
            {debugInfo.connectionTest.error && (
              <div className="text-red-400 text-xs bg-red-900/20 p-2 rounded">
                Error: {debugInfo.connectionTest.error}
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h4 className="font-medium text-gray-200 mb-1">Recommendations</h4>
          <div className="text-gray-300 space-y-1">
            {debugInfo.missingEnvVars.length > 0 && (
              <div>• Check .envrc file and run: <code className="bg-gray-800 px-1 rounded">direnv allow</code></div>
            )}
            {!debugInfo.firebaseConfigured && (
              <div>• Firebase configuration is missing or invalid</div>
            )}
            {debugInfo.connectionTest.status === 'failed' && (
              <div>• Functions may require authentication or billing setup</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 
