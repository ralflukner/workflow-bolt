/**
 * @fileoverview Data transformer for Tebra API responses
 * @module services/tebra/tebra-data-transformer
 */

import { Patient, AppointmentType } from '../types';
import { TebraPatient, TebraAppointment, TebraDailySession } from './tebra-api-service.types';

/**
 * Tebra data transformer class
 * @class TebraDataTransformer
 */
export class TebraDataTransformer {
  /**
   * Transforms patient data from Tebra format
   * @param {any} data - Raw patient data
   * @returns {TebraPatient} Transformed patient data
   */
  public transformPatientData(data: any): TebraPatient {
    return {
      PatientId: data.id,
      FirstName: data.firstName,
      LastName: data.lastName,
      DateOfBirth: new Date(data.dateOfBirth),
      Gender: data.gender,
      Email: data.email,
      Phone: data.phone,
      Address: {
        Street: data.address?.street,
        City: data.address?.city,
        State: data.address?.state,
        ZipCode: data.address?.zipCode,
        Country: data.address?.country
      },
      Insurance: {
        Provider: data.insurance?.provider,
        PolicyNumber: data.insurance?.policyNumber,
        GroupNumber: data.insurance?.groupNumber
      },
      CreatedAt: new Date(data.createdAt),
      UpdatedAt: new Date(data.updatedAt)
    };
  }

  /**
   * Transforms appointment data from Tebra format
   * @param {any} data - Raw appointment data
   * @returns {TebraAppointment} Transformed appointment data
   */
  public transformAppointmentData(data: any): TebraAppointment {
    return {
      AppointmentId: data.id,
      PatientId: data.patientId,
      ProviderId: data.providerId,
      StartTime: new Date(data.startTime),
      EndTime: new Date(data.endTime),
      Status: data.status,
      Type: data.type,
      Notes: data.notes,
      CreatedAt: new Date(data.createdAt),
      UpdatedAt: new Date(data.updatedAt)
    };
  }

  /**
   * Transforms daily session data from Tebra format
   * @param {any} data - Raw daily session data
   * @returns {TebraDailySession} Transformed daily session data
   */
  public transformDailySessionData(data: any): TebraDailySession {
    return {
      SessionId: data.id,
      Date: new Date(data.date),
      ProviderId: data.providerId,
      Appointments: data.appointments?.map((appointment: any) => ({
        AppointmentId: appointment.id,
        PatientId: appointment.patientId,
        StartTime: new Date(appointment.startTime),
        EndTime: new Date(appointment.endTime),
        Status: appointment.status,
        Type: appointment.type
      })) || [],
      CreatedAt: new Date(data.createdAt),
      UpdatedAt: new Date(data.updatedAt)
    };
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