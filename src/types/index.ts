/**
 * PatientApptStatus - Combined status type for patient workflow and appointment scheduling
 * Represents both the internal workflow status and external scheduling status
 * Used for tracking the patient's progress through the clinic workflow
 */
export type PatientApptStatus = 
  // Internal workflow statuses (lowercase kebab-case)
  | 'scheduled' | 'arrived' | 'appt-prep' | 'ready-for-md' | 'seen-by-md' | 'completed'
  // External scheduling statuses (Title Case with spaces)
  | 'Scheduled' | 'Reminder Sent' | 'Confirmed' | 'Arrived' | 'Checked In' | 'Roomed' | 'Appt Prep Started' 
  | 'Ready for MD' | 'With Doctor' | 'Seen by MD' | 'Checked Out' | 'No Show' | 'Rescheduled' | 'Cancelled';

// For backward compatibility and type safety during transition
export type PatientStatus = 'scheduled' | 'arrived' | 'appt-prep' | 'ready-for-md' | 'With Doctor' | 'seen-by-md' | 'completed';
export type AppointmentStatus = 'Scheduled' | 'Reminder Sent' | 'Confirmed' | 'Arrived' | 'Checked In' | 'Roomed' | 'Appt Prep Started' | 'Ready for MD' | 'With Doctor' | 'Seen by MD' | 'Checked Out' | 'No Show' | 'Rescheduled' | 'Cancelled';

export type AppointmentType = 'Office Visit' | 'LABS';

export interface Patient {
  id: string;
  name: string;
  dob: string;
  appointmentTime: string;
  appointmentType?: AppointmentType;
  /**
   * Combined status for both internal workflow and external scheduling
   * Used for tracking the patient's progress through the clinic workflow
   * Can be either an internal workflow status (lowercase kebab-case)
   * or an external scheduling status (Title Case with spaces)
   */
  status: PatientApptStatus;
  visitType?: string;
  provider: string;
  room?: string;
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
