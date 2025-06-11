/* Central place for all Tebra–related TypeScript types */

export interface TebraAppointment {
  AppointmentId?: string;
  Id?: string;
  PatientId?: string;
  patientId?: string;
  ProviderId?: string;
  providerId?: string;
  Date?: string;
  AppointmentDate?: string;
  Time?: string;
  AppointmentTime?: string;
  StartTime?: string;
  Type?: string;
  AppointmentType?: string;
  Status?: string;
  status?: string;
}

export interface TebraPatient {
  PatientId: string;
  Id?: string;
  FirstName: string;
  LastName: string;
  DateOfBirth: string;
  DOB?: string;
  Phone?: string;
  PhoneNumber?: string;
  Email?: string;
  EmailAddress?: string;
}

export interface TebraProvider {
  ProviderId: string;
  ID?: string;
  Id?: string;
  FirstName: string;
  LastName: string;
  Title?: string;
  Degree?: string;
  Specialty?: string;
  Email?: string;
}

export interface TebraClient {
  getAppointments(start: string, end: string): Promise<TebraAppointment[]>;
  getProviders():                             Promise<TebraProvider[]>;
  getPatientById(id: string):                 Promise<TebraPatient | null>;
} 