/**
 * @fileoverview Type definitions for Tebra API service
 * @module services/tebra/tebra-api-service.types
 */

/**
 * Tebra credentials interface
 * @interface TebraCredentials
 */
export interface TebraCredentials {
  /** WSDL URL for the Tebra API */
  wsdlUrl: string;
  /** Username for authentication */
  username: string;
  /** Password for authentication */
  password: string;
}

/**
 * Tebra address interface
 * @interface TebraAddress
 */
export interface TebraAddress {
  /** Street address */
  Street: string;
  /** City */
  City: string;
  /** State */
  State: string;
  /** ZIP code */
  ZipCode: string;
  /** Country */
  Country: string;
}

/**
 * Tebra insurance interface
 * @interface TebraInsurance
 */
export interface TebraInsurance {
  /** Insurance provider name */
  Provider: string;
  /** Policy number */
  PolicyNumber: string;
  /** Group number */
  GroupNumber: string;
}

/**
 * Tebra patient interface
 * @interface TebraPatient
 */
export interface TebraPatient {
  /** Patient ID */
  PatientId: string;
  /** First name */
  FirstName: string;
  /** Last name */
  LastName: string;
  /** Date of birth */
  DateOfBirth: string;
  /** Gender */
  Gender: string;
  /** Email address */
  Email: string;
  /** Phone number */
  Phone: string;
  /** Address information */
  Address: TebraAddress;
  /** Insurance information */
  Insurance: TebraInsurance;
  /** Creation timestamp */
  CreatedAt: string;
  /** Last update timestamp */
  UpdatedAt: string;
}

/**
 * Tebra appointment interface
 * @interface TebraAppointment
 */
export interface TebraAppointment {
  /** Appointment ID */
  AppointmentId: string;
  /** Patient ID */
  PatientId: string;
  /** Provider ID */
  ProviderId: string;
  /** Start time */
  StartTime: string;
  /** End time */
  EndTime: string;
  /** Appointment status */
  Status: string;
  /** Appointment type */
  Type: string;
  /** Appointment notes */
  Notes: string;
  /** Creation timestamp */
  CreatedAt: string;
  /** Last update timestamp */
  UpdatedAt: string;
}

/**
 * Tebra daily session appointment interface
 * @interface TebraDailySessionAppointment
 */
export interface TebraDailySessionAppointment {
  /** Appointment ID */
  AppointmentId: string;
  /** Patient ID */
  PatientId: string;
  /** Start time */
  StartTime: string;
  /** End time */
  EndTime: string;
  /** Appointment status */
  Status: string;
  /** Appointment type */
  Type: string;
}

/**
 * Tebra daily session interface
 * @interface TebraDailySession
 */
export interface TebraDailySession {
  /** Session ID */
  SessionId: string;
  /** Session date */
  Date: string;
  /** Provider ID */
  ProviderId: string;
  /** List of providers */
  Providers: TebraProvider[];
  /** List of appointments */
  Appointments: TebraDailySessionAppointment[];
  /** Creation timestamp */
  CreatedAt: string;
  /** Last update timestamp */
  UpdatedAt: string;
}

export interface TebraProvider {
  ProviderId: string;
  FirstName: string;
  LastName: string;
  Title: string;
} 