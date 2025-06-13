/**
 * @fileoverview Tebra API service for handling SOAP API interactions
 * @module services/tebra/tebra-api-service
 */

import { TebraSoapClient } from './tebraSoapClient';
import { TebraDataTransformer } from './tebra-data-transformer';
import { TebraCredentials, TebraPatient, TebraAppointment, TebraDailySession, TebraProvider } from './tebra-api-service.types';
import { secretsService } from '../services/secretsService';

// Type definitions for SOAP responses
interface SoapAppointmentResponse {
  AppointmentId?: string;
  Id?: string;
  PatientId?: string;
  ProviderId?: string;
  AppointmentDate?: string;
  Date?: string;
  AppointmentTime?: string;
  Time?: string;
  AppointmentType?: string;
  Type?: string;
  Status?: string;
}

interface SoapProviderResponse {
  ProviderId?: string;
  Id?: string;
  FirstName?: string;
  LastName?: string;
  Title?: string;
}

interface SoapPatientResponse {
  PatientId?: string;
  Id?: string;
  FirstName?: string;
  LastName?: string;
  DateOfBirth?: string;
  DOB?: string;
  Phone?: string;
  PhoneNumber?: string;
  Email?: string;
  EmailAddress?: string;
}

/**
 * Environment variable configuration interface
 * @interface EnvConfig
 */
interface EnvConfig {
  /** Tebra WSDL URL */
  wsdlUrl: string;
  /** Tebra username */
  username: string;
  /** Tebra password */
  password: string;
}

/**
 * Gets environment variable with fallback
 * @param {string} name - Environment variable name
 * @param {string} fallback - Fallback value
 * @returns {string} Environment variable value or fallback
 */
const getEnvVar = (name: string, fallback: string): string => {
  return process.env[name] ?? fallback;
};

/**
 * Gets Tebra credentials from secrets manager with environment fallback
 * @returns {Promise<TebraCredentials>} Tebra credentials
 */
const getTebraCredentialsAsync = async (): Promise<Partial<TebraCredentials>> => {
  try {
    const [username, password, customerKey] = await Promise.all([
      secretsService.getSecret('TEBRA_USERNAME').catch(() => null),
      secretsService.getSecret('TEBRA_PASSWORD').catch(() => null),
      secretsService.getSecret('TEBRA_CUSTOMER_KEY').catch(() => null)
    ]);

    const credentials: Partial<TebraCredentials> = {};

    if (username) credentials.username = username;
    if (password) credentials.password = password;

    // Build WSDL URL with the customer key if available
    if (customerKey) {
      credentials.wsdlUrl = `https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl&customerkey=${customerKey}`;
    }

    return credentials;
  } catch (error) {
    console.warn('Could not retrieve Tebra credentials from Secret Manager, falling back to environment variables:', error);
    return {};
  }
};


/**
 * Tebra API service class
 * @class TebraApiService
 */
export class TebraApiService {
  private soapClient: TebraSoapClient;
  private dataTransformer: TebraDataTransformer;

  /**
   * Creates a TebraApiService instance using async secrets retrieval
   * @param {Partial<TebraCredentials>} [credentials] - Optional credentials override
   * @param {TebraDataTransformer} [dataTransformer] - Optional data transformer
   * @returns {Promise<TebraApiService>} TebraApiService instance
   */
  static async createAsync(
    credentials?: Partial<TebraCredentials>,
    dataTransformer: TebraDataTransformer = new TebraDataTransformer()
  ): Promise<TebraApiService> {
    // Get credentials from secrets manager
    const secretsCredentials = await getTebraCredentialsAsync();

    // Merge with provided credentials and fallback to env vars
    const finalCredentials: Partial<TebraCredentials> = {
      wsdlUrl: credentials?.wsdlUrl || secretsCredentials.wsdlUrl || getEnvVar('VITE_TEBRA_WSDL_URL', ''),
      username: credentials?.username || secretsCredentials.username || getEnvVar('VITE_TEBRA_USERNAME', ''),
      password: credentials?.password || secretsCredentials.password || getEnvVar('VITE_TEBRA_PASSWORD', '')
    };

    return new TebraApiService(finalCredentials, dataTransformer);
  }

  /**
   * Creates an instance of TebraApiService
   * @param {Partial<TebraCredentials>} [credentials] - Optional credentials override
   * @param {TebraDataTransformer} [dataTransformer] - Optional data transformer
   * @throws {Error} If required configuration is missing
   */
  constructor(
    credentials?: Partial<TebraCredentials>,
    dataTransformer: TebraDataTransformer = new TebraDataTransformer()
  ) {
    // Use credentials passed in or fallback to environment variables
    // Note: Credentials should be retrieved from Firebase Functions/GSM via backend
    const config: EnvConfig = {
      wsdlUrl: credentials?.wsdlUrl || getEnvVar('VITE_TEBRA_WSDL_URL', ''),
      username: credentials?.username || getEnvVar('VITE_TEBRA_USERNAME', ''),
      password: credentials?.password || getEnvVar('VITE_TEBRA_PASSWORD', '')
    };

    this.validateConfig(config);
    this.soapClient = new TebraSoapClient(config);
    this.dataTransformer = dataTransformer;
  }

  /**
   * Validates Tebra configuration
   * @param {EnvConfig} config - Configuration object
   * @throws {Error} If configuration is invalid
   */
  private validateConfig(config: EnvConfig): void {
    const missingFields = [];
    if (!config.username) missingFields.push('username');
    if (!config.password) missingFields.push('password');
    if (!config.wsdlUrl) missingFields.push('wsdlUrl');
    if (missingFields.length > 0) {
      throw new Error(
        `Invalid Tebra configuration. Missing required fields: ${missingFields.join(', ')}`
      );
    }
  }

  /**
   * Executes a rate-limited API call
   * @param {string} method - Method name for rate limiting
   * @param {() => Promise<T>} apiCall - API call function
   * @returns {Promise<T>} API call result
   */
  private async executeRateLimitedCall<T>(
    method: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const rateLimiter = this.soapClient.getRateLimiter();
    await rateLimiter.waitForSlot(method);
    return apiCall();
  }

  /**
   * Gets patient data from Tebra
   * @param {string} patientId - Patient ID
   * @returns {Promise<TebraPatient>} Patient data
   * @throws {Error} If API call fails
   */
  public async getPatientData(patientId: string): Promise<TebraPatient> {
    return this.executeRateLimitedCall('getPatientData', async () => {
      const response = await this.soapClient.getPatientById(patientId);
      return this.dataTransformer.transformPatientData(response);
    });
  }

  /**
   * Gets appointment data from Tebra
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<TebraAppointment>} Appointment data
   * @throws {Error} If API call fails
   */
  public async getAppointmentData(appointmentId: string): Promise<TebraAppointment> {
    return this.executeRateLimitedCall('getAppointmentData', async () => {
      const response = await this.soapClient.getAppointmentById(appointmentId);
      return this.dataTransformer.transformAppointmentData(response);
    });
  }

  /**
   * Gets daily session data from Tebra
   * @param {Date} date - Date to get session data for
   * @returns {Promise<TebraDailySession>} Daily session data
   * @throws {Error} If API call fails
   */
  public async getDailySessionData(date: Date): Promise<TebraDailySession> {
    return this.executeRateLimitedCall('getDailySessionData', async () => {
      const response = await this.soapClient.getDailySessionData(date);
      return this.dataTransformer.transformDailySessionData(response);
    });
  }

  /**
   * Tests the Tebra API connection
   * @returns {Promise<boolean>} True if connection is successful
   * @throws {Error} If connection test fails
   */
  public async testConnection(): Promise<boolean> {
    try {
      await this.soapClient.testConnection();
      return true;
    } catch (error) {
      console.error('Tebra API connection test failed:', error);
      throw error;
    }
  }

  async getAppointments(fromDate: Date, toDate: Date): Promise<TebraAppointment[]> {
    return this.executeRateLimitedCall('getAppointments', async () => {
      console.log(`Getting appointments from ${fromDate.toISOString()} to ${toDate.toISOString()}`);

      // Format dates for Tebra API
      const fromDateStr = fromDate.toISOString().split('T')[0];
      const toDateStr = toDate.toISOString().split('T')[0];

      // Use the SOAP client's getAppointments method (which includes rate limiting)
      const appointments = await this.soapClient.getAppointments(fromDateStr, toDateStr) as SoapAppointmentResponse[];

      console.log(`Retrieved ${appointments.length} appointments from Tebra API`);

      // Transform response to our format
      return appointments.map((apt: SoapAppointmentResponse) => ({
        AppointmentId: apt.AppointmentId || apt.Id || '',
        PatientId: apt.PatientId || '',
        ProviderId: apt.ProviderId || '',
        StartTime: apt.AppointmentTime || apt.Time || '',
        EndTime: '',
        Status: apt.Status || 'Scheduled',
        Type: apt.AppointmentType || apt.Type || 'Office Visit',
        Notes: '',
        CreatedAt: '',
        UpdatedAt: ''
      }));
    });
  }

  async getPatients(patientIds: string[]): Promise<TebraPatient[]> {
    try {
      console.log(`Getting patients for IDs: ${patientIds.join(', ')}`);

      const patients: TebraPatient[] = [];

      // Get patient details for each ID (rate limiting is handled in the SOAP client)
      for (const patientId of patientIds) {
        try {
          const result = await this.soapClient.getPatientById(patientId);

          if (result) {
            // Type assertion for the SOAP response
            const patientData = result as Record<string, unknown>;
            patients.push({
              PatientId: (patientData.PatientId || patientData.Id || patientId) as string,
              FirstName: (patientData.FirstName || '') as string,
              LastName: (patientData.LastName || '') as string,
              DateOfBirth: (patientData.DateOfBirth || patientData.DOB || '') as string,
              Phone: (patientData.Phone || patientData.PhoneNumber || '') as string,
              Email: (patientData.Email || patientData.EmailAddress || '') as string,
              Gender: (patientData.Gender || '') as string,
              Address: {
                Street: '',
                City: '',
                State: '',
                ZipCode: '',
                Country: ''
              },
              Insurance: {
                Provider: '',
                PolicyNumber: '',
                GroupNumber: ''
              },
              CreatedAt: new Date().toISOString(),
              UpdatedAt: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error(`Failed to get patient ${patientId}:`, error);
        }
      }

      return patients;
    } catch (error) {
      console.error('Failed to get patients:', error);
      return [];
    }
  }

  async getProviders(): Promise<TebraProvider[]> {
    try {
      console.log('Getting providers...');

      // Use the SOAP client's getProviders method (which includes rate limiting)
      const providers = await this.soapClient.getProviders() as SoapProviderResponse[];

      console.log(`Retrieved ${providers.length} providers from Tebra API`);

      return providers.map((provider: SoapProviderResponse) => ({
        ProviderId: provider.ProviderId || provider.Id || '',
        FirstName: provider.FirstName || '',
        LastName: provider.LastName || '',
        Title: provider.Title || 'Dr.'
      }));

    } catch (error) {
      console.error('Failed to get providers:', error);
      // Return a default provider as fallback
      return [{
        ProviderId: '1',
        FirstName: 'Unknown',
        LastName: 'Provider',
        Title: 'Dr.'
      }];
    }
  }

  /**
   * Get all patients (useful for bulk operations)
   */
  async getAllPatients(): Promise<TebraPatient[]> {
    try {
      console.log('Getting all patients...');

      // Use the SOAP client's getAllPatients method (which includes rate limiting)
      const patients = await this.soapClient.getAllPatients() as SoapPatientResponse[];

      console.log(`Retrieved ${patients.length} patients from Tebra API`);

      return patients.map((patient: SoapPatientResponse) => ({
        PatientId: patient.PatientId || patient.Id || '',
        FirstName: patient.FirstName || '',
        LastName: patient.LastName || '',
        DateOfBirth: patient.DateOfBirth || patient.DOB || '',
        Phone: patient.Phone || patient.PhoneNumber || '',
        Email: patient.Email || patient.EmailAddress || '',
        Gender: (patient as any).Gender || '',
        Address: {
          Street: '',
          City: '',
          State: '',
          ZipCode: '',
          Country: ''
        },
        Insurance: {
          Provider: '',
          PolicyNumber: '',
          GroupNumber: ''
        },
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString()
      }));

    } catch (error) {
      console.error('Failed to get all patients:', error);
      return [];
    }
  }

  /**
   * Gets rate limiter statistics
   * @returns {Record<string, number>} Rate limiter statistics
   */
  getRateLimiterStats(): Record<string, number> {
    return this.soapClient.getRateLimiter().getAllRateLimits();
  }

  /**
   * Checks if a method can be called immediately
   * @param {string} methodName - Method name to check
   * @returns {boolean} True if method can be called immediately
   */
  canCallMethodImmediately(methodName: string): boolean {
    return this.soapClient.getRateLimiter().canCallImmediately(methodName);
  }

  /**
   * Gets remaining wait time for a method
   * @param {string} methodName - Method name to check
   * @returns {number} Remaining wait time in milliseconds
   */
  getRemainingWaitTime(methodName: string): number {
    return this.soapClient.getRateLimiter().getRemainingWaitTime(methodName);
  }
}  
