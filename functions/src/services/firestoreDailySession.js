const admin = require('firebase-admin');

const firestoreDailySessionRepo = {
  async save(date, patients, uid) {
    const db = admin.firestore();
    let batch = db.batch();
    const root = db.collection('daily_sessions').doc(date);
    
    // Store metadata and patients array (for backward compatibility)
    batch.set(root, { 
      date, 
      patients,
      lastSync: admin.firestore.FieldValue.serverTimestamp(), 
      syncedBy: uid 
    }, { merge: true });
    
    // Also store each patient in subcollection (for scalability)
    let ops = 1; // Start with 1 for the root document
    for (const p of patients) {
      batch.set(root.collection('patients').doc(p.id), p, { merge: true });
      if (++ops === 500) {  // Firestore batch limit
        await batch.commit();
        batch = db.batch(); // Create new batch
        ops = 0;
      }
    }
    
    // Commit remaining operations
    if (ops > 0) {
      await batch.commit();
    }
  },
};

module.exports = { firestoreDailySessionRepo };