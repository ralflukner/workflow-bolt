/* eslint-disable @typescript-eslint/no-explicit-any */
import soap, { Client } from 'soap';

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
   * Get a patient by ID
   */
  async getPatientById(patientId: string): Promise<unknown> {
    const client = await this.getClient();
    type SoapMethod = (...args: any[]) => Promise<any[]>;
    const method = client['GetPatientAsync'] as unknown as SoapMethod | undefined;
    if (!method) throw new Error('GetPatient operation not found in WSDL');
    const resArray = await method({ patientId });
    return resArray[0];
  }

  /**
   * Search patients by last name (example)
   */
  async searchPatients(lastName: string): Promise<unknown[]> {
    const client = await this.getClient();
    type SoapMethod = (...args: any[]) => Promise<any[]>;
    const method = client['SearchPatientsAsync'] as unknown as SoapMethod | undefined;
    if (!method) throw new Error('SearchPatients operation not found in WSDL');
    const resArray = await method({ lastName });
    const first = resArray[0] as any;
    return first?.patients || [];
  }
}

export const tebraSoapClient = new TebraSoapClient(); 