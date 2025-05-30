/* eslint-disable @typescript-eslint/no-explicit-any */
import soap, { Client } from 'soap';
import { tebraRateLimiter } from './tebra-rate-limiter';

export interface TebraConfig {
  wsdlUrl: string; // WSDL endpoint URL
  username: string;
  password: string;
}

export class TebraSoapClient {
  private client: Client | null = null;
  private readonly config: TebraConfig;

  constructor(config?: Partial<TebraConfig>) {
    this.config = {
      wsdlUrl: process.env.TEBRA_SOAP_WSDL || 'https://example.com/tebra.wsdl',
      username: process.env.TEBRA_SOAP_USERNAME || 'demo',
      password: process.env.TEBRA_SOAP_PASSWORD || 'demo',
      ...config,
    } as TebraConfig;
  }

  /**
   * Ensure SOAP client has been created/cached
   */
  private async getClient(): Promise<Client> {
    if (this.client) return this.client;
    this.client = await soap.createClientAsync(this.config.wsdlUrl);

    // Basic auth header if required
    this.client.setSecurity(new soap.BasicAuthSecurity(this.config.username, this.config.password));

    return this.client;
  }

  /**
   * Get a patient by ID with rate limiting
   */
  async getPatientById(patientId: string): Promise<unknown> {
    // Apply rate limiting
    await tebraRateLimiter.waitForRateLimit('GetPatient');
    
    const client = await this.getClient();
    type SoapMethod = (...args: any[]) => Promise<any[]>;
    const method = client['GetPatientAsync'] as unknown as SoapMethod | undefined;
    if (!method) throw new Error('GetPatient operation not found in WSDL');
    const resArray = await method({ patientId });
    return resArray[0];
  }

  /**
   * Search patients by last name with rate limiting
   */
  async searchPatients(lastName: string): Promise<unknown[]> {
    // Apply rate limiting
    await tebraRateLimiter.waitForRateLimit('SearchPatient');
    
    const client = await this.getClient();
    type SoapMethod = (...args: any[]) => Promise<any[]>;
    const method = client['SearchPatientsAsync'] as unknown as SoapMethod | undefined;
    if (!method) throw new Error('SearchPatients operation not found in WSDL');
    const resArray = await method({ lastName });
    const first = resArray[0] as any;
    return first?.patients || [];
  }

  /**
   * Get all patients with rate limiting
   */
  async getAllPatients(): Promise<unknown[]> {
    // Apply rate limiting
    await tebraRateLimiter.waitForRateLimit('GetAllPatients');
    
    const client = await this.getClient();
    type SoapMethod = (...args: any[]) => Promise<any[]>;
    const method = client['GetAllPatientsAsync'] as unknown as SoapMethod | undefined;
    if (!method) throw new Error('GetAllPatients operation not found in WSDL');
    const resArray = await method({});
    const first = resArray[0] as any;
    return first?.patients || [];
  }

  /**
   * Get appointments within date range with rate limiting
   */
  async getAppointments(fromDate: string, toDate: string): Promise<unknown[]> {
    // Apply rate limiting
    await tebraRateLimiter.waitForRateLimit('GetAppointments');
    
    const client = await this.getClient();
    type SoapMethod = (...args: any[]) => Promise<any[]>;
    const method = client['GetAppointmentsAsync'] as unknown as SoapMethod | undefined;
    if (!method) throw new Error('GetAppointments operation not found in WSDL');
    const resArray = await method({ fromDate, toDate });
    const first = resArray[0] as any;
    return first?.appointments || [];
  }

  /**
   * Get providers with rate limiting
   */
  async getProviders(): Promise<unknown[]> {
    // Apply rate limiting
    await tebraRateLimiter.waitForRateLimit('GetProviders');
    
    const client = await this.getClient();
    type SoapMethod = (...args: any[]) => Promise<any[]>;
    const method = client['GetProvidersAsync'] as unknown as SoapMethod | undefined;
    if (!method) throw new Error('GetProviders operation not found in WSDL');
    const resArray = await method({});
    const first = resArray[0] as any;
    return first?.providers || [];
  }

  /**
   * Create a new appointment with rate limiting
   */
  async createAppointment(appointmentData: unknown): Promise<unknown> {
    // Apply rate limiting
    await tebraRateLimiter.waitForRateLimit('CreateAppointment');
    
    const client = await this.getClient();
    type SoapMethod = (...args: any[]) => Promise<any[]>;
    const method = client['CreateAppointmentAsync'] as unknown as SoapMethod | undefined;
    if (!method) throw new Error('CreateAppointment operation not found in WSDL');
    const resArray = await method(appointmentData);
    return resArray[0];
  }

  /**
   * Update an existing appointment with rate limiting
   */
  async updateAppointment(appointmentData: unknown): Promise<unknown> {
    // Apply rate limiting
    await tebraRateLimiter.waitForRateLimit('UpdateAppointment');
    
    const client = await this.getClient();
    type SoapMethod = (...args: any[]) => Promise<any[]>;
    const method = client['UpdateAppointmentAsync'] as unknown as SoapMethod | undefined;
    if (!method) throw new Error('UpdateAppointment operation not found in WSDL');
    const resArray = await method(appointmentData);
    return resArray[0];
  }

  /**
   * Get the rate limiter instance for monitoring
   */
  getRateLimiter() {
    return tebraRateLimiter;
  }
}

export const tebraSoapClient = new TebraSoapClient(); 