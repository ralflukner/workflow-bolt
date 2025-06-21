#!/usr/bin/env node

/**
 * Script to clear old encrypted patient data from Firebase
 * WARNING: This will delete all session data - use with caution!
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const readline = require('readline');

// Initialize Firebase Admin
const app = initializeApp({
  projectId: 'luknerlumina-firebase',
});

const db = getFirestore(app);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function clearSessionData() {
  console.log('\n⚠️  WARNING: This will delete ALL session data from Firebase!');
  console.log('This includes all patient records stored in the sessions collection.');
  
  rl.question('\nAre you sure you want to continue? (yes/no): ', async (answer) => {
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled.');
      rl.close();
      process.exit(0);
    }

    try {
      console.log('\n🔍 Fetching all sessions...');
      const sessionsRef = db.collection('sessions');
      const snapshot = await sessionsRef.get();
      
      if (snapshot.empty) {
        console.log('✅ No sessions found. Collection is already empty.');
        rl.close();
        process.exit(0);
      }

      console.log(`\n📊 Found ${snapshot.size} sessions to delete.`);
      
      // Delete in batches for better performance
      const batch = db.batch();
      let count = 0;
      
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
        count++;
        
        // Firestore batch limit is 500
        if (count % 500 === 0) {
          console.log(`  Processing batch ${Math.floor(count / 500)}...`);
        }
      });
      
      console.log('\n🗑️  Deleting all sessions...');
      await batch.commit();
      
      console.log(`\n✅ Successfully deleted ${count} sessions.`);
      console.log('🔄 The application will create new sessions with proper encryption on next use.');
      
    } catch (error) {
      console.error('\n❌ Error clearing session data:', error);
    } finally {
      rl.close();
      process.exit(0);
    }
  });
}

// Run the script
console.log('🧹 Firebase Session Data Cleaner');
console.log('================================');
clearSessionData();