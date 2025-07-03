#!/usr/bin/env node

console.log('🚨 SYNC TODAY FAILURE ANALYSIS');
console.log('===================================');

async function debugSyncToday() {
  try {
    console.log('\n🔍 Importing tebraApi...');
    
    // Try to import the tebraApi
    const { default: tebraApi } = await import('./src/services/tebraFirebaseApi.js');
    console.log('✅ tebraApi imported successfully');
    
    // Log available methods
    console.log('\n📋 Available API methods:');
    Object.keys(tebraApi).forEach(method => {
      console.log(`  - ${method}`);
    });
    
    // Step 1: Test connection
    console.log('\n🔗 Step 1: Testing Tebra connection...');
    try {
      const connectionResult = await tebraApi.testConnection();
      console.log('Connection result:', JSON.stringify(connectionResult, null, 2));
      
      if (connectionResult?.success) {
        console.log('✅ Tebra connection OK');
      } else {
        console.log('❌ Tebra connection failed');
        console.log(`Error: ${connectionResult?.error}`);
      }
    } catch (error) {
      console.log('💥 Connection test crashed:', error.message);
    }

    // Step 2: Test health check
    console.log('\n🏥 Step 2: Testing health check...');
    try {
      const healthResult = await tebraApi.healthCheck();
      console.log('Health result:', JSON.stringify(healthResult, null, 2));
      
      if (healthResult?.success) {
        console.log('✅ Health check passed');
      } else {
        console.log('❌ Health check failed');
        console.log(`Error: ${healthResult?.error}`);
      }
    } catch (error) {
      console.log('💥 Health check crashed:', error.message);
    }

    // Step 3: Test sync today
    console.log('\n📅 Step 3: Testing Sync Today operation...');
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log(`Testing sync for date: ${today}`);
      
      const syncResult = await tebraApi.syncSchedule({ date: today });
      console.log('Sync result:', JSON.stringify(syncResult, null, 2));
      
      if (syncResult?.success) {
        console.log('✅ Sync Today operation successful');
      } else {
        console.log('❌ Sync Today operation failed');
        console.log(`Error: ${syncResult?.error}`);
      }
    } catch (error) {
      console.log('💥 Sync Today operation crashed:', error.message);
      console.error('Full error:', error);
    }

    // Step 4: Test appointments retrieval
    console.log('\n📋 Step 4: Testing appointments retrieval...');
    try {
      const today = new Date().toISOString().split('T')[0];
      const appointmentsResult = await tebraApi.getAppointments({ 
        fromDate: today, 
        toDate: today 
      });
      console.log('Appointments result:', JSON.stringify(appointmentsResult, null, 2));
      
      if (appointmentsResult?.success) {
        console.log('✅ Appointments retrieval successful');
      } else {
        console.log('❌ Appointments retrieval failed');
        console.log(`Error: ${appointmentsResult?.error}`);
      }
    } catch (error) {
      console.log('💥 Appointments retrieval crashed:', error.message);
    }

  } catch (importError) {
    console.log('💥 Failed to import tebraApi:', importError.message);
    console.log('\nThis indicates a fundamental module loading issue.');
    console.log('Checking if the file exists...');
    
    try {
      const fs = await import('fs');
      const path = './src/services/tebraFirebaseApi.js';
      if (fs.existsSync(path)) {
        console.log(`✅ File exists at ${path}`);
      } else {
        console.log(`❌ File not found at ${path}`);
        console.log('Checking for .ts file...');
        const tsPath = './src/services/tebraFirebaseApi.ts';
        if (fs.existsSync(tsPath)) {
          console.log(`✅ TypeScript file exists at ${tsPath}`);
          console.log('The module needs to be compiled to JavaScript first.');
        }
      }
    } catch (fsError) {
      console.log('Error checking file system:', fsError.message);
    }
  }
}

console.log('\n📊 DIAGNOSIS RESULTS');
console.log('=====================');

debugSyncToday().then(() => {
  console.log('\n✅ Diagnosis complete');
}).catch((error) => {
  console.log('\n💥 Diagnosis failed:', error.message);
  console.error('Full error:', error);
});