/**
 * Robust Patient Status System using TypeScript enums and utilities
 * Eliminates string literal fragility with type-safe status management
 */

// Core status enum - single source of truth
export enum PatientStatus {
  SCHEDULED = 'scheduled',
  ARRIVED = 'arrived',
  APPT_PREP = 'appt-prep',
  READY_FOR_MD = 'ready-for-md',
  WITH_DOCTOR = 'with-doctor',
  SEEN_BY_MD = 'seen-by-md',
  COMPLETED = 'completed',
  CHECKED_OUT = 'checked-out',
  RESCHEDULED = 'rescheduled',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no-show'
}

// Display labels for UI - type-safe mapping
export const PatientStatusLabels: Record<PatientStatus, string> = {
  [PatientStatus.SCHEDULED]: 'Scheduled',
  [PatientStatus.ARRIVED]: 'Arrived',
  [PatientStatus.APPT_PREP]: 'Appt Prep',
  [PatientStatus.READY_FOR_MD]: 'Ready for MD',
  [PatientStatus.WITH_DOCTOR]: 'With Doctor',
  [PatientStatus.SEEN_BY_MD]: 'Seen by MD',
  [PatientStatus.COMPLETED]: 'Completed',
  [PatientStatus.CHECKED_OUT]: 'Checked Out',
  [PatientStatus.RESCHEDULED]: 'Rescheduled',
  [PatientStatus.CANCELLED]: 'Cancelled',
  [PatientStatus.NO_SHOW]: 'No Show'
};

// Status categories for business logic
export const PatientStatusCategories = {
  WAITING: [PatientStatus.ARRIVED, PatientStatus.APPT_PREP, PatientStatus.READY_FOR_MD],
  IN_PROGRESS: [PatientStatus.WITH_DOCTOR, PatientStatus.SEEN_BY_MD],
  COMPLETED_TODAY: [PatientStatus.COMPLETED, PatientStatus.CHECKED_OUT],
  CANCELLED_OR_NO_SHOW: [PatientStatus.CANCELLED, PatientStatus.NO_SHOW],
  FUTURE: [PatientStatus.SCHEDULED, PatientStatus.RESCHEDULED]
} as const;

// Utility functions for type-safe status checking
export class PatientStatusUtils {
  static isWaiting(status: PatientStatus | string): boolean {
    return PatientStatusCategories.WAITING.includes(status as PatientStatus);
  }
  
  static isCompleted(status: PatientStatus | string): boolean {
    return PatientStatusCategories.COMPLETED_TODAY.includes(status as PatientStatus);
  }
  
  static isInProgress(status: PatientStatus | string): boolean {
    return PatientStatusCategories.IN_PROGRESS.includes(status as PatientStatus);
  }
  
  static getDisplayLabel(status: PatientStatus): string {
    return PatientStatusLabels[status];
  }
  
  static fromString(statusString: string): PatientStatus | null {
    // Handle legacy string values safely
    const statusValues = Object.values(PatientStatus) as string[];
    const found = statusValues.find(s => s === statusString);
    return found ? (found as PatientStatus) : null;
  }
}

// For external API compatibility (Tebra, etc.)
export type ExternalPatientStatus = string;

// Migration helper - converts external status to internal enum
export function normalizePatientStatus(externalStatus: ExternalPatientStatus): PatientStatus {
  const normalized = externalStatus.toLowerCase().replace(/\s+/g, '-');
  
  // Handle common external status mappings
  const mappings: Record<string, PatientStatus> = {
    'checked-in': PatientStatus.ARRIVED,
    'roomed': PatientStatus.APPT_PREP,
    'ready-for-md': PatientStatus.READY_FOR_MD,
    'with-doctor': PatientStatus.WITH_DOCTOR,
    'checked-out': PatientStatus.CHECKED_OUT,
    'completed': PatientStatus.COMPLETED,
    'scheduled': PatientStatus.SCHEDULED,
    'cancelled': PatientStatus.CANCELLED,
    'no-show': PatientStatus.NO_SHOW
  };
  
  return mappings[normalized] || PatientStatus.SCHEDULED;
}

// Legacy type for backward compatibility - temporarily permissive
export type PatientApptStatus = PatientStatus | string;

export type AppointmentType = 'Office Visit' | 'LABS' | 'New Patient';

export interface Patient {
  id: string;
  name: string;
  dob: string;
  appointmentTime: string;
  appointmentType?: AppointmentType;
  /**
   * Patient status - temporarily accepting both enum and string for migration
   * Represents the patient's progress through the clinic workflow
   */
  status: PatientStatus | string;
  chiefComplaint?: string;
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
  totalPatients: number;
  patientsByStatus: {
    scheduled: number;
    arrived: number;
    'appt-prep': number;
    'ready-for-md': number;
    'With Doctor': number;
    'seen-by-md': number;
    completed: number;
    Cancelled: number;
    'No Show': number;
    Rescheduled: number;
  };
  averageWaitTime: number;
  patientsSeenToday: number;
}
