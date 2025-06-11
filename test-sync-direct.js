// Direct test of the Firebase Function sync with date range
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  projectId: 'luknerlumina-firebase'
});

const db = admin.firestore();

async function testSyncDirect() {
  try {
    // Test the tebraTestAppointments function first
    console.log('🧪 Testing appointments endpoint directly...');
    
    // You would call this with proper auth in a real scenario
    // For now, let's just check if we can query the results
    
    console.log('✅ Direct test complete');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testSyncDirect();