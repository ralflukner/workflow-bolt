import { httpsCallable, getFunctions } from 'firebase/functions';
import { app, isFirebaseConfigured } from '../config/firebase';

// Gracefully handle environments where Firebase Functions are unavailable (e.g., unit tests)
let functionsInstance: ReturnType<typeof getFunctions> | undefined;

if (isFirebaseConfigured && app) {
  try {
    functionsInstance = getFunctions(app);
  } catch (error) {
    console.warn('⚠️  Unable to initialize Firebase Functions instance:', error);
  }
} else {
  console.info('ℹ️  Firebase not configured – Tebra API service will use stubbed functions.');
}

// Utility to create a callable or a fallback stub
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createCallable = (name: string): any => {
  if (functionsInstance) {
    return httpsCallable(functionsInstance, name);
  }
  // Return a stub that mimics httpsCallable interface
  return async () => ({
    data: {
      success: false,
      message: `Firebase Functions unavailable – attempted to call ${name}`,
    },
  });
};

// Create a unified object containing either real or stubbed callables
const callableWrapper = {
  tebraTestConnection: createCallable('tebraTestConnection'),
  tebraGetPatient: createCallable('tebraGetPatient'),
  tebraSearchPatients: createCallable('tebraSearchPatients'),
  tebraGetAppointments: createCallable('tebraGetAppointments'),
  tebraGetProviders: createCallable('tebraGetProviders'),
  tebraCreateAppointment: createCallable('tebraCreateAppointment'),
  tebraUpdateAppointment: createCallable('tebraUpdateAppointment'),
  tebraSyncTodaysSchedule: createCallable('tebraSyncTodaysSchedule'),
};

// Define types for Tebra data
export interface TebraPatient {
  PatientId: string;
  FirstName: string;
  LastName: string;
  DateOfBirth: string;
  Phone: string;
  Email: string;
}

export interface TebraAppointment {
  AppointmentId: string;
  PatientId: string;
  ProviderId: string;
  AppointmentDate: string;
  AppointmentTime: string;
  AppointmentType: string;
  Status: string;
}

export interface TebraProvider {
  ProviderId: string;
  FirstName: string;
  LastName: string;
  Title: string;
}

export interface SearchCriteria {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface SyncResponse {
  success: boolean;
  patients?: unknown[];
  message?: string;
}

/**
 * Client-side service for Tebra EHR integration via Firebase Functions
 * This replaces direct SOAP calls with serverless function calls
 */
export class TebraApiService {
  // Assign callable or stub based on environment
  private tebraTestConnection = callableWrapper.tebraTestConnection;
  private tebraGetPatient = callableWrapper.tebraGetPatient;
  private tebraSearchPatients = callableWrapper.tebraSearchPatients;
  private tebraGetAppointments = callableWrapper.tebraGetAppointments;
  private tebraGetProviders = callableWrapper.tebraGetProviders;
  private tebraCreateAppointment = callableWrapper.tebraCreateAppointment;
  private tebraUpdateAppointment = callableWrapper.tebraUpdateAppointment;
  private tebraSyncTodaysSchedule = callableWrapper.tebraSyncTodaysSchedule;

  /**
   * Test connection to Tebra API
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Tebra API connection via Firebase Functions...');
      const result = await this.tebraTestConnection();
      const response = result.data as ApiResponse<null>;

      console.log('Connection test result:', response);
      return response.success;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get patient by ID
   */
  async getPatientById(patientId: string): Promise<TebraPatient | null> {
    try {
      console.log('Getting patient by ID:', patientId);
      const result = await this.tebraGetPatient({ patientId });
      const response = result.data as ApiResponse<TebraPatient>;

      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to get patient:', error);
      return null;
    }
  }

  /**
   * Search for patients
   */
  async searchPatients(searchCriteria: SearchCriteria): Promise<TebraPatient[]> {
    try {
      console.log('Searching patients:', searchCriteria);
      const result = await this.tebraSearchPatients({ searchCriteria });
      const response = result.data as ApiResponse<TebraPatient[]>;

      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to search patients:', error);
      return [];
    }
  }

  /**
   * Get appointments for a specific date
   */
  async getAppointments(date: string): Promise<TebraAppointment[]> {
    try {
      console.log('Getting appointments for date:', date);
      const result = await this.tebraGetAppointments({ date });
      const response = result.data as ApiResponse<TebraAppointment[]>;

      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to get appointments:', error);
      return [];
    }
  }

  /**
   * Get all providers
   */
  async getProviders(): Promise<TebraProvider[]> {
    try {
      console.log('Getting providers...');
      const result = await this.tebraGetProviders();
      const response = result.data as ApiResponse<TebraProvider[]>;

      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to get providers:', error);
      return [];
    }
  }

  /**
   * Create a new appointment
   */
  async createAppointment(appointmentData: Partial<TebraAppointment>): Promise<boolean> {
    try {
      console.log('Creating appointment:', appointmentData);
      const result = await this.tebraCreateAppointment({ appointmentData });
      const response = result.data as ApiResponse<TebraAppointment>;

      return response.success;
    } catch (error) {
      console.error('Failed to create appointment:', error);
      return false;
    }
  }

  /**
   * Update an existing appointment
   */
  async updateAppointment(appointmentData: Partial<TebraAppointment>): Promise<boolean> {
    try {
      console.log('Updating appointment:', appointmentData);
      const result = await this.tebraUpdateAppointment({ appointmentData });
      const response = result.data as ApiResponse<TebraAppointment>;

      return response.success;
    } catch (error) {
      console.error('Failed to update appointment:', error);
      return false;
    }
  }

  /**
   * Sync today's schedule from Tebra
   * HIPAA Compliant - Requires proper authentication
   */
  async syncTodaysSchedule(): Promise<SyncResponse> {
    try {
      console.log('Syncing today\'s schedule from Tebra...');
      
      // Ensure Firebase Auth is available and user is signed in
      if (!functionsInstance) {
        return {
          success: false,
          message: 'Firebase Functions not available'
        };
      }

      // For HIPAA compliance, we need to ensure the user is authenticated
      // This will fail with 'unauthenticated' error if user is not properly signed in
      const result = await this.tebraSyncTodaysSchedule();
      const response = result.data as ApiResponse<unknown[]> & { message?: string };

      return {
        success: response.success,
        patients: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('Failed to sync schedule:', error);
      
      // Handle authentication errors specifically
      if (error && typeof error === 'object' && 'code' in error && 
          (error as { code: string }).code === 'functions/unauthenticated') {
        return {
          success: false,
          message: 'Authentication required to access patient data (HIPAA compliance)'
        };
      }
      
      return {
        success: false,
        message: `Failed to sync schedule: ${error}`
      };
    }
  }
}

// Export a singleton instance
export const tebraApiService = new TebraApiService(); 
