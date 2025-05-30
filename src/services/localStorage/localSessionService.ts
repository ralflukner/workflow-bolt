import { Patient } from '../../types';
import { StorageService, SessionStats } from '../storageService'; // Import shared interface

export interface LocalSession {
  id: string; // Format: YYYY-MM-DD
  date: string; // ISO date string
  patients: Patient[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

const STORAGE_KEY = 'daily_session';

export class LocalSessionService implements StorageService {
  
  /**
   * Get today's date in YYYY-MM-DD format
   */
  private getTodayId(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Save today's patient session data to localStorage
   */
  saveTodaysSession(patients: Patient[]): Promise<void> {
    const sessionId = this.getTodayId();
    const now = new Date().toISOString();
    
    try {
      const sessionData: LocalSession = {
        id: sessionId,
        date: sessionId,
        patients: patients,
        createdAt: now,
        updatedAt: now,
        version: 1
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
      console.log(`Local session saved for ${sessionId}`);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error saving local session:', error);
      return Promise.reject(new Error('Failed to save local session'));
    }
  }

  /**
   * Load today's patient session data from localStorage
   */
  async loadTodaysSession(): Promise<Patient[]> {
    const sessionId = this.getTodayId();
    
    try {
      const sessionData = localStorage.getItem(STORAGE_KEY);
      
      if (sessionData) {
        const session = JSON.parse(sessionData) as LocalSession;
        
        // Check if it's today's session
        if (session.date === sessionId) {
          console.log(`Local session loaded for ${sessionId}`);
          return session.patients || [];
        } else {
          console.log(`Found old session (${session.date}), clearing for new day`);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      
      console.log(`No local session found for ${sessionId}`);
      return [];
      
    } catch (error) {
      console.error('Error loading local session:', error);
      localStorage.removeItem(STORAGE_KEY); // Clear corrupted data
      return [];
    }
  }

  /**
   * Clear all local session data
   */
  async clearSession(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('Local session cleared');
    } catch (error) {
      console.error('Error clearing local session:', error);
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<SessionStats> {
    try {
      const sessionData = localStorage.getItem(STORAGE_KEY);
      const currentDate = this.getTodayId();
      
      if (sessionData) {
        const session = JSON.parse(sessionData) as LocalSession;
        return {
          backend: 'local',
          currentSessionDate: currentDate,
          hasCurrentSession: session.date === currentDate,
          patientCount: session.date === currentDate ? session.patients.length : 0,
          lastUpdated: session.date === currentDate ? session.updatedAt : undefined
        };
      }
      
      return {
        backend: 'local',
        currentSessionDate: currentDate,
        hasCurrentSession: false,
        patientCount: 0
      };
      
    } catch (error) {
      console.error('Error getting local session stats:', error);
      return {
        backend: 'local',
        currentSessionDate: this.getTodayId(),
        hasCurrentSession: false,
        patientCount: 0
      };
    }
  }
}

// Export singleton instance
export const localSessionService = new LocalSessionService(); 