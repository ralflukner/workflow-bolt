import * as admin from 'firebase-admin';
if (!admin.apps.length) admin.initializeApp();
import { DashboardPatient } from '../tebra-sync/mappers';

export interface DailySessionRepo {
  save(date: string, patients: DashboardPatient[], uid: string): Promise<void>;
}

export const firestoreDailySessionRepo: DailySessionRepo = {
  async save(date, patients, uid) {
    const db = admin.firestore();
    const batch = db.batch();
    const root = db.collection('daily_sessions').doc(date);

    // Store metadata and patients array (for backward compatibility)
    batch.set(root, { 
      date, 
      patients,
      lastSync: admin.firestore.FieldValue.serverTimestamp(), 
      syncedBy: uid 
    }, { merge: true });

    // Also store each patient in subcollection (for scalability)
 let ops = 0;
 for (const p of patients) {
   batch.set(root.collection('patients').doc(p.id), p, { merge: true });
   if (++ops === 499) {  // 499 + root = 500
     await batch.commit();
     ops = 0;
   }
 }
 if (ops) await batch.commit();
    await batch.commit();
  },
}; 
