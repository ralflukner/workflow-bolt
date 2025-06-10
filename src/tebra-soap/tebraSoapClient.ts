/**
 * @fileoverview Tebra SOAP client for handling API communication
 * @module services/tebra/tebraSoapClient
 */

import * as soap from 'soap';
import { TebraCredentials } from './tebra-api-service.types';
import { TebraRateLimiter } from './tebra-rate-limiter';

/**
 * Tebra SOAP client class
 * @class TebraSoapClient
 */
export class TebraSoapClient {
  private client: any;
  private rateLimiter: TebraRateLimiter;
  private credentials: TebraCredentials;

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
    if (!this.client) {
      try {
        this.client = await soap.createClientAsync(this.credentials.wsdlUrl);
        this.client.setSecurity(new soap.BasicAuthSecurity(
          this.credentials.username,
          this.credentials.password
        ));
      } catch (error) {
        console.error('Failed to initialize Tebra SOAP client:', error);
        throw new Error('Failed to initialize Tebra SOAP client');
      }
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
}

// Create a singleton instance with environment variables
const credentials: TebraCredentials = {
  wsdlUrl: process.env.REACT_APP_TEBRA_WSDL_URL || '',
  username: process.env.REACT_APP_TEBRA_USERNAME || '',
  password: process.env.REACT_APP_TEBRA_PASSWORD || ''
};

export const tebraSoapClient = new TebraSoapClient(credentials);              