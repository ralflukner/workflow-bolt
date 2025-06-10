/**
 * @fileoverview SOAP client for Tebra API
 * @module services/tebra/tebraSoapClient
 */

import { TebraCredentials, TebraPatient, TebraAppointment, TebraDailySession } from './types';
import { TebraRateLimiter } from './tebra-rate-limiter';

/**
 * Tebra SOAP client class
 * @class TebraSoapClient
 */
export class TebraSoapClient {
  private client: any;
  private config: TebraCredentials;
  private rateLimiter: TebraRateLimiter;

  /**
   * Creates an instance of TebraSoapClient
   * @param {TebraCredentials} config - Tebra credentials
   */
  constructor(config: TebraCredentials) {
    this.config = config;
    this.rateLimiter = new TebraRateLimiter();
  }

  /**
   * Tests the connection to the Tebra API
   * @returns {Promise<boolean>} True if connection is successful
   * @throws {Error} If connection test fails
   */
  public async testConnection(): Promise<boolean> {
    try {
      const client = await this.getClient();
      await client.testConnectionAsync();
      return true;
    } catch (error) {
      console.error('Failed to test connection:', error);
      throw error;
    }
  }

  /**
   * Gets patient data from Tebra
   * @param {string} patientId - Patient ID
   * @returns {Promise<TebraPatient>} Patient data
   * @throws {Error} If API call fails
   */
  public async getPatientData(patientId: string): Promise<TebraPatient> {
    try {
      const client = await this.getClient();
      const result = await client.getPatientDataAsync({ patientId });
      return result[0];
    } catch (error) {
      console.error('Failed to get patient data:', error);
      throw error;
    }
  }

  /**
   * Gets appointment data from Tebra
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<TebraAppointment>} Appointment data
   * @throws {Error} If API call fails
   */
  public async getAppointmentData(appointmentId: string): Promise<TebraAppointment> {
    try {
      const client = await this.getClient();
      const result = await client.getAppointmentDataAsync({ appointmentId });
      return result[0];
    } catch (error) {
      console.error('Failed to get appointment data:', error);
      throw error;
    }
  }

  /**
   * Gets daily session data from Tebra
   * @param {Date} date - Date to get session data for
   * @returns {Promise<TebraDailySession>} Daily session data
   * @throws {Error} If API call fails
   */
  public async getDailySessionData(date: Date): Promise<TebraDailySession> {
    try {
      const client = await this.getClient();
      const result = await client.getDailySessionDataAsync({ date: date.toISOString() });
      return result[0];
    } catch (error) {
      console.error('Failed to get daily session data:', error);
      throw error;
    }
  }

  /**
   * Gets the SOAP client instance
   * @returns {Promise<any>} SOAP client instance
   * @throws {Error} If client creation fails
   */
  private async getClient(): Promise<any> {
    if (this.client) return this.client;

    try {
      const soap = await import('soap');
      this.client = await soap.createClientAsync(this.config.wsdlUrl);
      this.client.setSecurity(new soap.BasicAuthSecurity(this.config.username, this.config.password));
      return this.client;
    } catch (error) {
      console.error('Failed to create SOAP client:', error);
      throw error;
    }
  }
}

export const tebraSoapClient = new TebraSoapClient();              