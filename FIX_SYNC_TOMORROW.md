# Fix Sync Tomorrow

The "Sync Tomorrow" button isn't working because the code is trying to call `syncTodaysSchedule` which isn't implemented in the PHP API.

## Quick Fix

In `src/components/TebraIntegrationNew.tsx`, replace the sync implementation (around line 265-267):

```typescript
// REPLACE THIS:
// TODO: Implement sync functionality in PHP API
// const result = await tebraApi.syncTodaysSchedule(dateToSync);
const result = { data: { success: false, message: 'Sync not yet implemented in PHP API' } };

// WITH THIS:
// Use getAppointments to fetch data
const fromDate = dateToSync;
const toDate = dateToSync; // Same day for single day sync

try {
  // 1. Get appointments for the date
  const appointmentsResult = await tebraApi.getAppointments({ fromDate, toDate });
  
  if (!appointmentsResult.data.success) {
    throw new Error(appointmentsResult.data.error || 'Failed to fetch appointments');
  }

  const appointments = appointmentsResult.data.data.appointments || [];
  
  // 2. Transform and save to Firebase
  const patients = appointments.map(apt => ({
    id: apt.AppointmentId,
    name: `${apt.PatientFirstName} ${apt.PatientLastName}`,
    firstName: apt.PatientFirstName,
    lastName: apt.PatientLastName,
    appointmentTime: apt.StartTime,
    appointmentType: apt.AppointmentType,
    status: 'scheduled',
    // Add other fields as needed
  }));

  // 3. Save to Firebase (this will encrypt automatically)
  if (patients.length > 0) {
    await updatePatients(patients); // This should trigger the PatientContext to save
  }

  const result = {
    success: true,
    patientCount: patients.length,
    message: patients.length > 0 
      ? `Imported ${patients.length} appointments` 
      : 'No appointments found for this date'
  };
} catch (error) {
  const result = {
    success: false,
    message: error.message || 'Sync failed'
  };
}
```

## Why Tomorrow Might Be Empty

If your clinic is closed tomorrow (Friday), Tebra will return 0 appointments, which is correct behavior. The sync will work but find no data to import.

## Test With a Different Date

To test if sync is working, try syncing a date you know has appointments (like next Monday).
