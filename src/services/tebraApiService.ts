/**
 * Tebra API Service
 * 
 * This service provides an interface to the Tebra API for scheduling and patient management.
 * All calls are proxied through Firebase Functions for security and HIPAA compliance.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

// Type definitions for API responses
interface TebraApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}


export interface TebraConnection {
  success: boolean;
  message: string;
  timestamp?: string;
}

export interface TebraAppointment {
  id: string;
  patientName: string;
  appointmentTime: string;
  status: string;
  type: string;
  provider?: string;
}

export interface TebraPatient {
  id: string;
  name: string;
  dateOfBirth: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface TebraSearchCriteria {
  patientName?: string;
  dateOfBirth?: string;
  phone?: string;
  appointmentDate?: string;
}

/**
 * Tebra API Service Implementation
 */
export const tebraApiService = {
  /**
   * Test connection to Tebra API
   */
  testConnection: async (): Promise<TebraConnection> => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User must be authenticated');
    }
    
    try {
      // Force token refresh to ensure it's valid
      await user.getIdToken(true);
      console.log('Got Firebase ID token for user:', user.uid);
      
      const functions = getFunctions();
      const testConnection = httpsCallable(functions, 'tebraTestConnection');
      
      console.log('Calling tebraTestConnection function...');
      const result = await testConnection();
      console.log('Function result:', result.data);
      return result.data as TebraConnection;
    } catch (error) {
      console.error('[TebraAPI] Connection test failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Get appointments for a specific date range
   */
  getAppointments: async (startDate: string, endDate?: string): Promise<TebraAppointment[]> => {
    try {
      const functions = getFunctions();
      const getAppointments = httpsCallable(functions, 'tebraGetAppointments');
      
      const result = await getAppointments({ 
        startDate, 
        endDate: endDate || startDate 
      });
      
      const response = result.data as TebraApiResponse<{ appointments: TebraAppointment[] }>;
      if (response.success) {
        return response.data?.appointments || [];
      } else {
        throw new Error(response.message || 'Failed to get appointments');
      }
    } catch (error) {
      console.error('[TebraAPI] Get appointments failed:', error);
      throw error;
    }
  },

  /**
   * Search for patients
   */
  searchPatients: async (criteria: TebraSearchCriteria): Promise<TebraPatient[]> => {
    try {
      const functions = getFunctions();
      const searchPatients = httpsCallable(functions, 'tebraSearchPatients');
      
      const result = await searchPatients(criteria);
      
      const response = result.data as TebraApiResponse<{ patients: TebraPatient[] }>;
      if (response.success) {
        return response.data?.patients || [];
      } else {
        throw new Error(response.message || 'Failed to search patients');
      }
    } catch (error) {
      console.error('[TebraAPI] Search patients failed:', error);
      throw error;
    }
  },

  /**
   * Get patient details by ID
   */
  getPatient: async (patientId: string): Promise<TebraPatient | null> => {
    try {
      const functions = getFunctions();
      const getPatient = httpsCallable(functions, 'tebraGetPatient');
      
      const result = await getPatient({ patientId });
      
      const response = result.data as TebraApiResponse<{ patient: TebraPatient }>;
      if (response.success) {
        return response.data?.patient || null;
      } else {
        throw new Error(response.message || 'Failed to get patient');
      }
    } catch (error) {
      console.error('[TebraAPI] Get patient failed:', error);
      throw error;
    }
  },

  /**
   * Sync schedule data from Tebra
   */
  syncSchedule: async (date: string): Promise<{ success: boolean; message?: string; count?: number }> => {
    try {
      const functions = getFunctions();
      const syncSchedule = httpsCallable(functions, 'tebraSyncTodaysSchedule');
      
      const result = await syncSchedule({ date });
      return result.data as TebraApiResponse<{ count?: number }>;
    } catch (error) {
      console.error('[TebraAPI] Sync schedule failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Sync failed'
      };
    }
  },

  /**
   * Create a new patient
   */
  createPatient: async (patientData: Omit<TebraPatient, 'id'>): Promise<TebraPatient> => {
    try {
      const functions = getFunctions();
      const createPatient = httpsCallable(functions, 'tebraCreatePatient');
      
      const result = await createPatient(patientData);
      
      const response = result.data as TebraApiResponse<{ patient: TebraPatient }>;
      if (response.success) {
        return response.data!.patient;
      } else {
        throw new Error(response.message || 'Failed to create patient');
      }
    } catch (error) {
      console.error('[TebraAPI] Create patient failed:', error);
      throw error;
    }
  },

  /**
   * Update patient information
   */
  updatePatient: async (patientId: string, updates: Partial<TebraPatient>): Promise<TebraPatient> => {
    try {
      const functions = getFunctions();
      const updatePatient = httpsCallable(functions, 'tebraUpdatePatient');
      
      const result = await updatePatient({ patientId, updates });
      
      const response = result.data as TebraApiResponse<{ patient: TebraPatient }>;
      if (response.success) {
        return response.data!.patient;
      } else {
        throw new Error(response.message || 'Failed to update patient');
      }
    } catch (error) {
      console.error('[TebraAPI] Update patient failed:', error);
      throw error;
    }
  },

  /**
   * Get real-time connection status
   */
  getConnectionStatus: async (): Promise<{ connected: boolean; lastSync?: string; error?: string }> => {
    try {
      const functions = getFunctions();
      const getStatus = httpsCallable(functions, 'tebraGetStatus');
      
      const result = await getStatus();
      const response = result.data as TebraApiResponse<{ connected: boolean; lastSync?: string }>;
      return {
        connected: response.success && !!response.data?.connected,
        lastSync: response.data?.lastSync,
        error: response.message
      };
    } catch (error) {
      console.error('[TebraAPI] Get status failed:', error);
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Status check failed'
      };
    }
  },

  /**
   * Run comprehensive PHP proxy diagnostics
   */
  debugPhpProxy: async (): Promise<any> => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User must be authenticated');
    }
    
    try {
      await user.getIdToken(true);
      console.log('Running PHP proxy diagnostics for user:', user.uid);
      
      const functions = getFunctions();
      const debugPhpProxy = httpsCallable(functions, 'tebraDebugPhpProxy');
      
      const result = await debugPhpProxy();
      console.log('PHP proxy diagnostics result:', result.data);
      return result.data;
    } catch (error) {
      console.error('[TebraAPI] PHP proxy diagnostics failed:', error);
      throw error;
    }
  }
};

export default tebraApiService;