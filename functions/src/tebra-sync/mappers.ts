import { TebraAppointment, TebraPatient, TebraProvider } from '../types/tebra';
import { tebraStatusToInternal } from './status-map';

export interface DashboardPatient {
  id: string;
  name: string;
  dob: string;
  appointmentTime: string;
  appointmentType: string;
  provider: string;
  status: ReturnType<typeof tebraStatusToInternal>;
  phone?: string;
  email?: string;
}

export const toDashboardPatient = (
  appointment: TebraAppointment,
  patient: TebraPatient,
  provider: TebraProvider | undefined,
): DashboardPatient => ({
  id: patient.PatientId || patient.Id || '',
  name: `${patient.FirstName} ${patient.LastName}`.trim(),
  dob: patient.DateOfBirth || patient.DOB || '',
  appointmentTime:
    appointment.StartTime ??
    appointment.AppointmentTime ??
    `${appointment.Date || appointment.AppointmentDate || ''} ${appointment.Time || ''}`.trim(),
  appointmentType: appointment.Type || appointment.AppointmentType || 'Office Visit',
  provider: provider
    ? `${provider.Title || provider.Degree || 'Dr.'} ${provider.FirstName} ${provider.LastName}`
    : 'Unknown Provider',
  status: tebraStatusToInternal(appointment.Status || appointment.status || ''),
  phone: patient.Phone || patient.PhoneNumber,
  email: patient.Email || patient.EmailAddress,
}); 