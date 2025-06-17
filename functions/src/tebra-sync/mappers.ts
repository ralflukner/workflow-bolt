import { TebraAppointment, TebraPatient, TebraProvider } from '../types/tebra';
import { tebraStatusToInternal, isCheckedIn } from './status-map';

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
  checkInTime?: string;
}

export const toDashboardPatient = (
  appointment: TebraAppointment,
  patient: TebraPatient,
  provider: TebraProvider | undefined,
): DashboardPatient => {
  const status = tebraStatusToInternal(appointment.Status || appointment.status || '');
  const appointmentTime = 
    appointment.StartTime ??
    appointment.AppointmentTime ??
    `${appointment.Date || appointment.AppointmentDate || ''} ${appointment.Time || ''}`.trim();
  
  // Determine if patient should be marked as checked in
  // Any status beyond scheduled indicates the patient has arrived
  const checkedInStatus = isCheckedIn(status);
  
  return {
    id: patient.PatientId || patient.Id || '',
    name: `${patient.FirstName} ${patient.LastName}`.trim(),
    dob: patient.DateOfBirth || patient.DOB || '',
    appointmentTime: appointmentTime,
    appointmentType: appointment.Type || appointment.AppointmentType || 'Office Visit',
    provider: provider
      ? `${provider.Title || provider.Degree || 'Dr.'} ${provider.FirstName} ${provider.LastName}`
      : 'Unknown Provider',
    status: status,
    phone: patient.Phone || patient.PhoneNumber,
    email: patient.Email || patient.EmailAddress,
    // Add checkInTime for patients who have arrived
    checkInTime: checkedInStatus ? appointmentTime : undefined,
  };
}; 