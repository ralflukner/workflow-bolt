export interface PatientSection {
  id: string;
  title: string;
  status: string;
}

export const PATIENT_SECTIONS: PatientSection[] = [
  { id: 'scheduled', title: 'Scheduled Patients', status: 'scheduled' },
  { id: 'Confirmed', title: 'Confirmed Patients', status: 'Confirmed' },
  { id: 'arrived', title: 'Arrived Patients', status: 'arrived' },
  { id: 'appt-prep', title: 'Appointment Prep', status: 'appt-prep' },
  { id: 'ready-for-md', title: 'Ready for MD', status: 'ready-for-md' },
  { id: 'With Doctor', title: 'With Doctor', status: 'With Doctor' },
  { id: 'seen-by-md', title: 'Seen by MD', status: 'seen-by-md' },
  { id: 'completed', title: 'Completed', status: 'completed' },
  { id: 'Rescheduled', title: 'Rescheduled Patients', status: 'Rescheduled' },
  { id: 'Cancelled', title: 'Cancelled Patients', status: 'Cancelled' },
  { id: 'No Show', title: 'No Show Patients', status: 'No Show' }
];