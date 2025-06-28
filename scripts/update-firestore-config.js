// Script to update Firestore configuration for Tebra PHP API
// Run with: node scripts/update-firestore-config.js

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize admin SDK
const app = initializeApp({
  projectId: 'luknerlumina-firebase'
});

const db = getFirestore(app);

async function updateConfig() {
  try {
    const configRef = db.collection('config').doc('app');
    
    const config = {
      useTebraPhpApi: true,
      tebraPhpApiUrl: 'https://us-central1-luknerlumina-firebase.cloudfunctions.net/api/api/tebra',
      updatedAt: FieldValue.serverTimestamp()
    };
    
    await configRef.set(config, { merge: true });
    
    console.log('✅ Firestore configuration updated successfully!');
    console.log('Configuration:', config);
    
    // Verify the update
    const doc = await configRef.get();
    console.log('\n📋 Current configuration:', doc.data());
    
  } catch (error) {
    console.error('❌ Error updating configuration:', error);
  } finally {
    process.exit();
  }
}

updateConfig();