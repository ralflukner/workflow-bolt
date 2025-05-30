import { TebraCredentials, TebraAppointment, TebraPatient, TebraProvider } from './tebra-api-service.types';
import { TebraSoapClient } from './tebraSoapClient';

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

export class TebraApiService {
  private credentials: TebraCredentials;
  private soapClient: TebraSoapClient;

  constructor(credentials: TebraCredentials) {
    this.credentials = credentials;
    this.soapClient = new TebraSoapClient({
      wsdlUrl: credentials.wsdlUrl,
      username: credentials.username,
      password: credentials.password
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Tebra API connection...');
      
      // Try a simple search to test connection
      const result = await this.soapClient.searchPatients('test');
      
      console.log('Connection test result:', result);
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  async getAppointments(fromDate: Date, toDate: Date): Promise<TebraAppointment[]> {
    try {
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
        AppointmentDate: apt.AppointmentDate || apt.Date || '',
        AppointmentTime: apt.AppointmentTime || apt.Time || '',
        AppointmentType: apt.AppointmentType || apt.Type || 'Office Visit',
        Status: apt.Status || 'Scheduled'
      }));
      
    } catch (error) {
      console.error('Failed to get appointments:', error);
      // Return empty array as fallback
      return [];
    }
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
              Email: (patientData.Email || patientData.EmailAddress || '') as string
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
        Email: patient.Email || patient.EmailAddress || ''
      }));
      
    } catch (error) {
      console.error('Failed to get all patients:', error);
      return [];
    }
  }

  /**
   * Create a new appointment in Tebra
   */
  async createAppointment(appointmentData: Partial<TebraAppointment>): Promise<boolean> {
    try {
      console.log('Creating appointment in Tebra...');
      
      const result = await this.soapClient.createAppointment(appointmentData);
      
      console.log('Appointment created successfully:', result);
      return true;
    } catch (error) {
      console.error('Failed to create appointment:', error);
      return false;
    }
  }

  /**
   * Update an existing appointment in Tebra
   */
  async updateAppointment(appointmentData: Partial<TebraAppointment>): Promise<boolean> {
    try {
      console.log('Updating appointment in Tebra...');
      
      const result = await this.soapClient.updateAppointment(appointmentData);
      
      console.log('Appointment updated successfully:', result);
      return true;
    } catch (error) {
      console.error('Failed to update appointment:', error);
      return false;
    }
  }

  /**
   * Get rate limiter statistics
   */
  getRateLimiterStats(): Record<string, number> {
    const rateLimiter = this.soapClient.getRateLimiter();
    return rateLimiter.getAllRateLimits();
  }

  /**
   * Check if a specific API method can be called immediately
   */
  canCallMethodImmediately(methodName: string): boolean {
    const rateLimiter = this.soapClient.getRateLimiter();
    return rateLimiter.canCallImmediately(methodName);
  }

  /**
   * Get remaining wait time for a specific API method
   */
  getRemainingWaitTime(methodName: string): number {
    const rateLimiter = this.soapClient.getRateLimiter();
    return rateLimiter.getRemainingWaitTime(methodName);
  }
} 