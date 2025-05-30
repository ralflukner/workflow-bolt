import { Patient, AppointmentType } from '../types';

export interface TebraCredentials {
  username: string;
  password: string;
  wsdlUrl: string;
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

export interface TebraPatient {
  PatientId: string;
  FirstName: string;
  LastName: string;
  DateOfBirth: string;
  Phone: string;
  Email: string;
}

export interface TebraProvider {
  ProviderId: string;
  FirstName: string;
  LastName: string;
  Title: string;
}

export class TebraApiService {
  private credentials: TebraCredentials;

  constructor(credentials: TebraCredentials) {
    this.credentials = credentials;
  }

  async testConnection(): Promise<boolean> {
    // Stub implementation
    console.log('Testing Tebra API connection...');
    return false; // Returns false for now since SOAP client isn't fully implemented
  }

  async getAppointments(fromDate: Date, toDate: Date): Promise<TebraAppointment[]> {
    // Stub implementation
    console.log(`Getting appointments from ${fromDate.toISOString()} to ${toDate.toISOString()}`);
    return [];
  }

  async getPatients(patientIds: string[]): Promise<TebraPatient[]> {
    // Stub implementation
    console.log(`Getting patients for IDs: ${patientIds.join(', ')}`);
    return [];
  }

  async getProviders(): Promise<TebraProvider[]> {
    // Stub implementation
    console.log('Getting providers...');
    return [];
  }
}

export class TebraDataTransformer {
  static combineToInternalPatient(
    appointment: TebraAppointment,
    patient: TebraPatient,
    providers: TebraProvider[]
  ): Patient {
    const provider = providers.find(p => p.ProviderId === appointment.ProviderId);
    
    // Map appointment type to internal AppointmentType
    const appointmentType: AppointmentType | undefined = 
      appointment.AppointmentType === 'Office Visit' || appointment.AppointmentType === 'LABS' 
        ? appointment.AppointmentType as AppointmentType
        : 'Office Visit'; // Default fallback
    
    return {
      id: patient.PatientId,
      name: `${patient.FirstName} ${patient.LastName}`,
      dob: patient.DateOfBirth,
      appointmentTime: `${appointment.AppointmentDate}T${appointment.AppointmentTime}`,
      appointmentType,
      provider: provider ? `${provider.Title} ${provider.FirstName} ${provider.LastName}` : 'Unknown Provider',
      status: 'scheduled',
      checkInTime: undefined,
      room: undefined
    };
  }
} 