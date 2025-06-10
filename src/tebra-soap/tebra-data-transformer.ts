/**
 * @fileoverview Data transformer for Tebra API responses
 * @module services/tebra/tebra-data-transformer
 */

import { Patient, AppointmentType } from '../types';
import { TebraPatient, TebraAppointment, TebraDailySession, TebraProvider } from './tebra-api-service.types';

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
    // Handle date conversion safely
    const getDateString = (date: any): string => {
      if (!date) return '';
      if (typeof date === 'string') return date;
      if (date instanceof Date) return date.toISOString().split('T')[0];
      return String(date);
    };

    return {
      PatientId: data.PatientId || data.Id || data.id || '',
      FirstName: data.FirstName || data.firstName || '',
      LastName: data.LastName || data.lastName || '',
      DateOfBirth: getDateString(data.DateOfBirth || data.DOB || data.dateOfBirth),
      Gender: data.Gender || data.gender || '',
      Email: data.Email || data.EmailAddress || data.email || '',
      Phone: data.Phone || data.PhoneNumber || data.phone || '',
      Address: {
        Street: data.Address?.Street || data.address?.street || '',
        City: data.Address?.City || data.address?.city || '',
        State: data.Address?.State || data.address?.state || '',
        ZipCode: data.Address?.ZipCode || data.Address?.Zip || data.address?.zipCode || '',
        Country: data.Address?.Country || data.address?.country || 'USA'
      },
      Insurance: {
        Provider: data.Insurance?.Provider || data.insurance?.provider || '',
        PolicyNumber: data.Insurance?.PolicyNumber || data.insurance?.policyNumber || '',
        GroupNumber: data.Insurance?.GroupNumber || data.insurance?.groupNumber || ''
      },
      CreatedAt: getDateString(data.CreatedAt || data.createdAt) || new Date().toISOString(),
      UpdatedAt: getDateString(data.UpdatedAt || data.updatedAt) || new Date().toISOString()
    };
  }

  /**
   * Transforms appointment data from Tebra format
   * @param {any} data - Raw appointment data
   * @returns {TebraAppointment} Transformed appointment data
   */
  public transformAppointmentData(data: any): TebraAppointment {
    // Handle date conversion safely
    const getDateString = (date: any): string => {
      if (!date) return '';
      if (typeof date === 'string') return date;
      if (date instanceof Date) return date.toISOString();
      return String(date);
    };

    return {
      AppointmentId: data.AppointmentId || data.Id || data.id || '',
      PatientId: data.PatientId || data.patientId || '',
      ProviderId: data.ProviderId || data.providerId || '',
      StartTime: getDateString(data.StartTime || data.AppointmentTime || data.startTime),
      EndTime: getDateString(data.EndTime || data.endTime),
      Status: data.Status || data.status || 'Scheduled',
      Type: data.Type || data.AppointmentType || data.type || 'Office Visit',
      Notes: data.Notes || data.notes || '',
      CreatedAt: getDateString(data.CreatedAt || data.createdAt) || new Date().toISOString(),
      UpdatedAt: getDateString(data.UpdatedAt || data.updatedAt) || new Date().toISOString()
    };
  }

  /**
   * Transforms daily session data from Tebra format
   * @param {any} data - Raw daily session data
   * @returns {TebraDailySession} Transformed daily session data
   */
  public transformDailySessionData(data: any): TebraDailySession {
    // Handle date conversion safely
    const getDateString = (date: any): string => {
      if (!date) return '';
      if (typeof date === 'string') return date;
      if (date instanceof Date) return date.toISOString();
      return String(date);
    };

    return {
      SessionId: data.SessionId || data.Id || data.id || '',
      Date: getDateString(data.Date || data.date),
      ProviderId: data.ProviderId || data.providerId || '',
      Appointments: (data.Appointments || data.appointments)?.map((appointment: any) => ({
        AppointmentId: appointment.AppointmentId || appointment.Id || appointment.id || '',
        PatientId: appointment.PatientId || appointment.patientId || '',
        StartTime: getDateString(appointment.StartTime || appointment.AppointmentTime || appointment.startTime),
        EndTime: getDateString(appointment.EndTime || appointment.endTime),
        Status: appointment.Status || appointment.status || 'Scheduled',
        Type: appointment.Type || appointment.AppointmentType || appointment.type || 'Office Visit'
      })) || [],
      CreatedAt: getDateString(data.CreatedAt || data.createdAt) || new Date().toISOString(),
      UpdatedAt: getDateString(data.UpdatedAt || data.updatedAt) || new Date().toISOString()
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
      appointment.Type === 'Office Visit' || appointment.Type === 'LABS' 
        ? appointment.Type as AppointmentType
        : 'Office Visit'; // Default fallback
    
    return {
      id: patient.PatientId,
      name: `${patient.FirstName} ${patient.LastName}`,
      dob: patient.DateOfBirth,
      appointmentTime: `${appointment.StartTime}`,
      appointmentType,
      provider: provider ? `${provider.Title} ${provider.FirstName} ${provider.LastName}` : 'Unknown Provider',
      status: 'scheduled',
      checkInTime: undefined,
      room: undefined
    };
  }
} 