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
  id: patient.PatientId,
  name: `${patient.FirstName} ${patient.LastName}`.trim(),
  dob: patient.DateOfBirth,
  appointmentTime:
    appointment.StartTime ??
    `${appointment.Date} ${appointment.Time ?? ''}`.trim(),
  appointmentType: appointment.Type ?? 'Office Visit',
  provider: provider
    ? `${provider.Title ?? 'Dr.'} ${provider.FirstName} ${provider.LastName}`
    : 'Unknown Provider',
  status: tebraStatusToInternal(appointment.Status ?? ''),
  phone: patient.Phone,
  email: patient.Email,
}); 