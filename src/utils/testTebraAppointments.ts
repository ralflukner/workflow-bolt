import { TebraSoapClient } from '../tebra-soap/tebraSoapClient';

export async function testTebraGetAppointments() {
  console.log('🔧 Testing Tebra getAppointments with correct date format...\n');

  // Initialize client with credentials from environment
  const client = new TebraSoapClient({
    username: import.meta.env.VITE_TEBRA_USERNAME || '',
    password: import.meta.env.VITE_TEBRA_PASSWORD || '',
    customerKey: import.meta.env.VITE_TEBRA_CUSTOMER_KEY || '',
    wsdlUrl: import.meta.env.VITE_TEBRA_WSDL_URL || 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl'
  });

  // Test with today's date in Tebra format
  const today = new Date();
  const fromDate = TebraSoapClient.formatDateForTebra(today);
  const toDate = TebraSoapClient.formatDateForTebra(today);
  
  console.log(`📅 Testing getAppointments for today`);
  console.log(`   From: ${fromDate}`);
  console.log(`   To: ${toDate}`);
  
  try {
    const appointments = await client.getAppointments(fromDate, toDate);
    console.log(`   ✅ Success! Found ${appointments.length} appointments`);
    
    if (appointments.length > 0) {
      console.log('\n   Today\'s appointments:');
      appointments.forEach((appt: any, index: number) => {
        console.log(`   ${index + 1}. Time: ${appt.AppointmentTime || appt.Time || 'N/A'} - Status: ${appt.Status || 'N/A'} - Patient ID: ${appt.PatientId || 'N/A'}`);
      });
    }
    
    return { success: true, appointments, fromDate, toDate };
  } catch (error: any) {
    console.error(`   ❌ Failed: ${error.message}`);
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
    return { success: false, error: error.message, fromDate, toDate };
  }
}

// Export to window for console testing
if (typeof window !== 'undefined') {
  (window as any).testTebraGetAppointments = testTebraGetAppointments;
}