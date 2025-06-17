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
  const formattedAppointmentDate = appointmentDate.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Chicago'
  });

  const formattedAppointmentTime = appointmentDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Chicago'
  });

  const displayStatus = mapStatusToDisplayStatus(patient.status as string);

  const dobDate = new Date(patient.dob);
  const formattedDOB = dobDate.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Chicago'
  });

  let formattedCheckInTime = '';
  if (patient.checkInTime) {
    const checkInTime = new Date(patient.checkInTime);
    formattedCheckInTime = checkInTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Chicago'
    });
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