/**
 * Pure utility for parsing TSV schedule data into patient objects
 * Extracted from ImportSchedule component for better testability
 */

import { PatientApptStatus, AppointmentType } from '../types';

export interface ImportedPatient {
  name: string;
  dob: string;
  appointmentTime: string;
  appointmentType: AppointmentType;
  chiefComplaint: string;
  provider: string;
  status: PatientApptStatus;
  checkInTime?: string;
  room?: string;
}

// Status constants to prevent string drift
const STATUS_CONFIRMED = ['confirmed', 'scheduled', 'reminder sent'];
const STATUS_ARRIVED = ['arrived', 'checked in'];
const STATUS_APPT_PREP = ['roomed', 'appt prep started'];
const STATUS_CHECKED_OUT = ['checked out', 'checkedout'];
const STATUS_CANCELLED = ['cancelled', 'canceled'];
const HAS_CHECKED_IN = ['arrived', 'appt-prep', 'ready-for-md', 'With Doctor', 'seen-by-md', 'completed'];
const STATUS_IN_ROOM = ['appt-prep', 'ready-for-md', 'With Doctor'];

export interface ParseScheduleOptions {
  defaultProvider?: string;
  logFunction?: (message: string) => void;
}

/**
 * Parses TSV schedule data into an array of patient objects
 * @param text - Tab-separated values string
 * @param currentTime - Current time for relative calculations
 * @param options - Optional configuration
 * @returns Array of parsed patient objects
 */
export function parseSchedule(
  text: string, 
  currentTime: Date = new Date(), 
  options: ParseScheduleOptions = {}
): ImportedPatient[] {
  const { defaultProvider = 'Dr. Lukner', logFunction = () => {} } = options;
  
  const lines = text.trim().split('\n');
  const patients: ImportedPatient[] = [];

  logFunction(`Processing ${lines.length} lines`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.trim().split('\t');
    logFunction(`Line ${i + 1}: ${parts.length} parts: [${parts.slice(0, 6).join(', ')}]`);
    
    if (parts.length < 6) {
      logFunction(`Skipping line ${i + 1}: not enough columns (${parts.length})`);
      continue;
    }

    // Extract parts based on actual data format
    // Format: Date, Time, Status, Name, DOB, Type, [more columns], Insurance, Amount
    const [date, time, status, name, dob, type] = parts;
    
    // Parse and validate time
    const timeMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) {
      logFunction(`Skipping line ${i + 1}: invalid time format "${time}"`);
      continue;
    }

    const [, hours, minutes, period] = timeMatch;
    let hour = parseInt(hours);
    const isPM = period.toUpperCase() === 'PM';

    if (isPM && hour !== 12) {
      hour += 12;
    } else if (!isPM && hour === 12) {
      hour = 0;
    }

    // Parse and validate DOB
    const dobParts = dob.split('/');
    if (dobParts.length !== 3) {
      logFunction(`Skipping line ${i + 1}: invalid DOB format "${dob}"`);
      continue;
    }
    const [month, day, year] = dobParts;
    const formattedDOB = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    // Parse and validate appointment date (MM/DD/YYYY)
    const dateParts = date.split('/');
    if (dateParts.length !== 3) {
      logFunction(`Skipping line ${i + 1}: invalid date format "${date}"`);
      continue;
    }
    const [appointmentMonth, appointmentDay, appointmentYear] = dateParts;

    // Create appointment time
    const appointmentDate = new Date(
      parseInt(appointmentYear), 
      parseInt(appointmentMonth) - 1, // Month is 0-indexed in JavaScript
      parseInt(appointmentDay),
      hour, 
      parseInt(minutes), 
      0, 
      0
    );

    // Validate the created date
    if (isNaN(appointmentDate.getTime())) {
      logFunction(`Skipping line ${i + 1}: invalid date/time combination`);
      continue;
    }

    // Map external status to internal workflow status
    const patientStatus = mapStatusToInternal(status.trim());

    // Set check-in time for patients who have already checked in
    let checkInTime: string | undefined = undefined;
    let room: string | undefined = undefined;

    // Check if this patient has checked in (based on status)
    const hasCheckedIn = HAS_CHECKED_IN.includes(patientStatus);
    
    if (hasCheckedIn) {
      // Set check-in time to 30 minutes before appointment for testing
      const defaultCheckInTime = new Date(appointmentDate);
      defaultCheckInTime.setMinutes(defaultCheckInTime.getMinutes() - 30);
      checkInTime = defaultCheckInTime.toISOString();
    }

    // Assign room for patients who are in a room
    if (STATUS_IN_ROOM.includes(patientStatus)) {
      room = 'Waiting'; // Default room assignment
    }

    // Map appointment type to valid enum values
    let appointmentType: AppointmentType = 'Office Visit';
    if (type && type.toLowerCase().includes('lab')) {
      appointmentType = 'LABS';
    }

    const patient: ImportedPatient = {
      name: name.trim(),
      dob: formattedDOB,
      appointmentTime: appointmentDate.toISOString(),
      appointmentType,
      chiefComplaint: (type || "Follow-up").trim(),
      provider: defaultProvider,
      status: patientStatus,
      checkInTime,
      room,
    };
    
    patients.push(patient);
    logFunction(`Successfully parsed line ${i + 1}: ${patient.name} - ${patient.status}`);
  }

  return patients;
}

/**
 * Maps external status strings to internal PatientApptStatus values
 * @param externalStatus - Status string from external system
 * @returns Mapped internal status
 */
function mapStatusToInternal(externalStatus: string): PatientApptStatus {
  const statusLower = externalStatus.toLowerCase();
  
  if (STATUS_CONFIRMED.includes(statusLower)) {
    return 'scheduled';
  } else if (STATUS_ARRIVED.includes(statusLower)) {
    return 'arrived';
  } else if (STATUS_APPT_PREP.includes(statusLower)) {
    return 'appt-prep';
  } else if (statusLower === 'ready for md') {
    return 'ready-for-md';
  } else if (statusLower === 'with doctor') {
    return 'With Doctor';
  } else if (statusLower === 'seen by md') {
    return 'seen-by-md';
  } else if (STATUS_CHECKED_OUT.includes(statusLower)) {
    return 'completed';
  } else if (statusLower === 'rescheduled') {
    return 'Rescheduled';
  } else if (STATUS_CANCELLED.includes(statusLower)) {
    return 'Cancelled';
  } else if (statusLower === 'no show') {
    return 'No Show';
  }
  
  // Default fallback
  return 'scheduled';
}