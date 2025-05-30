import { Patient } from '../types';

export interface SessionStats {
  currentSessionDate: string;
  hasCurrentSession: boolean;
  patientCount?: number; // Optional for Firebase
  totalSessions?: number; // Optional for LocalStorage
  lastUpdated?: string; // Optional for Firebase
  oldestSession?: string; // Optional for LocalStorage
  backend: 'firebase' | 'local';
}

export interface StorageService {
  loadTodaysSession(): Promise<Patient[]>;
  saveTodaysSession(patients: Patient[]): Promise<void> | void;
  getSessionStats(): Promise<SessionStats>;
  clearSession?(): Promise<void>; // Optional method
} 