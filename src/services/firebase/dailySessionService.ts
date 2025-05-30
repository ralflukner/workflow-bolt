import { 
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  Timestamp,
  writeBatch,
  orderBy,
  serverTimestamp,
  increment,
  Firestore
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Patient } from '../../types';
import { StorageService, SessionStats } from '../storageService'; // Import shared interface
import { PatientEncryptionService } from '../encryption/patientEncryptionService';

export interface DailySession {
  id: string; // Format: YYYY-MM-DD
  date: string; // ISO date string
  patients: Patient[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number; // For conflict resolution
}

const COLLECTION_NAME = 'daily_sessions';
const MAX_RETENTION_DAYS = 1; // Only keep current day for HIPAA compliance
const FIRESTORE_BATCH_LIMIT = 500; // Firestore's maximum batch size

export class DailySessionService implements StorageService {
  
  /**
   * Get the Firestore database instance
   * @throws Error if Firebase is not configured
   */
  private getDb(): Firestore {
    if (!db) {
      throw new Error('Firebase is not configured. Please check your Firebase configuration.');
    }
    return db;
  }
  
  /**
   * Get today's date in YYYY-MM-DD format
   */
  private getTodayId(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Get session ID for a specific date
   */
  private getSessionId(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Save today's patient session data
   */
  async saveTodaysSession(patients: Patient[]): Promise<void> {
    const sessionId = this.getTodayId();
    const now = Timestamp.now();
    
    try {
      // Encrypt sensitive patient data for HIPAA compliance
      const sanitizedPatients = patients.map(patient => {
        try {
          return PatientEncryptionService.encryptPatient(patient);
        } catch (error) {
          console.error('Error encrypting patient data:', error);
          return patient;
        }
      });

      const sessionData = {
        id: sessionId,
        date: sessionId,
        patients: sanitizedPatients,
        // Use server timestamp for created time if this is a new document
        createdAt: serverTimestamp(),
        updatedAt: now,
        version: increment(1),
      };

      const docRef = doc(this.getDb(), COLLECTION_NAME, sessionId);
      await setDoc(docRef, sessionData, { merge: true });
      
      console.log(`Firebase session saved for ${sessionId}`);
      
      // Automatically purge old data after saving - don't let purge errors affect save success
      setTimeout(async () => {
        try {
          await this.purgeOldSessions();
        } catch (purgeError) {
          console.warn('Failed to purge old sessions after save:', purgeError);
          // Log but don't throw - the save operation was successful
        }
      }, 0);
      
    } catch (error) {
      console.error('Error saving Firebase session:', error);
      throw new Error('Failed to save Firebase session');
    }
  }

  /**
   * Load today's patient session data
   */
  async loadTodaysSession(): Promise<Patient[]> {
    const sessionId = this.getTodayId();
    
    try {
      const todayRef = doc(this.getDb(), COLLECTION_NAME, sessionId);
      const todayDoc = await getDoc(todayRef);
      
      if (todayDoc.exists()) {
        const sessionData = todayDoc.data() as DailySession;
        console.log(`Firebase session loaded for ${sessionId}`);
        
        try {
          const decryptedPatients = sessionData.patients?.map(patient => 
            PatientEncryptionService.decryptPatient(patient)
          ) || [];
          return decryptedPatients;
        } catch (error) {
          console.error('Error decrypting patient data:', error);
          return sessionData.patients || [];
        }
      }
      
      console.log(`No Firebase session found for ${sessionId}`);
      return [];
      
    } catch (error) {
      console.error('Error loading Firebase session:', error);
      throw new Error('Failed to load Firebase session');
    }
  }

  /**
   * Purge all sessions older than MAX_RETENTION_DAYS for HIPAA compliance
   */
  async purgeOldSessions(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - MAX_RETENTION_DAYS);
      const cutoffId = this.getSessionId(cutoffDate);

      const q = query(
        collection(this.getDb(), COLLECTION_NAME),
        where('date', '<', cutoffId),
        orderBy('date')
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('No old Firebase sessions to purge');
        return;
      }

      // Chunk deletions to respect Firestore's 500 operation limit
      const docs = querySnapshot.docs;
      let totalDeleteCount = 0;

      for (let i = 0; i < docs.length; i += FIRESTORE_BATCH_LIMIT) {
        const batch = writeBatch(this.getDb());
        const chunk = docs.slice(i, i + FIRESTORE_BATCH_LIMIT);
        
        chunk.forEach((docSnapshot) => {
          batch.delete(docSnapshot.ref);
        });

        await batch.commit();
        totalDeleteCount += chunk.length;
        
        console.log(`Purged batch of ${chunk.length} sessions (${totalDeleteCount}/${docs.length} total)`);
      }

      console.log(`Purged ${totalDeleteCount} old Firebase sessions`);
      
    } catch (error) {
      console.error('Error purging old Firebase sessions:', error);
      throw new Error('Failed to purge old Firebase sessions');
    }
  }

  /**
   * Force purge all sessions (for testing or emergency cleanup)
   */
  async purgeAllSessions(): Promise<void> {
    try {
      const querySnapshot = await getDocs(collection(this.getDb(), COLLECTION_NAME));
      
      if (querySnapshot.empty) {
        console.log('No Firebase sessions to purge');
        return;
      }

      // Chunk deletions to respect Firestore's 500 operation limit
      const docs = querySnapshot.docs;
      let totalDeleteCount = 0;

      for (let i = 0; i < docs.length; i += FIRESTORE_BATCH_LIMIT) {
        const batch = writeBatch(this.getDb());
        const chunk = docs.slice(i, i + FIRESTORE_BATCH_LIMIT);
        
        chunk.forEach((docSnapshot) => {
          batch.delete(docSnapshot.ref);
        });

        await batch.commit();
        totalDeleteCount += chunk.length;
        
        console.log(`Force purged batch of ${chunk.length} sessions (${totalDeleteCount}/${docs.length} total)`);
      }

      console.log(`Force purged ${totalDeleteCount} Firebase sessions`);
      
    } catch (error) {
      console.error('Error force purging Firebase sessions:', error);
      throw new Error('Failed to force purge Firebase sessions');
    }
  }

  /**
   * Get list of all session dates (for admin purposes)
   */
  async getSessionDates(): Promise<string[]> {
    try {
      const querySnapshot = await getDocs(
        query(collection(this.getDb(), COLLECTION_NAME), orderBy('date', 'desc'))
      );
      
      return querySnapshot.docs.map(doc => doc.data().date);
      
    } catch (error) {
      console.error('Error getting Firebase session dates:', error);
      throw new Error('Failed to get Firebase session dates');
    }
  }

  /**
   * Check if today's session exists
   */
  async hasTodaysSession(): Promise<boolean> {
    try {
      const sessions = await this.getSessionDates();
      return sessions.includes(this.getTodayId());
    } catch (error) {
      console.error('Error checking today\'s Firebase session:', error);
      return false;
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<SessionStats> {
    try {
      const dates = await this.getSessionDates();
      const currentDate = this.getTodayId();
      
      return {
        backend: 'firebase',
        currentSessionDate: currentDate,
        hasCurrentSession: dates.includes(currentDate),
        totalSessions: dates.length,
        oldestSession: dates.length > 0 ? dates[dates.length - 1] : undefined
      };
      
    } catch (error) {
      console.error('Error getting Firebase session stats:', error);
      throw new Error('Failed to get Firebase session stats');
    }
  }

  /**
   * Clear current session (optional method for StorageService interface)
   */
  async clearSession(): Promise<void> {
    const sessionId = this.getTodayId();
    
    try {
      const docRef = doc(this.getDb(), COLLECTION_NAME, sessionId);
      await setDoc(docRef, { patients: [] }, { merge: true });
      
      console.log(`Firebase session cleared for ${sessionId}`);
    } catch (error) {
      console.error('Error clearing Firebase session:', error);
      throw new Error('Failed to clear Firebase session');
    }
  }
}

// Export singleton instance
export const dailySessionService = new DailySessionService();          