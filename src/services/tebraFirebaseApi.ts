/**
 * Tebra API Service - Firebase Functions Callable Proxy
 * Uses a unified proxy pattern with a single Firebase Function (tebraProxy)
 */

import { getFunctions, httpsCallable, Functions, HttpsCallable } from 'firebase/functions';
import { secureLog } from '../utils/redact';
import { getApps } from 'firebase/app';
import { initializeFirebase, isFirebaseConfigured } from '../config/firebase';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

interface TebraProxyPayload {
  action: string;
  [key: string]: unknown;
}

interface NestedApiResponse {
  success: boolean;
  data: {
    data: unknown;
  };
  error?: string;
  message?: string;
  timestamp?: string;
}

// Helper to make sure a Firebase app exists before using getFunctions
async function ensureFirebaseInitialized(): Promise<void> {
  if (isFirebaseConfigured() || getApps().length > 0) return;
  await initializeFirebase();
}

// Get Firebase functions instance
let functionsInstance: Functions | null = null;
async function getFunctionsInstance(): Promise<Functions> {
  if (!functionsInstance) {
    await ensureFirebaseInitialized();
    functionsInstance = getFunctions();
  }
  return functionsInstance;
}

// Define the single unified proxy function
let tebraProxyFunction: HttpsCallable | null = null;
async function getTebraProxyFunction(): Promise<HttpsCallable> {
  if (!tebraProxyFunction) {
    const functions = await getFunctionsInstance();
    tebraProxyFunction = httpsCallable(functions, 'tebraProxy');
  }
  return tebraProxyFunction;
}

/**
 * Type guard to check if response has nested data structure
 */
function isNestedApiResponse(response: ApiResponse): response is NestedApiResponse {
  return (
    response && 
    typeof response === 'object' && 
    'data' in response && 
    response.data !== null &&
    typeof response.data === 'object' && 
    'data' in response.data
  );
}

/**
 * Generic function to call Tebra through Firebase Functions -> PHP proxy
 * ALL Tebra API calls go through this single function
 */
async function callTebraProxy(action: string, params: Record<string, unknown> = {}): Promise<ApiResponse> {
  try {
    const payload: TebraProxyPayload = {
      action,  // This determines what the PHP proxy will do
      ...params
    };
    
    secureLog(`📤 Calling Tebra proxy with action: ${action}`, payload);
    
    const tebraProxy = await getTebraProxyFunction();
    const result = await tebraProxy(payload);
    
    // Handle the response - check if it's wrapped or direct
    const response = result.data as ApiResponse;
    secureLog(`📥 Tebra proxy response for ${action}:`, response);
    
    // Check for nested data structure (result.data.data)
    if (isNestedApiResponse(response)) {
      // Handle double-nested structure
      return {
        success: response.success,
        data: response.data.data,
        error: response.error,
        message: response.message,
        timestamp: response.timestamp
      };
    }
    
    return response;
  } catch (error: unknown) {
    secureLog(`❌ Tebra proxy error for ${action}:`, error);
    
    // Extract meaningful error message
    let errorMessage = 'Unknown error';
    
    if (error && typeof error === 'object') {
      const errorObj = error as { code?: string; message?: string };
      
      if (errorObj.code === 'functions/unauthenticated') {
        errorMessage = 'User authentication required - please log in';
      } else if (errorObj.message?.includes('Unauthorized') || errorObj.message?.includes('401')) {
        errorMessage = 'API authentication failed - Firebase Function API key issue';
      } else if (errorObj.message?.includes('timeout')) {
        errorMessage = 'Request timeout - Tebra API may be slow';
      } else if (errorObj.message) {
        errorMessage = errorObj.message;
      }
    }
    
    // Format error response
    return {
      success: false,
      error: errorMessage,
      message: `Failed to execute ${action}: ${errorMessage}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test Tebra connection using getProviders as health check
 */
export async function tebraTestConnection(): Promise<ApiResponse> {
  try {
    // Use getProviders as a connection test since testConnection might not exist
    const result = await callTebraProxy('getProviders');
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: 'Connection successful',
        timestamp: new Date().toISOString()
      };
    }
    
    return result;
  } catch (error) {
    secureLog('❌ Tebra connection test failed:', error);
    return {
      success: false,
      error: 'Connection test failed',
      message: 'Failed to connect to Tebra',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get patient by ID
 */
export async function tebraGetPatient(patientId: string): Promise<ApiResponse> {
  return callTebraProxy('getPatient', { patientId });
}

/**
 * Search patients by last name
 */
export async function tebraSearchPatients(lastName: string): Promise<ApiResponse> {
  return callTebraProxy('searchPatients', { lastName });
}

/**
 * Get all patients (with optional filters)
 */
export async function tebraGetPatients(filters?: Record<string, unknown>): Promise<ApiResponse> {
  return callTebraProxy('getPatients', { filters });
}

/**
 * Get appointments for date range
 */
export async function tebraGetAppointments(params: { fromDate: string; toDate: string }): Promise<ApiResponse> {
  return callTebraProxy('getAppointments', params);
}

/**
 * Get providers list
 */
export async function tebraGetProviders(): Promise<ApiResponse> {
  return callTebraProxy('getProviders');
}

/**
 * Create new appointment
 */
export async function tebraCreateAppointment(appointmentData: Record<string, unknown>): Promise<ApiResponse> {
  return callTebraProxy('createAppointment', { appointmentData });
}

/**
 * Update existing appointment
 */
export async function tebraUpdateAppointment(appointmentData: Record<string, unknown>): Promise<ApiResponse> {
  return callTebraProxy('updateAppointment', { appointmentData });
}

/**
 * Test appointments endpoint
 */
export async function tebraTestAppointments(): Promise<ApiResponse> {
  // Use getAppointments with a test date range
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return tebraGetAppointments({
    fromDate: today.toISOString().split('T')[0],
    toDate: tomorrow.toISOString().split('T')[0]
  });
}

/**
 * Sync schedule for a specific date
 */
export async function tebraSyncSchedule(params: { date: string }): Promise<ApiResponse> {
  return callTebraProxy('syncSchedule', params);
}

/**
 * Health check for the entire chain
 */
export async function tebraHealthCheck(): Promise<ApiResponse> {
  try {
    // First check if Firebase Functions are responsive
    const healthResult = await callTebraProxy('healthCheck');
    
    // Then check PHP proxy connection using getProviders
    const proxyHealth = await tebraTestConnection();
    
    return {
      success: proxyHealth.success,
      data: {
        firebase: healthResult.data || { status: 'healthy' },
        phpProxy: proxyHealth.success ? 'Connected' : 'Failed',
        tebra: proxyHealth.success ? 'Connected' : 'Unknown',
        error: proxyHealth.error
      },
      message: proxyHealth.success ? 'All systems operational' : `Connection issues: ${proxyHealth.error}`,
      timestamp: new Date().toISOString()
    };
  } catch (error: unknown) {
    const errorMessage = error && typeof error === 'object' && 'message' in error 
      ? (error as { message: string }).message 
      : 'Unknown error';
      
    return {
      success: false,
      error: errorMessage,
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    };
  }
}

// Export configuration info
export const getApiInfo = () => ({
  usingFirebaseProxy: true,
  apiType: 'Firebase Functions -> PHP Cloud Run -> Tebra SOAP',
  firebaseFunctionsUrl: import.meta.env.VITE_FIREBASE_FUNCTIONS_URL || 'https://us-central1-luknerlumina-firebase.cloudfunctions.net',
  phpProxyUrl: import.meta.env.VITE_TEBRA_CLOUD_RUN_URL || 'https://tebra-php-api-623450773640.us-central1.run.app',
  redisEventBusUrl: import.meta.env.VITE_REDIS_SSE_URL || null,
  projectId: 'luknerlumina-firebase',
  unifiedProxy: true,
  message: 'Using single Firebase Function (tebraProxy) as unified proxy to PHP Tebra API',
});

// Log configuration
console.log('🔌 Tebra API: Using unified Firebase Function proxy to PHP service');
console.log('📍 Configuration:', getApiInfo());

interface TebraDebugTools {
  config: () => ReturnType<typeof getApiInfo>;
  testChain: () => Promise<ApiResponse>;
  getAppointments: (fromDate: string, toDate: string) => Promise<ApiResponse>;
  testConnection: () => Promise<ApiResponse>;
  getProviders: () => Promise<ApiResponse>;
  getPatients: () => Promise<ApiResponse>;
}

interface AppointmentData {
  appointments?: unknown[];
  GetAppointmentsResult?: {
    Appointments?: unknown[];
  };
}

interface ProviderData {
  providers?: unknown[];
  GetProvidersResult?: {
    Providers?: {
      ProviderData?: unknown[];
    };
  };
}

// Browser console helper for debugging (production safe)
(window as unknown as Window & { tebraDebug: TebraDebugTools }).tebraDebug = {
  // Get configuration info
  config: getApiInfo,
  
  // Test the complete chain
  async testChain() {
    console.log('🔍 Testing Tebra integration chain...');
    const health = await tebraHealthCheck();
    console.log('Health check result:', health);
    return health;
  },
  
  // Get appointments with detailed logging
  async getAppointments(fromDate: string, toDate: string) {
    console.log(`📅 Getting appointments from ${fromDate} to ${toDate}`);
    const result = await tebraGetAppointments({ fromDate, toDate });
    
    // Handle the response structure
    const appointmentData = result.data as AppointmentData;
    console.log('Raw appointment response:', {
      success: result.success,
      error: result.error,
      dataPresent: !!result.data,
      appointmentCount: Array.isArray(result.data) ? result.data.length : 
                       appointmentData?.appointments?.length || 
                       appointmentData?.GetAppointmentsResult?.Appointments?.length || 0,
      firstAppointment: Array.isArray(result.data) ? result.data[0] :
                       appointmentData?.appointments?.[0] ||
                       appointmentData?.GetAppointmentsResult?.Appointments?.[0],
      fullResponse: result
    });
    return result;
  },
  
  // Test connection with detailed logging
  async testConnection() {
    console.log('🔌 Testing Tebra connection...');
    const result = await tebraTestConnection();
    
    const providerData = result.data as ProviderData;
    console.log('Connection test response:', {
      success: result.success,
      error: result.error,
      dataPresent: !!result.data,
      providerCount: Array.isArray(result.data) ? result.data.length :
                    providerData?.providers?.length || 
                    providerData?.GetProvidersResult?.Providers?.ProviderData?.length || 0,
      firstProvider: Array.isArray(result.data) ? result.data[0] :
                    providerData?.providers?.[0] ||
                    providerData?.GetProvidersResult?.Providers?.ProviderData?.[0],
      fullResponse: result
    });
    return result;
  },
  
  // Get providers with detailed logging
  async getProviders() {
    console.log('👥 Getting providers...');
    const result = await tebraGetProviders();
    console.log('Providers response:', result);
    return result;
  },
  
  // Get patients with detailed logging
  async getPatients() {
    console.log('🏥 Getting patients...');
    const result = await tebraGetPatients();
    console.log('Patients response:', result);
    return result;
  }
};

// Export the main API object
export const tebraApi = {
  testConnection: tebraTestConnection,
  getPatient: tebraGetPatient,
  searchPatients: tebraSearchPatients,
  getPatients: tebraGetPatients,
  getAppointments: tebraGetAppointments,
  getProviders: tebraGetProviders,
  createAppointment: tebraCreateAppointment,
  updateAppointment: tebraUpdateAppointment,
  testAppointments: tebraTestAppointments,
  syncSchedule: tebraSyncSchedule,
  healthCheck: tebraHealthCheck,
  getApiInfo,
};

// Default export for backward compatibility
export default tebraApi;