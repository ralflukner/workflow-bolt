/**
 * Browser Console Script to Clear Encrypted Session Data
 * 
 * Instructions:
 * 1. Open your application in the browser
 * 2. Open Developer Tools (F12)
 * 3. Go to the Console tab
 * 4. Copy and paste this entire script
 * 5. Press Enter to run
 * 6. Type 'yes' when prompted to confirm
 */

async function clearEncryptedSessions() {
  console.log('🧹 Preparing to clear encrypted session data...\n');
  console.warn('⚠️  WARNING: This will delete ALL patient session data!');
  console.warn('This action cannot be undone.\n');
  
  const confirmation = prompt('Type "yes" to confirm deletion of all session data:');
  
  if (confirmation !== 'yes') {
    console.log('❌ Operation cancelled.');
    return;
  }

  try {
    // Import Firestore functions
    const { getFirestore, collection, getDocs, deleteDoc, writeBatch } = await import('firebase/firestore');
    const db = getFirestore();
    
    console.log('🔍 Fetching all sessions...');
    const sessionsRef = collection(db, 'sessions');
    const snapshot = await getDocs(sessionsRef);
    
    if (snapshot.empty) {
      console.log('✅ No sessions found. Collection is already empty.');
      return;
    }

    console.log(`📊 Found ${snapshot.size} sessions to delete.`);
    
    // Delete in batches
    const batchSize = 500; // Firestore batch limit
    const batches = [];
    let batch = writeBatch(db);
    let count = 0;
    
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
      
      if (count % batchSize === 0) {
        batches.push(batch);
        batch = writeBatch(db);
      }
    });
    
    // Add the last batch if it has any operations
    if (count % batchSize !== 0) {
      batches.push(batch);
    }
    
    console.log(`🗑️  Deleting ${count} sessions in ${batches.length} batch(es)...`);
    
    // Execute all batches
    for (let i = 0; i < batches.length; i++) {
      await batches[i].commit();
      console.log(`  ✓ Batch ${i + 1}/${batches.length} completed`);
    }
    
    console.log('\n✅ Successfully deleted all session data!');
    console.log('🔄 The application will create new sessions with proper encryption.');
    console.log('📝 Please refresh the page to start fresh.');
    
    // Also clear localStorage to ensure clean state
    if (confirm('Also clear localStorage data? (Recommended)')) {
      localStorage.clear();
      console.log('✅ localStorage cleared.');
    }
    
  } catch (error) {
    console.error('❌ Error clearing session data:', error);
    console.error('Details:', error.message);
  }
}

// Run the function
clearEncryptedSessions();