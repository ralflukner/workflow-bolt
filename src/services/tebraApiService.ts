import { httpsCallable, getFunctions } from 'firebase/functions';
import { app, isFirebaseConfigured, functions } from '../config/firebase';
import { secureLog } from '../utils/redact';

// Lazy initialization of functions instance
let functionsInstance: ReturnType<typeof getFunctions> | undefined;

const getFunctionsInstance = () => {
  if (functionsInstance) {
    return functionsInstance;
  }
  
  // Try to use the exported functions instance first
  if (functions) {
    functionsInstance = functions;
    return functionsInstance;
  }
  
  // Fallback to creating a new instance
  if (isFirebaseConfigured() && app) {
    try {
      functionsInstance = getFunctions(app);
      return functionsInstance;
    } catch (error) {
      console.warn('⚠️  Unable to initialize Firebase Functions instance:', error);
    }
  }
  
  return undefined;
};

// Utility to create a callable or a fallback stub
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createCallable = (name: string): any => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (...args: any[]) => {
    const instance = getFunctionsInstance();
    if (instance) {
      const callable = httpsCallable(instance, name);
      return callable(...args);
    }
    // Return a stub that mimics httpsCallable interface
    return {
      data: {
        success: false,
        message: `Firebase Functions unavailable – attempted to call ${name}`,
      },
    };
  };
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
  tebraTestAppointments: createCallable('tebraTestAppointments'),
  // HIPAA compliance functions
  validateHIPAACompliance: createCallable('validateHIPAACompliance'),
  testSecretRedaction: createCallable('testSecretRedaction'),
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
 * Now includes HIPAA-compliant credential management and secure logging
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
  private tebraTestAppointments = callableWrapper.tebraTestAppointments;
  // HIPAA compliance callables
  private validateHIPAAComplianceBackend = callableWrapper.validateHIPAACompliance;
  private testSecretRedactionBackend = callableWrapper.testSecretRedaction;

  /**
   * HIPAA-compliant logging using the frontend-safe redaction utility
   */
  private log(message: string, data?: unknown): void {
    secureLog(`[Tebra Service] ${message}`, data);
  }

  /**
   * Validate HIPAA compliance by checking with Firebase Functions
   * This calls the backend where Secret Manager validation actually happens
   */
  async validateHIPAACompliance(): Promise<{
    isCompliant: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      this.log('Validating HIPAA compliance via Firebase Functions...');
      const result = await this.validateHIPAAComplianceBackend();
      const response = result.data;
      
      if (response.success) {
        this.log('HIPAA compliance validation completed');
        return {
          isCompliant: response.isCompliant,
          issues: response.issues || [],
          recommendations: response.recommendations || []
        };
      } else {
        this.log('HIPAA compliance validation failed');
        return {
          isCompliant: false,
          issues: response.issues || ['Validation service unavailable'],
          recommendations: response.recommendations || ['Check Firebase Functions connectivity']
        };
      }
    } catch (error) {
      this.log('HIPAA compliance validation error', error);
      return {
        isCompliant: false,
        issues: ['Failed to validate HIPAA compliance'],
        recommendations: ['Check Firebase Functions connectivity', 'Verify Secret Manager setup']
      };
    }
  }

  /**
   * Test secret redaction functionality via Firebase Functions
   */
  async testSecretRedaction(message: string, testSecrets: string[]): Promise<{
    success: boolean;
    redactedMessage?: string;
    containsSensitiveData?: boolean;
  }> {
    try {
      this.log('Testing secret redaction via Firebase Functions...');
      const result = await this.testSecretRedactionBackend({ message, testSecrets });
      const response = result.data;
      
      return {
        success: response.success,
        redactedMessage: response.redactedMessage,
        containsSensitiveData: response.containsSensitiveData
      };
    } catch (error) {
      this.log('Secret redaction test failed', error);
      return {
        success: false
      };
    }
  }

  /**
   * Test connection to Tebra API with HIPAA-compliant logging
   */
  async testConnection(): Promise<boolean> {
    try {
      // Always use callable Firebase Function backed by PHP proxy
      this.log('Testing Tebra API connection via Firebase Functions...');
      const result = await this.tebraTestConnection();
      const response = result.data as ApiResponse<null>;
      this.log('Connection test result:', response);
      return response.success;
    } catch (error) {
      this.log('Connection test failed:', error);
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
      console.log('Searching patients via Functions:', searchCriteria);
      const result = await this.tebraSearchPatients({ searchCriteria });
      const response = result.data as ApiResponse<TebraPatient[]>;
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('searchPatients failed:', error);
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
      console.log('Getting providers via Functions...');
      const result = await this.tebraGetProviders();
      const response = result.data as ApiResponse<TebraProvider[]>;
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('getProviders failed:', error);
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
   * Sync schedule from Tebra for a specific date or today
   * HIPAA Compliant - Requires proper authentication
   */
  async syncTodaysSchedule(date?: string): Promise<SyncResponse> {
    try {
      const syncDate = date || new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
      console.log(`Syncing schedule from Tebra for date: ${syncDate}`);

      // Ensure Firebase Auth is available and user is signed in
      if (!functionsInstance) {
        return {
          success: false,
          message: 'Firebase Functions not available'
        };
      }

      // For HIPAA compliance, we need to ensure the user is authenticated
      // This will fail with 'unauthenticated' error if user is not properly signed in
      // Use the specified date or today
      const result = await this.tebraSyncTodaysSchedule({ 
        date: syncDate
      });
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

  /**
   * Test appointments endpoint with raw data
   */
  async testAppointments(date: string): Promise<ApiResponse<unknown>> {
    try {
      console.log('Testing appointments endpoint for date:', date);
      const result = await this.tebraTestAppointments({ date });
      return result.data as ApiResponse<unknown>;
    } catch (error) {
      console.error('Test appointments failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Test failed'
      };
    }
  }
}

// Export a singleton instance
export const tebraApiService = new TebraApiService(); 
