// Test script to verify check-in logic
const { tebraStatusToInternal } = require('./functions/src/tebra-sync/status-map');
const { toDashboardPatient } = require('./functions/src/tebra-sync/mappers');

// Test data
const testAppointments = [
  { Status: 'Scheduled', StartTime: '2025-01-16T09:00:00' },
  { Status: 'Confirmed', StartTime: '2025-01-16T10:00:00' },
  { Status: 'Arrived', StartTime: '2025-01-16T11:00:00' },
  { Status: 'Roomed', StartTime: '2025-01-16T12:00:00' },
  { Status: 'Ready for MD', StartTime: '2025-01-16T13:00:00' },
  { Status: 'With Doctor', StartTime: '2025-01-16T14:00:00' },
  { Status: 'Seen by MD', StartTime: '2025-01-16T15:00:00' },
  { Status: 'Checked Out', StartTime: '2025-01-16T16:00:00' },
];

const testPatient = {
  PatientId: '123',
  FirstName: 'John',
  LastName: 'Doe',
  DateOfBirth: '1980-01-01',
  Phone: '555-1234',
  Email: 'john@example.com'
};

const testProvider = {
  Title: 'Dr.',
  FirstName: 'Jane',
  LastName: 'Smith'
};

console.log('Testing check-in logic for different statuses:\n');

testAppointments.forEach(appointment => {
  const patient = toDashboardPatient(appointment, testPatient, testProvider);
  console.log(`Status: ${patient.status}`);
  console.log(`Appointment Time: ${patient.appointmentTime}`);
  console.log(`Check-in Time: ${patient.checkInTime || 'Not checked in'}`);
  console.log(`Should be checked in: ${patient.checkInTime ? 'YES' : 'NO'}`);
  console.log('---');
});