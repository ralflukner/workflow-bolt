// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import tebraApi from '../services/tebraApi';

export async function testTebraGetAppointmentsViaFirebase() {
  console.log('🔧 Testing Tebra getAppointments via Firebase Functions...\n');

  // First test the connection
  console.log('1️⃣ Testing Tebra connection...');
  const connectionResult = await tebraApi.testConnection();
  console.log('Connection result:', connectionResult);
  
  if (!connectionResult.success) {
    console.error('❌ Connection failed. Cannot proceed with appointment test.');
    return;
  }

  // Test with today's date
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  console.log('\n2️⃣ Testing getAppointments for today...');
  console.log(`   Date range: ${today.toISOString()} to ${tomorrow.toISOString()}`);
  
  try {
    // Use the testAppointments method which should handle date formatting
    const result = await tebraApi.testAppointments();
    console.log('   Result:', result);
    
    if (result.success && result.data) {
      console.log(`   ✅ Success! Found ${result.data.count || 0} appointments`);
      console.log(`   Date range used: ${result.data.fromDate} to ${result.data.toDate}`);
      
      if (result.data.appointments && result.data.appointments.length > 0) {
        console.log('\n   Appointments:');
        result.data.appointments.forEach((appt: any, index: number) => {
          console.log(`   ${index + 1}. ${appt.StartTime || appt.AppointmentTime || 'N/A'} - ${appt.Status || 'N/A'} - Patient ID: ${appt.PatientId || 'N/A'}`);
        });
      }
    } else {
      console.error('   ❌ Failed:', result.message || 'Unknown error');
    }
  } catch (error: any) {
    console.error('   ❌ Error:', error.message || error);
  }
  
  // Also try the sync schedule function
  console.log('\n3️⃣ Testing sync today\'s schedule...');
  try {
    // Sync functionality not yet implemented in tebraApi
    // const syncResult = await tebraApi.syncTodaysSchedule();
    const syncResult = { success: false, message: 'Sync not yet implemented in PHP API' };
    console.log('   Sync result:', syncResult);
  } catch (error: any) {
    console.error('   ❌ Sync error:', error.message || error);
  }
}

// Export to window for console testing
if (typeof window !== 'undefined') {
  (window as any).testTebraViaFirebase = testTebraGetAppointmentsViaFirebase;
}