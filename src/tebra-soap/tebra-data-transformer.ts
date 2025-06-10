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
    // Ensure date is in string format
    let dateOfBirth: string = '';
    const rawDate = data.DateOfBirth || data.DOB;
    if (rawDate) {
      if (rawDate instanceof Date) {
        dateOfBirth = rawDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      } else {
        dateOfBirth = String(rawDate);
      }
    }

    return {
      PatientId: data.PatientId || data.Id || '',
      FirstName: data.FirstName || '',
      LastName: data.LastName || '',
      DateOfBirth: dateOfBirth,
      Gender: data.Gender || '',
      Email: data.Email || data.EmailAddress || '',
      Phone: data.Phone || data.PhoneNumber || '',
      Address: {
        Street: data.Address?.Street || '',
        City: data.Address?.City || '',
        State: data.Address?.State || '',
        ZipCode: data.Address?.ZipCode || data.Address?.Zip || '',
        Country: data.Address?.Country || 'USA'
      },
      Insurance: {
        Provider: data.Insurance?.Provider || '',
        PolicyNumber: data.Insurance?.PolicyNumber || '',
        GroupNumber: data.Insurance?.GroupNumber || ''
      },
      CreatedAt: data.CreatedAt || new Date().toISOString(),
      UpdatedAt: data.UpdatedAt || new Date().toISOString()
    };
  }

  /**
   * Transforms appointment data from Tebra format
   * @param {any} data - Raw appointment data
   * @returns {TebraAppointment} Transformed appointment data
   */
  public transformAppointmentData(data: any): TebraAppointment {
    return {
      AppointmentId: data.AppointmentId || data.Id || '',
      PatientId: data.PatientId || '',
      ProviderId: data.ProviderId || '',
      StartTime: data.StartTime || data.AppointmentTime || data.Time || '',
      EndTime: data.EndTime || '',
      Status: data.Status || 'Scheduled',
      Type: data.Type || data.AppointmentType || 'Office Visit',
      Notes: data.Notes || '',
      CreatedAt: data.CreatedAt || new Date().toISOString(),
      UpdatedAt: data.UpdatedAt || new Date().toISOString()
    };
  }

  /**
   * Transforms daily session data from Tebra format
   * @param {any} data - Raw daily session data
   * @returns {TebraDailySession} Transformed daily session data
   */
  public transformDailySessionData(data: any): TebraDailySession {
    return {
      SessionId: data.SessionId || data.Id || '',
      Date: data.Date || new Date().toISOString(),
      ProviderId: data.ProviderId || '',
      Appointments: data.Appointments?.map((appointment: any) => ({
        AppointmentId: appointment.AppointmentId || appointment.Id || '',
        PatientId: appointment.PatientId || '',
        StartTime: appointment.StartTime || appointment.AppointmentTime || '',
        EndTime: appointment.EndTime || '',
        Status: appointment.Status || 'Scheduled',
        Type: appointment.Type || appointment.AppointmentType || 'Office Visit'
      })) || [],
      CreatedAt: data.CreatedAt || new Date().toISOString(),
      UpdatedAt: data.UpdatedAt || new Date().toISOString()
    };
  }

  static combineToInternalPatient(
    appointment: TebraAppointment,
    patient: TebraPatient,
    providers: TebraProvider[]
  ): Patient {
    const provider = providers.find(p => p.ProviderId === appointment.ProviderId);
    
    // Map appointment type to internal AppointmentType
    const appointmentType: AppointmentType = 
      appointment.Type === 'Office Visit' || appointment.Type === 'LABS' 
        ? appointment.Type as AppointmentType
        : 'Office Visit'; // Default fallback
    
    // Parse appointment time - handle various formats
    let appointmentTime = appointment.StartTime;
    if (!appointmentTime.includes('T')) {
      // If it's just a time, use today's date
      const today = new Date().toISOString().split('T')[0];
      appointmentTime = `${today}T${appointment.StartTime}`;
    }
    
    return {
      id: patient.PatientId,
      name: `${patient.FirstName} ${patient.LastName}`,
      dob: patient.DateOfBirth,
      appointmentTime,
      appointmentType,
      provider: provider ? `${provider.Title} ${provider.FirstName} ${provider.LastName}` : 'Unknown Provider',
      status: 'scheduled',
      checkInTime: undefined,
      room: undefined
    };
  }
} 