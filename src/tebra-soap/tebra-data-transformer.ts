/**
 * @fileoverview Tebra data transformer for mapping between Tebra and internal formats
 * @module services/tebra/tebra-data-transformer
 */

import { TebraPatient, TebraAppointment, TebraDailySession } from './tebra-api-service.types';

/**
 * Tebra data transformer class
 * @class TebraDataTransformer
 */
export class TebraDataTransformer {
  /**
   * Maps Tebra appointment status to internal status
   * @param {string} tebraStatus - Tebra appointment status
   * @returns {string} Internal appointment status
   */
  static mapTebraStatusToInternal(tebraStatus: string): string {
    const statusMap: Record<string, string> = {
      'Scheduled': 'scheduled',
      'Confirmed': 'scheduled',
      'Arrived': 'arrived',
      'Roomed': 'appt-prep',
      'Ready for MD': 'ready-for-md',
      'With Doctor': 'with-doctor',
      'Seen by MD': 'seen-by-md',
      'Checked Out': 'completed',
      'Rescheduled': 'rescheduled',
      'Cancelled': 'cancelled',
      'No Show': 'no-show'
    };

    return statusMap[tebraStatus] || tebraStatus.toLowerCase();
  }

  /**
   * Transforms patient data from Tebra format to internal format
   * @param {any} tebraPatient - Patient data in Tebra format
   * @returns {TebraPatient} Patient data in internal format
   */
  transformPatientData(tebraPatient: any): TebraPatient {
    return {
      PatientId: tebraPatient.PatientId || tebraPatient.Id || '',
      FirstName: tebraPatient.FirstName || '',
      LastName: tebraPatient.LastName || '',
      DateOfBirth: tebraPatient.DateOfBirth || tebraPatient.DOB || '',
      Phone: tebraPatient.Phone || tebraPatient.PhoneNumber || '',
      Email: tebraPatient.Email || tebraPatient.EmailAddress || '',
      Gender: tebraPatient.Gender || '',
      Address: {
        Street: tebraPatient.Address?.Street || '',
        City: tebraPatient.Address?.City || '',
        State: tebraPatient.Address?.State || '',
        ZipCode: tebraPatient.Address?.ZipCode || '',
        Country: tebraPatient.Address?.Country || ''
      },
      Insurance: {
        Provider: tebraPatient.Insurance?.Provider || '',
        PolicyNumber: tebraPatient.Insurance?.PolicyNumber || '',
        GroupNumber: tebraPatient.Insurance?.GroupNumber || ''
      },
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString()
    };
  }

  /**
   * Transforms appointment data from Tebra format to internal format
   * @param {any} tebraAppointment - Appointment data in Tebra format
   * @returns {TebraAppointment} Appointment data in internal format
   */
  transformAppointmentData(tebraAppointment: any): TebraAppointment {
    return {
      AppointmentId: tebraAppointment.AppointmentId || tebraAppointment.Id || '',
      PatientId: tebraAppointment.PatientId || '',
      ProviderId: tebraAppointment.ProviderId || '',
      StartTime: tebraAppointment.AppointmentTime || tebraAppointment.Time || '',
      EndTime: tebraAppointment.EndTime || '',
      Status: tebraAppointment.Status || 'Scheduled',
      Type: tebraAppointment.AppointmentType || tebraAppointment.Type || 'Office Visit',
      Notes: tebraAppointment.Notes || '',
      CreatedAt: tebraAppointment.CreatedAt || new Date().toISOString(),
      UpdatedAt: tebraAppointment.UpdatedAt || new Date().toISOString()
    };
  }

  /**
   * Transforms daily session data from Tebra format to internal format
   * @param {any} tebraDailySession - Daily session data in Tebra format
   * @returns {TebraDailySession} Daily session data in internal format
   */
  transformDailySessionData(tebraDailySession: any): TebraDailySession {
    return {
      SessionId: tebraDailySession.SessionId || '',
      Date: tebraDailySession.Date || new Date().toISOString(),
      Appointments: Array.isArray(tebraDailySession.Appointments) 
        ? tebraDailySession.Appointments.map((apt: any) => this.transformAppointmentData(apt))
        : [],
      Providers: Array.isArray(tebraDailySession.Providers)
        ? tebraDailySession.Providers.map((provider: any) => ({
            ProviderId: provider.ProviderId || provider.Id || '',
            FirstName: provider.FirstName || '',
            LastName: provider.LastName || '',
            Title: provider.Title || 'Dr.'
          }))
        : [],
      CreatedAt: tebraDailySession.CreatedAt || new Date().toISOString(),
      UpdatedAt: tebraDailySession.UpdatedAt || new Date().toISOString()
    };
  }

  /**
   * Combines Tebra patient data with internal patient data
   * @param {any} tebraPatient - Patient data from Tebra
   * @param {any} internalPatient - Existing internal patient data
   * @returns {any} Combined patient data
   */
  static combineToInternalPatient(tebraPatient: any, internalPatient: any): any {
    return {
      ...internalPatient,
      externalId: tebraPatient.PatientId || tebraPatient.Id || internalPatient.externalId,
      firstName: tebraPatient.FirstName || internalPatient.firstName,
      lastName: tebraPatient.LastName || internalPatient.lastName,
      dateOfBirth: tebraPatient.DateOfBirth || tebraPatient.DOB || internalPatient.dateOfBirth,
      phone: tebraPatient.Phone || tebraPatient.PhoneNumber || internalPatient.phone,
      email: tebraPatient.Email || tebraPatient.EmailAddress || internalPatient.email,
      lastUpdated: new Date().toISOString()
    };
  }
}
