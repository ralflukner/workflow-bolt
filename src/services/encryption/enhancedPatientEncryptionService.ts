/**
 * Enhanced Patient Encryption Service with Key Version Tracking
 * Handles HIPAA-compliant encryption with key rotation support
 */

import CryptoJS from 'crypto-js';
import { secretsService } from '../secretsService';
// Remove Sentry import as it's not installed
// import { captureException } from '@sentry/react';

export interface EncryptedData {
  data: string;
  keyVersion: string;
  encryptedAt: string;
  algorithm: 'AES' | 'AES-GCM';
}

export interface EncryptionKeyInfo {
  key: string;
  version: string;
  isDefault: boolean;
}

class EnhancedPatientEncryptionService {
  private static instance: EnhancedPatientEncryptionService;
  private currentKeyCache: EncryptionKeyInfo | null = null;
  private keyVersionsCache: Map<string, string> = new Map();

  private constructor() {}

  public static getInstance(): EnhancedPatientEncryptionService {
    if (!EnhancedPatientEncryptionService.instance) {
      EnhancedPatientEncryptionService.instance = new EnhancedPatientEncryptionService();
    }
    return EnhancedPatientEncryptionService.instance;
  }

  /**
   * Get current encryption key with version info
   */
  public async getCurrentKey(): Promise<EncryptionKeyInfo> {
    if (this.currentKeyCache) {
      return this.currentKeyCache;
    }

    try {
      // In production, this would fetch from Google Secret Manager with version
      const key = await secretsService.getSecret('PATIENT_ENCRYPTION_KEY');
      
      // Get the current version from GSM (in production)
      // For now, we'll use a timestamp-based version
      const version = await this.getCurrentKeyVersion();
      
      this.currentKeyCache = {
        key,
        version,
        isDefault: false
      };
      
      return this.currentKeyCache;
    } catch (error) {
      console.error('Failed to get encryption key:', error);
      
      // Fallback for development
      if (import.meta.env.DEV) {
        return {
          key: 'dev-only-key-do-not-use-in-production-1234567890',
          version: 'dev-v1',
          isDefault: true
        };
      }
      
      throw new Error('Encryption key not available');
    }
  }

  /**
   * Get current key version from Google Secret Manager
   */
  private async getCurrentKeyVersion(): Promise<string> {
    // In production, this would query GSM for the current version
    // For now, return a version based on the deployment
    return `v${import.meta.env.VITE_KEY_VERSION || '1'}`;
  }

  /**
   * Get a specific version of the encryption key
   */
  private async getKeyByVersion(version: string): Promise<string> {
    // Check cache first
    if (this.keyVersionsCache.has(version)) {
      return this.keyVersionsCache.get(version)!;
    }

    try {
      // In production, this would fetch specific version from GSM
      // For now, we'll handle known versions
      let key: string;
      
      if (version === 'dev-v1') {
        key = 'dev-only-key-do-not-use-in-production-1234567890';
      } else {
        // Fetch from secret manager with version
        key = await secretsService.getSecret('PATIENT_ENCRYPTION_KEY');
      }
      
      this.keyVersionsCache.set(version, key);
      return key;
    } catch (error) {
      console.error(`Failed to get key version ${version}:`, error);
      throw new Error(`Encryption key version ${version} not available`);
    }
  }

  /**
   * Encrypt patient data with version tracking
   */
  public async encrypt(data: any): Promise<EncryptedData> {
    try {
      const keyInfo = await this.getCurrentKey();
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, keyInfo.key).toString();
      
      return {
        data: encrypted,
        keyVersion: keyInfo.version,
        encryptedAt: new Date().toISOString(),
        algorithm: 'AES'
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      // TODO: Add Sentry integration when available
      // captureException(error);
      throw new Error('Failed to encrypt patient data');
    }
  }

  /**
   * Decrypt patient data using the appropriate key version
   */
  public async decrypt(encryptedData: EncryptedData | string): Promise<any> {
    try {
      // Handle legacy data (plain encrypted string)
      if (typeof encryptedData === 'string') {
        console.warn('Decrypting legacy data without version info');
        return this.decryptLegacy(encryptedData);
      }

      // Get the key for the specific version
      const key = await this.getKeyByVersion(encryptedData.keyVersion);
      
      // Decrypt based on algorithm
      let decrypted: string;
      if (encryptedData.algorithm === 'AES') {
        const bytes = CryptoJS.AES.decrypt(encryptedData.data, key);
        decrypted = bytes.toString(CryptoJS.enc.Utf8);
      } else {
        throw new Error(`Unsupported encryption algorithm: ${encryptedData.algorithm}`);
      }
      
      if (!decrypted) {
        throw new Error('Decryption produced empty result');
      }
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      
      // If it's a version issue, provide helpful error
      if (error instanceof Error && error.message.includes('version')) {
        throw new Error(`Cannot decrypt: ${error.message}. Data may need migration.`);
      }
      
      throw new Error('Failed to decrypt patient data');
    }
  }

  /**
   * Decrypt legacy data (without version info)
   */
  private async decryptLegacy(encryptedString: string): Promise<any> {
    // Try current key first
    try {
      const keyInfo = await this.getCurrentKey();
      const bytes = CryptoJS.AES.decrypt(encryptedString, keyInfo.key);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      if (decrypted) {
        return JSON.parse(decrypted);
      }
    } catch (error) {
      console.warn('Current key failed for legacy data:', error);
    }

    // Try known legacy keys
    const legacyKeys = [
      'dev-only-key-do-not-use-in-production-1234567890',
      // Add other known legacy keys here
    ];

    for (const key of legacyKeys) {
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedString, key);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (decrypted) {
          console.warn('Decrypted with legacy key - migration recommended');
          return JSON.parse(decrypted);
        }
      } catch (error) {
        // Continue to next key
      }
    }

    throw new Error('Failed to decrypt legacy data with any known key');
  }

  /**
   * Re-encrypt data with the current key
   */
  public async reencrypt(encryptedData: EncryptedData | string): Promise<EncryptedData> {
    const decrypted = await this.decrypt(encryptedData);
    return this.encrypt(decrypted);
  }

  /**
   * Check if data needs re-encryption
   */
  public async needsReencryption(encryptedData: EncryptedData | string): Promise<boolean> {
    if (typeof encryptedData === 'string') {
      return true; // Legacy data always needs re-encryption
    }

    const currentKey = await this.getCurrentKey();
    return encryptedData.keyVersion !== currentKey.version;
  }

  /**
   * Migrate a batch of encrypted data to the current key
   */
  public async migrateBatch(items: Array<{ id: string; data: EncryptedData | string }>): Promise<Array<{ id: string; data: EncryptedData; success: boolean; error?: string }>> {
    const results = [];
    
    for (const item of items) {
      try {
        const needsMigration = await this.needsReencryption(item.data);
        if (needsMigration) {
          const reencrypted = await this.reencrypt(item.data);
          results.push({ id: item.id, data: reencrypted, success: true });
        } else {
          results.push({ id: item.id, data: item.data as EncryptedData, success: true });
        }
      } catch (error) {
        results.push({ 
          id: item.id, 
          data: item.data as EncryptedData, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    return results;
  }

  /**
   * Clear all caches
   */
  public clearCache(): void {
    this.currentKeyCache = null;
    this.keyVersionsCache.clear();
  }
}

// Export singleton instance
export const enhancedEncryptionService = EnhancedPatientEncryptionService.getInstance();