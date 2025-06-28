/**
 * Encryption-related type definitions
 */

export interface EncryptedField<T = any> {
  encrypted: boolean;
  data?: string;
  keyVersion?: string;
  encryptedAt?: string;
  algorithm?: 'AES' | 'AES-GCM';
  plainData?: T; // Only available after decryption
}

export interface EncryptedSession {
  date: string;
  patients: EncryptedField<any[]>;
  lastModified: string;
  userId: string;
  encryptionMetadata?: {
    version: string;
    migratedFrom?: string;
    migratedAt?: string;
  };
}

export interface EncryptionMigrationLog {
  sessionId: string;
  fromVersion: string;
  toVersion: string;
  migratedAt: string;
  success: boolean;
  error?: string;
}