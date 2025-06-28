#!/usr/bin/env ts-node

import { TebraSoapClient } from './src/tebra-soap/tebraSoapClient';

async function testGetAppointments() {
  console.log('🔧 Testing Tebra getAppointments with correct date format...\n');

  // Initialize client with credentials from environment
  const client = new TebraSoapClient({
    username: process.env.TEBRA_USERNAME ?? process.env.VITE_TEBRA_USERNAME ?? '',
    password: process.env.VITE_TEBRA_PASSWORD || '',
    customerKey: process.env.VITE_TEBRA_CUSTOMER_KEY || '',
    wsdlUrl: process.env.VITE_TEBRA_WSDL_URL || 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl'
  });

  // Test different date formats
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const testCases = [
    {
      name: 'Simple date format (YYYY-MM-DD)',
      fromDate: today.toISOString().split('T')[0],
      toDate: tomorrow.toISOString().split('T')[0]
    },
    {
      name: 'Tebra ISO format (YYYY-MM-DDThh:mm:ss:Z)',
      fromDate: TebraSoapClient.formatDateForTebra(today),
      toDate: TebraSoapClient.formatDateForTebra(tomorrow)
    },
    {
      name: 'Standard ISO format (YYYY-MM-DDThh:mm:ssZ)',
      fromDate: today.toISOString().replace(/\.\d{3}Z$/, 'Z'),
      toDate: tomorrow.toISOString().replace(/\.\d{3}Z$/, 'Z')
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📅 Testing: ${testCase.name}`);
    console.log(`   From: ${testCase.fromDate}`);
    console.log(`   To: ${testCase.toDate}`);
    
    try {
      const appointments = await client.getAppointments(testCase.fromDate, testCase.toDate);
      console.log(`   ✅ Success! Found ${appointments.length} appointments`);
      
      if (appointments.length > 0) {
        console.log('   Sample appointment:', {
          id: appointments[0].AppointmentId || appointments[0].Id,
          date: appointments[0].AppointmentDate || appointments[0].Date,
          time: appointments[0].AppointmentTime || appointments[0].Time,
          type: appointments[0].AppointmentType || appointments[0].Type,
          status: appointments[0].Status
        });
      }
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { data?: unknown } };
      console.error(`   ❌ Failed: ${err?.message ?? 'Unknown error'}`);
      if (err?.response?.data) {
        console.error('   Response:', err.response.data);
      }
    }
  }

  // Test with the specific date from the user's data (2025-06-16)
  console.log('\n📅 Testing with user\'s specific date (2025-06-16)');
  const userDate = new Date('2025-06-16');
  const userFromDate = TebraSoapClient.formatDateForTebra(userDate);
  const userToDate = TebraSoapClient.formatDateForTebra(userDate);
  
  console.log(`   From: ${userFromDate}`);
  console.log(`   To: ${userToDate}`);
  
  try {
    const appointments = await client.getAppointments(userFromDate, userToDate);
    console.log(`   ✅ Success! Found ${appointments.length} appointments`);
    
    if (appointments.length > 0) {
      console.log('\n   Appointments for 2025-06-16:');
      appointments.forEach((appt, index) => {
        console.log(`   ${index + 1}. ${appt.AppointmentTime || appt.Time} - ${appt.Status} - Patient ID: ${appt.PatientId}`);
      });
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error(`   ❌ Failed: ${err?.message ?? 'Unknown error'}`);
  }
}

// Run the test
testGetAppointments().catch(console.error);