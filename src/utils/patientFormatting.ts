import { Patient } from '../types';

export interface FormattedPatientData {
  formattedAppointmentDate: string;
  formattedAppointmentTime: string;
  displayStatus: string;
  formattedDOB: string;
  formattedCheckInTime: string;
  appointmentType: string;
  chiefComplaint: string;
  room: string;
}

export const formatPatientData = (patient: Patient): FormattedPatientData => {
  const appointmentDate = new Date(patient.appointmentTime);
  const formattedAppointmentDate = `${appointmentDate.getMonth() + 1}/${appointmentDate.getDate()}/${appointmentDate.getFullYear()}`;

  let hours = appointmentDate.getHours();
  const minutes = appointmentDate.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  const formattedAppointmentTime = `${hours}:${minutesStr} ${ampm}`;

  const displayStatus = mapStatusToDisplayStatus(patient.status as string);

  const dobDate = new Date(patient.dob);
  const formattedDOB = `${dobDate.getMonth() + 1}/${dobDate.getDate()}/${dobDate.getFullYear()}`;

  let formattedCheckInTime = '';
  if (patient.checkInTime) {
    const checkInTime = new Date(patient.checkInTime);
    let hours = checkInTime.getHours();
    const minutes = checkInTime.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    formattedCheckInTime = `${hours}:${minutesStr} ${ampm}`;
  }

  return {
    formattedAppointmentDate,
    formattedAppointmentTime,
    displayStatus,
    formattedDOB,
    formattedCheckInTime,
    appointmentType: patient.appointmentType || 'Office Visit',
    chiefComplaint: patient.chiefComplaint || 'Follow-Up',
    room: patient.room || ''
  };
};

const mapStatusToDisplayStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'arrived': 'Checked In',
    'appt-prep': 'Appt Prep Started',
    'ready-for-md': 'Ready for MD',
    'With Doctor': 'With Doctor',
    'seen-by-md': 'Seen by MD',
    'completed': 'Checked Out',
    'Confirmed': 'Confirmed',
    'Rescheduled': 'Rescheduled',
    'Cancelled': 'Cancelled'
  };

  return statusMap[status] || 'Scheduled';
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatDateForFilename = (date: Date): string => {
  return formatDate(date).replace(/\//g, '-');
};