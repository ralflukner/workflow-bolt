/**
 * @fileoverview Type definitions for Tebra integration
 * @module services/tebra/types
 */

/**
 * Tebra credentials interface
 * @interface TebraCredentials
 */
export interface TebraCredentials {
  /** WSDL URL for Tebra API */
  wsdlUrl: string;
  /** Tebra username */
  username: string;
  /** Tebra password */
  password: string;
}

/**
 * Tebra patient interface
 * @interface TebraPatient
 */
export interface TebraPatient {
  /** Patient ID */
  id: string;
  /** Patient's first name */
  firstName: string;
  /** Patient's last name */
  lastName: string;
  /** Patient's date of birth */
  dateOfBirth: Date;
  /** Patient's gender */
  gender: string;
  /** Patient's email address */
  email: string;
  /** Patient's phone number */
  phone: string;
  /** Patient's address */
  address: {
    /** Street address */
    street?: string;
    /** City */
    city?: string;
    /** State */
    state?: string;
    /** ZIP code */
    zipCode?: string;
  };
  /** Patient's insurance information */
  insurance: {
    /** Insurance provider */
    provider?: string;
    /** Policy number */
    policyNumber?: string;
    /** Group number */
    groupNumber?: string;
  };
  /** Patient's medical history */
  medicalHistory: string[];
  /** Patient's allergies */
  allergies: string[];
  /** Patient's medications */
  medications: string[];
}

/**
 * Tebra appointment interface
 * @interface TebraAppointment
 */
export interface TebraAppointment {
  /** Appointment ID */
  id: string;
  /** Patient ID */
  patientId: string;
  /** Provider ID */
  providerId: string;
  /** Appointment start time */
  startTime: Date;
  /** Appointment end time */
  endTime: Date;
  /** Appointment status */
  status: string;
  /** Appointment type */
  type: string;
  /** Appointment notes */
  notes?: string;
  /** Appointment location */
  location?: string;
  /** Appointment reason */
  reason?: string;
}

/**
 * Tebra daily session interface
 * @interface TebraDailySession
 */
export interface TebraDailySession {
  /** Session date */
  date: Date;
  /** Provider ID */
  providerId: string;
  /** Appointments for the day */
  appointments: TebraAppointment[];
  /** Session status */
  status: string;
  /** Session notes */
  notes?: string;
  /** Session location */
  location?: string;
}

/**
 * Tebra provider interface
 * @interface TebraProvider
 */
export interface TebraProvider {
  /** Provider ID */
  id: string;
  /** Provider's first name */
  firstName: string;
  /** Provider's last name */
  lastName: string;
  /** Provider's specialty */
  specialty: string;
  /** Provider's email */
  email: string;
  /** Provider's phone */
  phone: string;
  /** Provider's NPI number */
  npi: string;
  /** Provider's active status */
  isActive: boolean;
} 