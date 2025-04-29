export type PatientStatus = 'scheduled' | 'arrived' | 'appt-prep' | 'ready-for-md' | 'with-doctor' | 'seen-by-md' | 'completed';
export type AppointmentStatus = 'Scheduled' | 'Reminder Sent' | 'Confirmed' | 'Arrived' | 'Checked In' | 'Roomed' | 'Appt Prep Started' | 'Ready for MD' | 'Seen by MD' | 'Checked Out' | 'No Show' | 'Rescheduled' | 'Cancelled';
export type AppointmentType = 'Office Visit' | 'LABS';

export interface Patient {
  id: string;
  name: string;
  dob: string;
  appointmentTime: string;
  appointmentType?: AppointmentType;
  appointmentStatus?: AppointmentStatus;
  visitType?: string;
  provider: string;
  room?: string;
  status: PatientStatus;
  checkInTime?: string;
  withDoctorTime?: string;
  completedTime?: string;
}

export interface TimeMode {
  simulated: boolean;
  currentTime: string; // ISO string
}

export interface Metrics {
  totalAppointments: number;
  waitingCount: number;
  averageWaitTime: number;
  maxWaitTime: number;
}