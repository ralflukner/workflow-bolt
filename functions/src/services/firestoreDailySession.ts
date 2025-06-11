import * as admin from 'firebase-admin';
import { DashboardPatient } from '../tebra-sync/mappers';

export interface DailySessionRepo {
  save(date: string, patients: DashboardPatient[], uid: string): Promise<void>;
}

export const firestoreDailySessionRepo: DailySessionRepo = {
  async save(date, patients, uid) {
    const db = admin.firestore();
    const batch = db.batch();
    const root = db.collection('daily_sessions').doc(date);
    batch.set(root, { date, lastSync: admin.firestore.FieldValue.serverTimestamp(), syncedBy: uid }, { merge: true });
    patients.forEach((p) => {
      batch.set(root.collection('patients').doc(p.id), p, { merge: true });
    });
    await batch.commit();
  },
}; 