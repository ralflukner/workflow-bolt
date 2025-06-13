/**
 * @fileoverview Tebra SOAP client for handling API communication
 * @module services/tebra/tebraSoapClient
 */

import * as soap from 'soap';
import { TebraCredentials } from './tebra-api-service.types';
import { TebraRateLimiter } from './tebra-rate-limiter';

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


interface SoapAppointmentData {
  appointment: {
    AppointmentId?: string;
    PatientId: string;
    ProviderId: string;
    StartTime: string;
    EndTime: string;
    Status: string;
    Type: string;
    Notes?: string;
  };
}

/**
 * Tebra SOAP client class
 * @class TebraSoapClient
 */
export class TebraSoapClient {
  private client: any = null;
  private rateLimiter: TebraRateLimiter;
  private credentials: TebraCredentials;

  /**
   * Gets the SOAP client instance
   * @returns {any} SOAP client instance
   */
  async getClient() {
    if (this.client == null) {
      this.client = await this.createClient();
    }
    return this.client;
  }

  /**
   * Sets the SOAP client instance (useful for testing)
   * @param {any} client - SOAP client instance
   */
  setClient(client: any) {
    this.client = client;
  }

  /**
   * Creates an instance of TebraSoapClient
   * @param {TebraCredentials} credentials - Tebra API credentials
   * @throws {Error} If credentials are invalid
   */
  constructor(credentials: TebraCredentials) {
    this.validateCredentials(credentials);
    this.credentials = credentials;
    this.rateLimiter = new TebraRateLimiter();
  }

  /**
   * Validates Tebra credentials
   * @param {TebraCredentials} credentials - Credentials to validate
   * @throws {Error} If credentials are invalid
   */
  private validateCredentials(credentials: TebraCredentials): void {
    if (!credentials.wsdlUrl || !credentials.username || !credentials.password) {
      throw new Error('Invalid Tebra credentials. All fields are required.');
    }
  }

  /**
   * Gets the rate limiter instance
   * @returns {TebraRateLimiter} Rate limiter instance
   */
  public getRateLimiter(): TebraRateLimiter {
    return this.rateLimiter;
  }

  /**
   * Initializes the SOAP client
   * @returns {Promise<void>}
   * @throws {Error} If client initialization fails
   */
  private async initializeClient(): Promise<void> {
    await this.getClient();
  }

  /**
   * Creates a new SOAP client
   * @returns {Promise<any>} SOAP client instance
   * @throws {Error} If client creation fails
   */
  private async createClient(): Promise<any> {
    try {
      const client = await soap.createClientAsync(this.credentials.wsdlUrl);
      client.setSecurity(new soap.BasicAuthSecurity(
        this.credentials.username,
        this.credentials.password
      ));
      return client;
    } catch (error) {
      console.error('Failed to initialize Tebra SOAP client:', error);
      throw new Error('Failed to initialize Tebra SOAP client');
    }
  }

  /**
   * Gets patient data by ID
   * @param {string} patientId - Patient ID
   * @returns {Promise<any>} Patient data
   * @throws {Error} If API call fails
   */
  public async getPatientById(patientId: string): Promise<any> {
    await this.initializeClient();
    await this.rateLimiter.waitForSlot('GetPatient');

    try {
      const [result] = await this.client.GetPatientAsync({ patientId });
      return result;
    } catch (error) {
      console.error('Failed to get patient data:', error);
      throw new Error('Failed to get patient data');
    }
  }

  /**
   * Searches for patients by last name
   * @param {string} lastName - Last name to search for
   * @returns {Promise<any[]>} Search results
   * @throws {Error} If API call fails
   */
  public async searchPatients(lastName: string): Promise<any[]> {
    await this.initializeClient();
    await this.rateLimiter.waitForSlot('SearchPatients');
    try {
      const [result] = await this.client.SearchPatientsAsync({ lastName });
      if (Array.isArray(result.patients)) return result.patients;
      if (Array.isArray(result)) return result;
      return [];
    } catch (error) {
      console.error('Failed to search patients:', error);
      throw new Error('Failed to search patients');
    }
  }

  /**
   * Gets appointment data by ID
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<any>} Appointment data
   * @throws {Error} If API call fails
   */
  public async getAppointmentById(appointmentId: string): Promise<any> {
    await this.initializeClient();
    await this.rateLimiter.waitForSlot('GetAppointment');

    try {
      const [result] = await this.client.GetAppointmentAsync({ appointmentId });
      return result;
    } catch (error) {
      console.error('Failed to get appointment data:', error);
      throw new Error('Failed to get appointment data');
    }
  }

  /**
   * Gets daily session data
   * @param {Date} date - Date to get session data for
   * @returns {Promise<any>} Daily session data
   * @throws {Error} If API call fails
   */
  public async getDailySessionData(date: Date): Promise<any> {
    await this.initializeClient();
    await this.rateLimiter.waitForSlot('GetDailySession');

    try {
      const [result] = await this.client.GetDailySessionAsync({ date: date.toISOString() });
      return result;
    } catch (error) {
      console.error('Failed to get daily session data:', error);
      throw new Error('Failed to get daily session data');
    }
  }

  /**
   * Tests the API connection
   * @returns {Promise<boolean>} True if connection is successful
   * @throws {Error} If connection test fails
   */
  public async testConnection(): Promise<boolean> {
    await this.initializeClient();
    try {
      await this.client.TestConnectionAsync();
      return true;
    } catch (error) {
      console.error('Failed to test connection:', error);
      throw new Error('Failed to test connection');
    }
  }
  /**
   * Gets appointments within a date range
   * @param {string} fromDate - Start date in YYYY-MM-DD format
   * @param {string} toDate - End date in YYYY-MM-DD format
   * @returns {Promise<SoapAppointmentResponse[]>} Array of appointments
   * @throws {Error} If API call fails or dates are invalid
   */
  public async getAppointments(fromDate: string, toDate: string): Promise<SoapAppointmentResponse[]> {
    await this.initializeClient();
    if (!fromDate || !toDate) {
      throw new Error('fromDate and toDate are required');
    }
    if (!this.isValidDateFormat(fromDate) || !this.isValidDateFormat(toDate)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }

    try {
      await this.rateLimiter.waitForSlot('getAppointments');
      const result = await this.client.GetAppointmentsAsync({
        fromDate,
        toDate
      });
      return result[0].GetAppointmentsResult;
    } catch (error) {
      console.error('Failed to get appointments:', error);
      throw error;
    }
  }

  /**
   * Gets all providers
   * @returns {Promise<any[]>} Array of providers
   * @throws {Error} If API call fails
   */
  public async getProviders(): Promise<any[]> {
    await this.initializeClient();
    try {
      await this.rateLimiter.waitForSlot('getProviders');
      const result = await this.client.GetProvidersAsync({});
      return result[0].GetProvidersResult;
    } catch (error) {
      console.error('Failed to get providers:', error);
      throw error;
    }
  }

  /**
   * Gets all patients
   * @returns {Promise<any[]>} Array of patients
   * @throws {Error} If API call fails
   */
  public async getAllPatients(): Promise<any[]> {
    await this.initializeClient();
    try {
      await this.rateLimiter.waitForSlot('getAllPatients');
      const result = await this.client.GetAllPatientsAsync({});
      return result[0].GetAllPatientsResult;
    } catch (error) {
      console.error('Failed to get all patients:', error);
      throw error;
    }
  }

  /**
   * Creates a new appointment
   * @param {Partial<SoapAppointmentData['appointment']>} appointmentData - Appointment data
   * @returns {Promise<any>} Created appointment result
   * @throws {Error} If required fields are missing or API call fails
   */
  public async createAppointment(appointmentData: Partial<SoapAppointmentData['appointment']>): Promise<any> {
    await this.initializeClient();
    if (!appointmentData.PatientId || !appointmentData.ProviderId) {
      throw new Error('PatientId and ProviderId are required');
    }
    if (!appointmentData.StartTime || !appointmentData.EndTime) {
      throw new Error('StartTime and EndTime are required');
    }

    try {
      await this.rateLimiter.waitForSlot('createAppointment');
      const result = await this.client.CreateAppointmentAsync({
        appointment: appointmentData
      });
      return result[0].CreateAppointmentResult;
    } catch (error) {
      console.error('Failed to create appointment:', error);
      throw error;
    }
  }

  /**
   * Updates an existing appointment
   * @param {Partial<SoapAppointmentData['appointment']>} appointmentData - Appointment data with AppointmentId
   * @returns {Promise<any>} Updated appointment result
   * @throws {Error} If AppointmentId is missing or API call fails
   */
  public async updateAppointment(appointmentData: Partial<SoapAppointmentData['appointment']>): Promise<any> {
    await this.initializeClient();
    if (!appointmentData.AppointmentId) {
      throw new Error('AppointmentId is required for updates');
    }

    try {
      await this.rateLimiter.waitForSlot('updateAppointment');
      const result = await this.client.UpdateAppointmentAsync({
        appointment: appointmentData
      });
      return result[0].UpdateAppointmentResult;
    } catch (error) {
      console.error('Failed to update appointment:', error);
      throw error;
    }
  }

  /**
   * Validates date format (YYYY-MM-DD)
   * @param {string} date - Date string to validate
   * @returns {boolean} True if date format is valid
   */
  private isValidDateFormat(date: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(date);
  }
}

// Singleton instance creation commented out for now
// Actual credentials will be provided when used
// export const tebraSoapClient = new TebraSoapClient(/* credentials */);
