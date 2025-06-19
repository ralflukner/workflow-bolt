/**
 * Tebra PHP API Service
 * Direct integration with PHP API endpoints instead of Firebase Functions
 */

import { secureLog } from '../utils/redact';
import { getTebraApiConfig } from './configService';

// Configuration will be loaded dynamically
let PHP_API_BASE_URL: string | null = null;
let API_KEY: string | undefined = undefined;

interface ApiResponse<T = any> {
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
async function callPhpApi<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  data?: any
): Promise<ApiResponse<T>> {
  try {
    await ensureConfig();
    
    const url = `${PHP_API_BASE_URL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Add API key if configured
    if (API_KEY) {
      headers['X-API-Key'] = API_KEY;
    }
    
    const options: RequestInit = {
      method,
      headers,
    };
    
    if (method === 'POST' && data) {
      options.body = JSON.stringify(data);
    } else if (method === 'GET' && data) {
      // Add query parameters for GET requests
      const params = new URLSearchParams(data);
      url.concat('?' + params.toString());
    }
    
    secureLog('📡 Calling PHP API:', endpoint, { method, data });
    
    const response = await fetch(url, options);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    secureLog('✅ PHP API response:', endpoint, result);
    
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
  const response = await callPhpApi('/testConnection');
  return { data: response };
};

/**
 * Get patient by ID
 */
export const tebraGetPatient = async (data: { patientId: string }) => {
  const response = await callPhpApi('/getPatient', 'POST', data);
  return { data: response };
};

/**
 * Search patients by last name
 */
export const tebraSearchPatients = async (data: { lastName: string }) => {
  const response = await callPhpApi('/searchPatients', 'POST', data);
  return { data: response };
};

/**
 * Get appointments for date range
 */
export const tebraGetAppointments = async (data: { fromDate: string; toDate: string }) => {
  const response = await callPhpApi('/getAppointments', 'POST', data);
  return { data: response };
};

/**
 * Get all providers
 */
export const tebraGetProviders = async () => {
  const response = await callPhpApi('/getProviders');
  return { data: response };
};

/**
 * Create a new appointment
 */
export const tebraCreateAppointment = async (data: any) => {
  const response = await callPhpApi('/createAppointment', 'POST', data);
  return { data: response };
};

/**
 * Update an existing appointment
 */
export const tebraUpdateAppointment = async (data: any) => {
  const response = await callPhpApi('/updateAppointment', 'POST', data);
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
  const response = await callPhpApi('/health', 'GET');
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
};

export default tebraPhpApi;