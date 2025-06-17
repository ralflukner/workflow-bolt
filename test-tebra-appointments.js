const { TebraSoapClient } = require('./src/tebra-soap/tebraSoapClient'); // or trigger a build before running
require('dotenv').config();

async function testGetAppointments() {
  console.log('🔧 Testing Tebra getAppointments with correct date format...\n');
const client = new TebraSoapClient({
  username: process.env.VITE_TEBRA_USERNAME ?? '',
  password: process.env.VITE_TEBRA_PASSWORD ?? '',
  customerKey: process.env.VITE_TEBRA_CUSTOMER_KEY ?? '',
  wsdlUrl:
    process.env.VITE_TEBRA_WSDL_URL ||
    'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl',
});

if (!client.config.username || !client.config.password || !client.config.customerKey) {
  throw new Error('Missing Tebra credentials: VITE_TEBRA_USERNAME / PASSWORD / CUSTOMER_KEY');
}

  // Test with today's date
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
      appointments.forEach((appt, index) => {
        console.log(`   ${index + 1}. ${appt.AppointmentTime || appt.Time} - ${appt.Status} - Patient ID: ${appt.PatientId}`);
      });
    }
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
  }
}

// Run the test
testGetAppointments().catch(console.error);