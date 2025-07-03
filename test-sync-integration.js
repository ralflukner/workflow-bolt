#!/usr/bin/env node

/**
 * Comprehensive Integration Test for Sync Today and Sync Tomorrow
 * Tests the full sync pipeline to verify functionality
 */

const { syncSchedule } = require('./functions/src/tebra-sync/syncSchedule');

console.log('🧪 Starting Sync Today/Tomorrow Integration Tests');
console.log('==================================================');

// Mock dependencies for testing
const createMockDeps = () => ({
  tebra: {
    getAppointments: async (startDate, endDate) => {
      console.log(`📅 Mock: Getting appointments for ${startDate} to ${endDate}`);
      
      // Simulate realistic appointment data
      const appointments = [];
      const date = new Date(startDate);
      
      // Add test appointments for today
      if (startDate === getTodayDate()) {
        appointments.push(
          {
            ID: 'appt-today-1',
            PatientId: 'patient-1',
            ProviderId: 'provider-1',
            AppointmentTypeId: 'routine-checkup',
            AppointmentType: 'Routine Checkup',
            StartTime: `${startDate}T09:00:00`,
            EndTime: `${startDate}T09:30:00`,
            Status: 'Confirmed',
          },
          {
            ID: 'appt-today-2',
            PatientId: 'patient-2',
            ProviderId: 'provider-1',
            AppointmentTypeId: 'follow-up',
            AppointmentType: 'Follow-up',
            StartTime: `${startDate}T10:00:00`,
            EndTime: `${startDate}T10:15:00`,
            Status: 'CheckedIn',
          }
        );
      }
      
      // Add test appointments for tomorrow
      if (startDate === getTomorrowDate()) {
        appointments.push(
          {
            ID: 'appt-tomorrow-1',
            PatientId: 'patient-3',
            ProviderId: 'provider-2',
            AppointmentTypeId: 'consultation',
            AppointmentType: 'Consultation',
            StartTime: `${startDate}T14:00:00`,
            EndTime: `${startDate}T14:45:00`,
            Status: 'Confirmed',
          }
        );
      }
      
      console.log(`✅ Mock: Found ${appointments.length} appointments`);
      return appointments;
    },
    
    getPatientById: async (patientId) => {
      console.log(`👤 Mock: Getting patient ${patientId}`);
      
      const patients = {
        'patient-1': {
          ID: 'patient-1',
          PatientId: 'patient-1',
          PatientNumber: 'P001',
          FirstName: 'John',
          LastName: 'Doe',
          DateOfBirth: '1980-05-15',
          Gender: 'M',
          HomePhone: '555-0123',
          Email: 'john.doe@email.com',
        },
        'patient-2': {
          ID: 'patient-2',
          PatientId: 'patient-2',
          PatientNumber: 'P002',
          FirstName: 'Jane',
          LastName: 'Smith',
          DateOfBirth: '1975-08-20',
          Gender: 'F',
          MobilePhone: '555-0124',
          Email: 'jane.smith@email.com',
        },
        'patient-3': {
          ID: 'patient-3',
          PatientId: 'patient-3',
          PatientNumber: 'P003',
          FirstName: 'Alice',
          LastName: 'Johnson',
          DateOfBirth: '1990-01-01',
          Gender: 'F',
          HomePhone: '555-0125',
          Email: 'alice.johnson@email.com',
        },
      };
      
      return patients[patientId] || null;
    },
    
    getProviders: async () => {
      console.log('👨‍⚕️ Mock: Getting providers');
      return [
        {
          ID: 'provider-1',
          ProviderId: 'provider-1',
          FirstName: 'Sarah',
          LastName: 'Johnson',
          Title: 'Dr.',
          Degree: 'MD',
        },
        {
          ID: 'provider-2',
          ProviderId: 'provider-2',
          FirstName: 'Michael',
          LastName: 'Brown',
          Title: 'Dr.',
          Degree: 'OD',
        },
      ];
    },
  },
  
  repo: {
    save: async (date, patients, userId) => {
      console.log(`💾 Mock: Saving ${patients.length} patients for ${date} by ${userId}`);
      
      // Log patient details for verification
      patients.forEach((patient, index) => {
        console.log(`   ${index + 1}. ${patient.name} - ${patient.status} - ${patient.appointmentType}`);
      });
      
      return Promise.resolve();
    },
  },
  
  logger: {
    info: (msg, data) => console.log(`ℹ️  ${msg}`, data ? JSON.stringify(data, null, 2) : ''),
    warn: (msg, data) => console.log(`⚠️  ${msg}`, data ? JSON.stringify(data, null, 2) : ''),
    error: (msg, data) => console.log(`❌ ${msg}`, data ? JSON.stringify(data, null, 2) : ''),
    debug: (msg, data) => console.log(`🔍 ${msg}`, data ? JSON.stringify(data, null, 2) : ''),
  },
  
  now: () => new Date(),
  timezone: 'America/Chicago',
});

// Helper functions
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

// Test scenarios
async function testSyncToday() {
  console.log('\n🧪 TEST 1: Sync Today\'s Schedule');
  console.log('================================');
  
  try {
    const deps = createMockDeps();
    const today = getTodayDate();
    
    console.log(`📅 Testing sync for today: ${today}`);
    const result = await syncSchedule(deps, today, 'integration-test-user');
    
    console.log(`✅ Sync Today completed successfully! Imported ${result} appointments`);
    
    if (result >= 2) {
      console.log('✅ Expected number of today appointments found');
      return true;
    } else {
      console.log(`⚠️  Expected 2+ appointments, got ${result}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Sync Today failed:`, error.message);
    return false;
  }
}

async function testSyncTomorrow() {
  console.log('\n🧪 TEST 2: Sync Tomorrow\'s Schedule');
  console.log('===================================');
  
  try {
    const deps = createMockDeps();
    const tomorrow = getTomorrowDate();
    
    console.log(`📅 Testing sync for tomorrow: ${tomorrow}`);
    const result = await syncSchedule(deps, tomorrow, 'integration-test-user');
    
    console.log(`✅ Sync Tomorrow completed successfully! Imported ${result} appointments`);
    
    if (result >= 1) {
      console.log('✅ Expected number of tomorrow appointments found');
      return true;
    } else {
      console.log(`⚠️  Expected 1+ appointments, got ${result}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Sync Tomorrow failed:`, error.message);
    return false;
  }
}

async function testSyncDefaultToday() {
  console.log('\n🧪 TEST 3: Sync Default (Should be Today)');
  console.log('==========================================');
  
  try {
    const deps = createMockDeps();
    
    console.log('📅 Testing sync with no date parameter (defaults to today)');
    const result = await syncSchedule(deps, undefined, 'integration-test-user');
    
    console.log(`✅ Default sync completed successfully! Imported ${result} appointments`);
    
    if (result >= 2) {
      console.log('✅ Default sync correctly synced today\'s appointments');
      return true;
    } else {
      console.log(`⚠️  Expected 2+ appointments for today, got ${result}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Default sync failed:`, error.message);
    return false;
  }
}

async function testStatusMapping() {
  console.log('\n🧪 TEST 4: Status Mapping Verification');
  console.log('======================================');
  
  const statusMappings = [
    { tebraStatus: 'Confirmed', expectedStatus: 'scheduled' },
    { tebraStatus: 'CheckedIn', expectedStatus: 'arrived' },
    { tebraStatus: 'InRoom', expectedStatus: 'appt-prep' },
    { tebraStatus: 'CheckedOut', expectedStatus: 'completed' },
    { tebraStatus: 'Cancelled', expectedStatus: 'cancelled' },
  ];
  
  let allMappingsCorrect = true;
  
  for (const { tebraStatus, expectedStatus } of statusMappings) {
    try {
      const deps = createMockDeps();
      
      // Override the appointments mock for this test
      deps.tebra.getAppointments = async () => [{
        ID: 'test-appt',
        PatientId: 'patient-1',
        Status: tebraStatus,
        StartTime: `${getTodayDate()}T10:00:00`,
      }];
      
      let capturedStatus = null;
      deps.repo.save = async (date, patients) => {
        capturedStatus = patients[0]?.status;
      };
      
      await syncSchedule(deps, getTodayDate(), 'test-user');
      
      if (capturedStatus === expectedStatus) {
        console.log(`✅ ${tebraStatus} → ${expectedStatus} ✓`);
      } else {
        console.log(`❌ ${tebraStatus} → ${capturedStatus} (expected ${expectedStatus})`);
        allMappingsCorrect = false;
      }
    } catch (error) {
      console.log(`❌ Status mapping test failed for ${tebraStatus}:`, error.message);
      allMappingsCorrect = false;
    }
  }
  
  return allMappingsCorrect;
}

// Main test runner
async function runIntegrationTests() {
  console.log('🚀 Starting Sync Today/Tomorrow Integration Tests');
  console.log(`📅 Today: ${getTodayDate()}`);
  console.log(`📅 Tomorrow: ${getTomorrowDate()}`);
  
  const results = {
    syncToday: false,
    syncTomorrow: false,
    syncDefault: false,
    statusMapping: false,
  };
  
  try {
    results.syncToday = await testSyncToday();
    results.syncTomorrow = await testSyncTomorrow();
    results.syncDefault = await testSyncDefaultToday();
    results.statusMapping = await testStatusMapping();
    
    console.log('\n📊 INTEGRATION TEST RESULTS');
    console.log('============================');
    console.log(`Sync Today:       ${results.syncToday ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Sync Tomorrow:    ${results.syncTomorrow ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Sync Default:     ${results.syncDefault ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Status Mapping:   ${results.statusMapping ? '✅ PASS' : '❌ FAIL'}`);
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    
    console.log(`\n🎯 OVERALL RESULT: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL INTEGRATION TESTS PASSED!');
      console.log('✅ Sync Today and Sync Tomorrow functionality is working correctly');
      return true;
    } else {
      console.log('❌ Some integration tests failed. See details above.');
      return false;
    }
    
  } catch (error) {
    console.log('💥 Integration test runner failed:', error.message);
    console.log(error.stack);
    return false;
  }
}

// Run the tests
runIntegrationTests()
  .then(success => {
    console.log('\n' + '='.repeat(60));
    if (success) {
      console.log('✅ Integration tests completed successfully!');
      process.exit(0);
    } else {
      console.log('❌ Integration tests failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.log('💥 Unexpected error:', error);
    process.exit(1);
  });