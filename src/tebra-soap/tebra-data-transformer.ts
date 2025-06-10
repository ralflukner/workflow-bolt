/**
 * @fileoverview Data transformer for Tebra API responses
 * @module services/tebra/tebra-data-transformer
 */

import { Patient, AppointmentType } from '../types';
import { TebraAppointment, TebraPatient, TebraProvider } from './tebra-api-service.types';

/**
 * Tebra data transformer class
 * @class TebraDataTransformer
 */
export class TebraDataTransformer {
  /**
   * Transforms patient data from Tebra format to internal format
   * @param {any} data - Raw patient data from Tebra
   * @returns {TebraPatient} Transformed patient data
   * @throws {Error} If data transformation fails
   */
  public transformPatientData(data: any): TebraPatient {
    try {
      return {
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
        email: data.email,
        phone: data.phone,
        address: {
          street: data.address?.street,
          city: data.address?.city,
          state: data.address?.state,
          zipCode: data.address?.zipCode
        },
        insurance: {
          provider: data.insurance?.provider,
          policyNumber: data.insurance?.policyNumber,
          groupNumber: data.insurance?.groupNumber
        },
        medicalHistory: data.medicalHistory || [],
        allergies: data.allergies || [],
        medications: data.medications || []
      };
    } catch (error) {
      console.error('Failed to transform patient data:', error);
      throw new Error('Failed to transform patient data');
    }
  }

  /**
   * Transforms appointment data from Tebra format to internal format
   * @param {any} data - Raw appointment data from Tebra
   * @returns {TebraAppointment} Transformed appointment data
   * @throws {Error} If data transformation fails
   */
  public transformAppointmentData(data: any): TebraAppointment {
    try {
      return {
        id: data.id,
        patientId: data.patientId,
        providerId: data.providerId,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        status: data.status,
        type: data.type,
        notes: data.notes,
        location: data.location,
        reason: data.reason
      };
    } catch (error) {
      console.error('Failed to transform appointment data:', error);
      throw new Error('Failed to transform appointment data');
    }
  }

  /**
   * Transforms daily session data from Tebra format to internal format
   * @param {any} data - Raw daily session data from Tebra
   * @returns {TebraDailySession} Transformed daily session data
   * @throws {Error} If data transformation fails
   */
  public transformDailySessionData(data: any): TebraDailySession {
    try {
      return {
        date: new Date(data.date),
        providerId: data.providerId,
        appointments: data.appointments?.map((appt: any) => this.transformAppointmentData(appt)) || [],
        status: data.status,
        notes: data.notes,
        location: data.location
      };
    } catch (error) {
      console.error('Failed to transform daily session data:', error);
      throw new Error('Failed to transform daily session data');
    }
  }

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