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