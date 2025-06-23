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
    secureLog('✅ Firebase API response:', { success: result.success });
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