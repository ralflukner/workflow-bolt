/**
 * Tebra API Service - Firebase Functions Proxy
 * Routes through Firebase Functions /api/tebra instead of direct PHP calls
 */

import { secureLog } from '../utils/redact';
import { AuthBridge } from './authBridge';

const FIREBASE_FUNCTIONS_URL = 'https://api-xccvzgogwa-uc.a.run.app';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

/**
 * Make a request to the Firebase Functions /api/tebra endpoint
 */
async function callFirebaseTebraApi<T = unknown>(
  action: string,
  params: Record<string, unknown> = {}
): Promise<ApiResponse<T>> {
  try {
    const authBridge = AuthBridge.getInstance();
    const token = await authBridge.getFirebaseIdToken();
    
    if (!token) {
      throw new Error('No Firebase authentication token available');
    }

    const url = `${FIREBASE_FUNCTIONS_URL}/api/tebra`;
    secureLog('🔄 Calling Firebase Functions Tebra API:', { action, url });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action, params })
    });

    if (!response.ok) {
      const errorText = await response.text();
      secureLog('❌ Firebase API error:', { status: response.status, error: errorText });
      throw new Error(`Firebase API request failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    
    // Log response metadata without redacting the actual data
    console.log('✅ Firebase API response metadata:', { 
      success: result.success, 
      hasData: !!result.data,
      dataKeys: result.data ? Object.keys(result.data) : [],
      dataSize: result.data ? JSON.stringify(result.data).length : 0,
      timestamp: new Date().toISOString()
    });
    
    return result;
  } catch (error) {
    secureLog('❌ Firebase API error:', error);
    throw error;
  }
}

/**
 * Test Tebra connection
 */
export async function tebraTestConnection(): Promise<ApiResponse> {
  return callFirebaseTebraApi('testConnection');
}

/**
 * Get patient by ID
 */
export async function tebraGetPatient(patientId: string): Promise<ApiResponse> {
  return callFirebaseTebraApi('getPatient', { patientId });
}

/**
 * Search patients by last name
 */
export async function tebraSearchPatients(lastName: string): Promise<ApiResponse> {
  return callFirebaseTebraApi('searchPatients', { lastName });
}

/**
 * Get appointments for date range
 */
export async function tebraGetAppointments(params: {
  fromDate: string;
  toDate: string;
}): Promise<ApiResponse> {
  return callFirebaseTebraApi('getAppointments', params);
}

/**
 * Get providers list
 */
export async function tebraGetProviders(): Promise<ApiResponse> {
  return callFirebaseTebraApi('getProviders');
}

/**
 * Create new appointment
 */
export async function tebraCreateAppointment(appointmentData: Record<string, unknown>): Promise<ApiResponse> {
  return callFirebaseTebraApi('createAppointment', appointmentData);
}

/**
 * Update existing appointment
 */
export async function tebraUpdateAppointment(appointmentData: Record<string, unknown>): Promise<ApiResponse> {
  return callFirebaseTebraApi('updateAppointment', appointmentData);
}

/**
 * Test appointments endpoint
 */
export async function tebraTestAppointments(): Promise<ApiResponse> {
  return callFirebaseTebraApi('testAppointments');
}

/**
 * Sync schedule for a specific date
 */
export async function tebraSyncSchedule(params: { date: string }): Promise<ApiResponse> {
  return callFirebaseTebraApi('syncSchedule', params);
}

// Export configuration info
export const getApiInfo = () => ({
  usingFirebaseProxy: true,
  apiType: 'Firebase Functions -> PHP Cloud Run',
  message: 'Using Firebase Functions as proxy to PHP Tebra API',
});

// Log that we're using Firebase proxy
console.log('🔌 Tebra API: Using Firebase Functions proxy to PHP service');

// Browser console helper for inspecting appointment data (production safe)
(window as any).tebraDebug = {
  async getAppointments(fromDate: string, toDate: string) {
    const result = await tebraGetAppointments({ fromDate, toDate });
    // Handle double-nested structure: result.data.data contains the actual SOAP response
    const soapData = result.data?.data;
    console.log('Raw appointment response (unredacted):', {
      success: result.success,
      dataPresent: !!result.data,
      soapDataPresent: !!soapData,
      appointmentCount: soapData?.GetAppointmentsResult?.Appointments?.length || 0,
      firstAppointment: soapData?.GetAppointmentsResult?.Appointments?.[0],
      securityResponse: soapData?.GetAppointmentsResult?.SecurityResponse,
      fullStructure: {
        topLevel: Object.keys(result),
        dataLevel: result.data ? Object.keys(result.data) : [],
        soapLevel: soapData ? Object.keys(soapData) : []
      }
    });
    return result;
  },
  
  async testConnection() {
    const result = await tebraTestConnection();
    // Handle double-nested structure: result.data.data contains the actual SOAP response
    const soapData = result.data?.data;
    console.log('Raw connection test response (unredacted):', {
      success: result.success,
      dataPresent: !!result.data,
      soapDataPresent: !!soapData,
      providerCount: soapData?.GetProvidersResult?.Providers?.ProviderData?.length || 0,
      securityResponse: soapData?.GetProvidersResult?.SecurityResponse,
      fullStructure: {
        topLevel: Object.keys(result),
        dataLevel: result.data ? Object.keys(result.data) : [],
        soapLevel: soapData ? Object.keys(soapData) : []
      }
    });
    return result;
  }
};

export default {
  testConnection: tebraTestConnection,
  getPatient: tebraGetPatient,
  searchPatients: tebraSearchPatients,
  getAppointments: tebraGetAppointments,
  getProviders: tebraGetProviders,
  createAppointment: tebraCreateAppointment,
  updateAppointment: tebraUpdateAppointment,
  testAppointments: tebraTestAppointments,
  syncSchedule: tebraSyncSchedule,
  getApiInfo,
};