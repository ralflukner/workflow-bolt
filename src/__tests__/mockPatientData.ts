import { Patient } from '../types';

export const mockPatientData: Patient[] = [
  {
    id: 'pat-1',
    name: 'John Doe',
    dob: '1990-01-01',
    appointmentTime: '2024-01-15T09:00:00.000Z',
    appointmentType: 'Office Visit',
    provider: 'Dr. Smith',
    status: 'Checked Out',
    chiefComplaint: 'Annual checkup'
  },
  {
    id: 'pat-2', 
    name: 'Jane Smith',
    dob: '1985-05-15',
    appointmentTime: '2024-01-15T10:30:00.000Z',
    appointmentType: 'Office Visit',
    provider: 'Dr. Johnson',
    status: 'Roomed',
    chiefComplaint: 'Cosmetic consultation'
  }
];
