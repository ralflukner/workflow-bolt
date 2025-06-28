/**
 * Tebra PHP API Service
 * Direct integration with PHP API endpoints instead of Firebase Functions
 */

import { secureLog } from '../utils/redact';
import { AuthBridge } from './authBridge';
import { getTebraApiConfig } from './configService';

// Configuration will be loaded dynamically
let PHP_API_BASE_URL: string | null = null;
let API_KEY: string | undefined = undefined;

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

/**
 * Ensure configuration is loaded
 */
async function ensureConfig() {
  if (PHP_API_BASE_URL === null) {
    const config = await getTebraApiConfig();
    PHP_API_BASE_URL = config.phpApiUrl;
    API_KEY = config.internalApiKey;
    secureLog('🔧 Loaded Tebra API config:', { url: PHP_API_BASE_URL, hasApiKey: !!API_KEY });
  }
}

/**
 * Make a request to the PHP API
 */
async function callPhpApi<T = unknown>(
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  data?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  try {
    await ensureConfig();
    
    let url = `${PHP_API_BASE_URL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Add API key if configured
    if (API_KEY) {
      headers['X-API-Key'] = API_KEY;
    }
    
    // Add Firebase ID token for authentication (required by security middleware)
    try {
      const authBridge = AuthBridge.getInstance();
      const firebaseToken = await authBridge.getFirebaseIdToken();
      headers['Authorization'] = `Bearer ${firebaseToken}`;
      secureLog('🔐 Added Firebase ID token to request headers');
    } catch (authError) {
      secureLog('❌ Failed to get Firebase ID token for authentication', authError);
      throw new Error('Authentication required - please sign in to access Tebra API');
    }
    
    
    const options: RequestInit = {
      method,
      headers,
    };
    
    if (method === 'POST' && data) {
      options.body = JSON.stringify(data);
    } else if (method === 'GET' && data) {
      // Add query parameters for GET requests – assume data is object of primitives
      const params = new URLSearchParams(data as Record<string, string>);
      url = `${url}?${params.toString()}`;
    }
    
    secureLog(`📡 Calling PHP API: ${endpoint}`, { method, data });
    
    const response = await fetch(url, options);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    secureLog(`✅ PHP API response: ${endpoint}`, result);
    
    return result;
  } catch (error) {
    console.error(`❌ PHP API error for ${endpoint}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Test connection to Tebra API
 */
export const tebraTestConnection = async () => {
  const response = await callPhpApi('', 'POST', {
    action: 'testConnection',
    params: {}
  });
  return { data: response };
};

/**
 * Get patient by ID
 */
export const tebraGetPatient = async (data: { patientId: string }) => {
  const response = await callPhpApi('', 'POST', {
    action: 'getPatient',
    params: data
  });
  return { data: response };
};

/**
 * Search patients by last name
 */
export const tebraSearchPatients = async (data: { lastName: string }) => {
  const response = await callPhpApi('', 'POST', {
    action: 'searchPatients',
    params: data
  });
  return { data: response };
};

/**
 * Get appointments for date range
 */
export const tebraGetAppointments = async (data: { fromDate: string; toDate: string }) => {
  const response = await callPhpApi('', 'POST', {
    action: 'getAppointments',
    params: data
  });
  return { data: response };
};

/**
 * Get all providers
 */
export const tebraGetProviders = async () => {
  const response = await callPhpApi('', 'POST', {
    action: 'getProviders',
    params: {}
  });
  return { data: response };
};

/**
 * Sync schedule for a specific date (YYYY-MM-DD)
 */
export const tebraSyncSchedule = async (date: string) => {
  const response = await callPhpApi('', 'POST', {
    action: 'syncSchedule',
    params: { date },
  });
  return { data: response };
};

/**
 * Create a new appointment
 */
export const tebraCreateAppointment = async (data: Record<string, unknown>) => {
  const response = await callPhpApi('', 'POST', {
    action: 'createAppointment',
    params: { appointmentData: data }
  });
  return { data: response };
};

/**
 * Update an existing appointment
 */
export const tebraUpdateAppointment = async (data: Record<string, unknown>) => {
  const response = await callPhpApi('', 'POST', {
    action: 'updateAppointment',
    params: { appointmentData: data }
  });
  return { data: response };
};

/**
 * Test appointments endpoint (for debugging)
 */
export const tebraTestAppointments = async () => {
  // Get today's date and tomorrow
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const fromDate = today.toISOString().split('T')[0];
  const toDate = tomorrow.toISOString().split('T')[0];
  
  return tebraGetAppointments({ fromDate, toDate });
};

/**
 * Check service health
 */
export const checkServiceHealth = async () => {
  const response = await callPhpApi('', 'POST', {
    action: 'health',
    params: {}
  });
  return { data: response };
};

// Export all functions as a namespace for compatibility
export const tebraPhpApi = {
  testConnection: tebraTestConnection,
  getPatient: tebraGetPatient,
  searchPatients: tebraSearchPatients,
  getAppointments: tebraGetAppointments,
  getProviders: tebraGetProviders,
  createAppointment: tebraCreateAppointment,
  updateAppointment: tebraUpdateAppointment,
  testAppointments: tebraTestAppointments,
  checkHealth: checkServiceHealth,
  syncSchedule: tebraSyncSchedule,
};

export default tebraPhpApi;