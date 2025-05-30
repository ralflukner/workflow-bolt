import { 
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  Timestamp,
  writeBatch,
  orderBy
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Patient } from '../../types';
import { StorageService, SessionStats } from '../storageService'; // Import shared interface

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

export class DailySessionService implements StorageService {
  
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
      // Sanitize patient data for storage (remove sensitive fields if needed)
      const sanitizedPatients = patients.map(patient => ({
        ...patient,
        // Remove any fields that shouldn't be persisted
        // Add encryption here if required
      }));

const sessionData: Partial<DailySession> = {
  id: sessionId,
  date: sessionId,
  patients: sanitizedPatients,
  // Preserve original createdAt if it exists
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: now,
  version: FieldValue.increment(1),
};

      const docRef = doc(db, COLLECTION_NAME, sessionId);
      await setDoc(docRef, sessionData, { merge: true });
      
      console.log(`Firebase session saved for ${sessionId}`);
      
      // Automatically purge old data after saving
      await this.purgeOldSessions();
      
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
      const docSnap = await getDocs(collection(db, COLLECTION_NAME));
      
      const todayDoc = docSnap.docs.find(doc => doc.id === sessionId);
      
      if (todayDoc && todayDoc.exists()) {
        const sessionData = todayDoc.data() as DailySession;
        console.log(`Firebase session loaded for ${sessionId}`);
        return sessionData.patients || [];
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
        collection(db, COLLECTION_NAME),
        where('date', '<', cutoffId),
        orderBy('date')
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('No old Firebase sessions to purge');
        return;
      }

      // Use batch for efficient deletion
      const batch = writeBatch(db);
      let deleteCount = 0;

      querySnapshot.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
        deleteCount++;
      });

      await batch.commit();
      console.log(`Purged ${deleteCount} old Firebase sessions`);
      
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
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      
      if (querySnapshot.empty) {
        console.log('No Firebase sessions to purge');
        return;
      }

      const batch = writeBatch(db);
      let deleteCount = 0;

      querySnapshot.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
        deleteCount++;
      });

      await batch.commit();
      console.log(`Force purged ${deleteCount} Firebase sessions`);
      
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
        query(collection(db, COLLECTION_NAME), orderBy('date', 'desc'))
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
}

// Export singleton instance
export const dailySessionService = new DailySessionService(); 