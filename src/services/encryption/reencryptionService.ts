/**
 * Re-encryption Service for Key Rotation
 * Handles bulk re-encryption of patient data when encryption keys are rotated
 */

import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  writeBatch,
  addDoc,
  // Timestamp, // Not used
  query,
  where,
  orderBy,
  limit as firestoreLimit
} from 'firebase/firestore';
import { enhancedEncryptionService } from './enhancedPatientEncryptionService';
import { EncryptedField, EncryptedSession, EncryptionMigrationLog } from '../../types/encryption';

export interface ReencryptionProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  errors: Array<{ sessionId: string; error: string }>;
}

export interface ReencryptionOptions {
  batchSize?: number;
  dryRun?: boolean;
  onProgress?: (progress: ReencryptionProgress) => void;
  sessionsToProcess?: string[]; // Specific session IDs to process
  dateRange?: {
    start: Date;
    end: Date;
  };
}

class ReencryptionService {
  private static instance: ReencryptionService;
  private db = getFirestore();

  private constructor() {}

  public static getInstance(): ReencryptionService {
    if (!ReencryptionService.instance) {
      ReencryptionService.instance = new ReencryptionService();
    }
    return ReencryptionService.instance;
  }

  /**
   * Re-encrypt all patient sessions with the current encryption key
   */
  public async reencryptAllSessions(options: ReencryptionOptions = {}): Promise<ReencryptionProgress> {
    const {
      batchSize = 50,
      dryRun = false,
      onProgress,
      sessionsToProcess,
      dateRange
    } = options;

    const progress: ReencryptionProgress = {
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    };

    try {
      // Build query
      let sessionsQuery = collection(this.db, 'sessions');
      
      if (dateRange) {
        sessionsQuery = query(
          sessionsQuery,
          where('date', '>=', dateRange.start.toISOString().split('T')[0]),
          where('date', '<=', dateRange.end.toISOString().split('T')[0])
        ) as any;
      }

      const snapshot = await getDocs(sessionsQuery);
      progress.total = snapshot.size;

      console.log(`Found ${progress.total} sessions to process`);

      // Process in batches
      const docs = snapshot.docs;
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = docs.slice(i, i + batchSize);
        await this.processBatch(batch, progress, dryRun, sessionsToProcess);
        
        if (onProgress) {
          onProgress({ ...progress });
        }
      }

      // Log migration completion
      if (!dryRun) {
        await this.logMigration(progress);
      }

      return progress;
    } catch (error) {
      console.error('Re-encryption failed:', error);
      throw error;
    }
  }

  /**
   * Process a batch of sessions
   */
  private async processBatch(
    batch: any[],
    progress: ReencryptionProgress,
    dryRun: boolean,
    sessionsToProcess?: string[]
  ): Promise<void> {
    const writeBatchOp = writeBatch(this.db);

    for (const docSnapshot of batch) {
      const sessionId = docSnapshot.id;
      
      // Skip if not in the list of sessions to process
      if (sessionsToProcess && !sessionsToProcess.includes(sessionId)) {
        continue;
      }

      try {
        const sessionData = docSnapshot.data() as EncryptedSession;
        const reencryptedData = await this.reencryptSession(sessionData);

        if (!dryRun) {
          writeBatchOp.update(docSnapshot.ref, reencryptedData as any);
        }

        progress.processed++;
        progress.successful++;
      } catch (error) {
        progress.processed++;
        progress.failed++;
        progress.errors.push({
          sessionId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`Failed to re-encrypt session ${sessionId}:`, error);
      }
    }

    if (!dryRun) {
      await writeBatchOp.commit();
    }
  }

  /**
   * Re-encrypt a single session
   */
  private async reencryptSession(session: EncryptedSession): Promise<Partial<EncryptedSession>> {
    const currentKeyInfo = await enhancedEncryptionService.getCurrentKey();
    
    // Check if patients field needs re-encryption
    if (session.patients && session.patients.encrypted) {
      const needsReencryption = await this.needsReencryption(session.patients);
      
      if (needsReencryption) {
        // Decrypt with old key and re-encrypt with new key
        const decryptedPatients = await this.decryptField(session.patients);
        const reencryptedField = await this.encryptField(decryptedPatients);
        
        return {
          patients: reencryptedField,
          lastModified: new Date().toISOString(),
          encryptionMetadata: {
            version: currentKeyInfo.version,
            migratedFrom: session.patients.keyVersion || 'legacy',
            migratedAt: new Date().toISOString()
          }
        };
      }
    }

    // No re-encryption needed
    return {};
  }

  /**
   * Check if a field needs re-encryption
   */
  private async needsReencryption(field: EncryptedField): Promise<boolean> {
    const currentKeyInfo = await enhancedEncryptionService.getCurrentKey();
    
    // Legacy data (no version info) always needs re-encryption
    if (!field.keyVersion) {
      return true;
    }
    
    // Check if version matches current
    return field.keyVersion !== currentKeyInfo.version;
  }

  /**
   * Decrypt an encrypted field
   */
  private async decryptField(field: EncryptedField): Promise<any> {
    if (!field.encrypted || !field.data) {
      return field.plainData || null;
    }

    // Handle legacy format
    if (!field.keyVersion) {
      return enhancedEncryptionService.decrypt(field.data);
    }

    // Handle versioned format
    return enhancedEncryptionService.decrypt({
      data: field.data,
      keyVersion: field.keyVersion,
      encryptedAt: field.encryptedAt || new Date().toISOString(),
      algorithm: field.algorithm || 'AES'
    });
  }

  /**
   * Encrypt data into a field
   */
  private async encryptField(data: any): Promise<EncryptedField> {
    const encrypted = await enhancedEncryptionService.encrypt(data);
    
    return {
      encrypted: true,
      data: encrypted.data,
      keyVersion: encrypted.keyVersion,
      encryptedAt: encrypted.encryptedAt,
      algorithm: encrypted.algorithm
    };
  }

  /**
   * Re-encrypt a specific session by ID
   */
  public async reencryptSessionById(sessionId: string): Promise<void> {
    const sessionRef = doc(this.db, 'sessions', sessionId);
    const sessionSnap = await getDocs(query(collection(this.db, 'sessions'), where('__name__', '==', sessionId)));
    
    if (sessionSnap.empty) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const sessionData = sessionSnap.docs[0].data() as EncryptedSession;
    const reencryptedData = await this.reencryptSession(sessionData);

    if (Object.keys(reencryptedData).length > 0) {
      await updateDoc(sessionRef, reencryptedData as any);
      console.log(`Successfully re-encrypted session ${sessionId}`);
    } else {
      console.log(`Session ${sessionId} is already using the current key`);
    }
  }

  /**
   * Get sessions that need re-encryption
   */
  public async getSessionsNeedingReencryption(): Promise<string[]> {
    const currentKeyInfo = await enhancedEncryptionService.getCurrentKey();
    const sessionsRef = collection(this.db, 'sessions');
    const snapshot = await getDocs(sessionsRef);
    
    const needsReencryption: string[] = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data() as EncryptedSession;
      
      // Check if it's legacy data or different version
      if (!data.patients?.keyVersion || data.patients.keyVersion !== currentKeyInfo.version) {
        needsReencryption.push(doc.id);
      }
    }
    
    return needsReencryption;
  }

  /**
   * Log migration to audit trail
   */
  private async logMigration(progress: ReencryptionProgress): Promise<void> {
    const migrationLog: EncryptionMigrationLog = {
      sessionId: 'bulk-migration-' + Date.now(),
      fromVersion: 'various',
      toVersion: (await enhancedEncryptionService.getCurrentKey()).version,
      migratedAt: new Date().toISOString(),
      success: progress.failed === 0,
      error: progress.errors.length > 0 ? JSON.stringify(progress.errors) : undefined
    };

    try {
      const logsRef = collection(this.db, 'encryption_migrations');
      await addDoc(logsRef, migrationLog);
    } catch (error) {
      console.error('Failed to log migration:', error);
    }
  }

  /**
   * Get migration history
   */
  public async getMigrationHistory(limit = 10): Promise<EncryptionMigrationLog[]> {
    const logsRef = collection(this.db, 'encryption_migrations');
    const q = query(logsRef, orderBy('migratedAt', 'desc'), firestoreLimit(limit));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as EncryptionMigrationLog));
  }
}

// Export singleton instance
export const reencryptionService = ReencryptionService.getInstance();