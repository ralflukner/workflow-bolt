import { Patient } from '../types';

// Helper to generate appointment times throughout the day
const getAppointmentTime = (hour: number, minute: number) => {
  const today = new Date();
  today.setHours(hour, minute, 0, 0);
  return today.toISOString();
};

// Helper to generate check-in times (15-30 minutes before appointment)
const getCheckInTime = (appointmentHour: number, appointmentMinute: number, minutesBefore: number = 20) => {
  const today = new Date();
  today.setHours(appointmentHour, appointmentMinute, 0, 0);
  today.setMinutes(today.getMinutes() - minutesBefore);
  return today.toISOString();
};

export const mockPatients: Patient[] = [
  {
    id: 'pat-1',
    name: 'John Smith',
    dob: '1985-04-12',
    appointmentTime: getAppointmentTime(9, 0),
    provider: 'Dr. Lukner',
    status: 'scheduled',
  },
  {
    id: 'pat-2',
    name: 'Sarah Johnson',
    dob: '1976-08-23',
    appointmentTime: getAppointmentTime(9, 15),
    provider: 'Dr. Lukner',
    status: 'arrived',
    checkInTime: getCheckInTime(9, 15, 25), // Checked in 25 minutes before appointment
  },
  {
    id: 'pat-3',
    name: 'Robert Davis',
    dob: '1990-01-05',
    appointmentTime: getAppointmentTime(9, 30),
    provider: 'Dr. Lukner',
    status: 'appt-prep',
    checkInTime: getCheckInTime(9, 30, 35), // Checked in 35 minutes before appointment
    room: 'Room A',
  },
  {
    id: 'pat-4',
    name: 'Maria Garcia',
    dob: '1968-11-15',
    appointmentTime: getAppointmentTime(10, 0),
    provider: 'Dr. Lukner',
    status: 'ready-for-md',
    checkInTime: getCheckInTime(10, 0, 45), // Checked in 45 minutes before appointment
    room: 'Room B',
  },
  {
    id: 'pat-5',
    name: 'James Wilson',
    dob: '1992-06-30',
    appointmentTime: getAppointmentTime(10, 15),
    provider: 'Dr. Lukner',
    status: 'with-doctor',
    checkInTime: getCheckInTime(10, 15, 50), // Checked in 50 minutes before appointment
    withDoctorTime: getCheckInTime(10, 15, 10), // Went to doctor 10 minutes before appointment
    room: 'Room C',
  },
  {
    id: 'pat-6',
    name: 'Emily Chen',
    dob: '1988-03-17',
    appointmentTime: getAppointmentTime(10, 30),
    provider: 'Dr. Lukner',
    status: 'scheduled',
  },
  {
    id: 'pat-7',
    name: 'Michael Brown',
    dob: '1972-09-08',
    appointmentTime: getAppointmentTime(11, 0),
    provider: 'Dr. Lukner',
    status: 'scheduled',
  },
  {
    id: 'pat-8',
    name: 'Jennifer Lopez',
    dob: '1980-12-22',
    appointmentTime: getAppointmentTime(11, 15),
    provider: 'Dr. Lukner',
    status: 'scheduled',
  }
];
