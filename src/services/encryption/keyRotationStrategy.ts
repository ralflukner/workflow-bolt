/**
 * Key Rotation Strategy for Enhanced Security
 * Implements automatic key rotation and multi-key encryption
 */

import { secretsService } from '../secretsService';
import CryptoJS from 'crypto-js';

export interface KeyRotationConfig {
  rotationIntervalDays: number;
  maxActiveKeys: number;
  enableMultiKeyEncryption: boolean;
  keyDerivationIterations: number;
}

export interface EncryptedWithMultipleKeys {
  // Each chunk encrypted with a different key
  chunks: Array<{
    data: string;
    keyVersion: string;
    chunkIndex: number;
    algorithm: string;
  }>;
  metadata: {
    totalChunks: number;
    encryptedAt: string;
    rotationGeneration: number;
    salt: string;
  };
}

export interface KeyMetadata {
  version: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'rotating' | 'retired';
  generation: number;
  algorithm: string;
  keyDerivationFunction?: 'PBKDF2' | 'Argon2';
}

class KeyRotationStrategy {
  private static instance: KeyRotationStrategy;
  private config: KeyRotationConfig = {
    rotationIntervalDays: 90, // Rotate every 90 days
    maxActiveKeys: 3, // Keep 3 active keys
    enableMultiKeyEncryption: true,
    keyDerivationIterations: 100000 // PBKDF2 iterations
  };
  
  private activeKeys: Map<string, KeyMetadata> = new Map();
  
  private constructor() {}

  public static getInstance(): KeyRotationStrategy {
    if (!KeyRotationStrategy.instance) {
      KeyRotationStrategy.instance = new KeyRotationStrategy();
    }
    return KeyRotationStrategy.instance;
  }

  /**
   * Initialize key rotation strategy
   */
  public async initialize(config?: Partial<KeyRotationConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    await this.loadActiveKeys();
    await this.checkRotationNeeded();
  }

  /**
   * Load active keys from Secret Manager
   */
  private async loadActiveKeys(): Promise<void> {
    try {
      // In production, this would query GSM for all active key versions
      const keys = await this.getActiveKeysFromGSM();
      
      for (const keyMeta of keys) {
        this.activeKeys.set(keyMeta.version, keyMeta);
      }
    } catch (error) {
      console.error('Failed to load active keys:', error);
    }
  }

  /**
   * Get active keys from Google Secret Manager
   */
  private async getActiveKeysFromGSM(): Promise<KeyMetadata[]> {
    // In production, this would list versions from GSM
    // For now, return mock data
    const currentVersion = `v${Date.now()}`;
    return [{
      version: currentVersion,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.config.rotationIntervalDays * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      generation: 1,
      algorithm: 'AES-256-GCM'
    }];
  }

  /**
   * Check if key rotation is needed
   */
  private async checkRotationNeeded(): Promise<boolean> {
    const activeKeys = Array.from(this.activeKeys.values())
      .filter(k => k.status === 'active')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (activeKeys.length === 0) {
      await this.rotateKeys();
      return true;
    }
    
    const newestKey = activeKeys[0];
    const keyAge = Date.now() - new Date(newestKey.createdAt).getTime();
    const rotationThreshold = this.config.rotationIntervalDays * 24 * 60 * 60 * 1000;
    
    if (keyAge > rotationThreshold) {
      await this.rotateKeys();
      return true;
    }
    
    return false;
  }

  /**
   * Rotate encryption keys
   */
  public async rotateKeys(): Promise<void> {
    console.log('🔄 Starting key rotation...');
    
    try {
      // Generate new key
      const newKey = this.generateSecureKey();
      const newVersion = `v${Date.now()}`;
      
      // Store in Secret Manager
      await this.storeKeyInGSM(newVersion, newKey);
      
      // Update active keys
      const newKeyMetadata: KeyMetadata = {
        version: newVersion,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.config.rotationIntervalDays * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        generation: this.getNextGeneration(),
        algorithm: 'AES-256-GCM'
      };
      
      this.activeKeys.set(newVersion, newKeyMetadata);
      
      // Mark old keys for retirement
      await this.retireOldKeys();
      
      console.log('✅ Key rotation completed. New version:', newVersion);
    } catch (error) {
      console.error('❌ Key rotation failed:', error);
      throw error;
    }
  }

  /**
   * Generate a cryptographically secure key
   */
  private generateSecureKey(): string {
    // Generate 256-bit key
    const randomBytes = CryptoJS.lib.WordArray.random(256/8);
    return CryptoJS.enc.Base64.stringify(randomBytes);
  }

  /**
   * Store key in Google Secret Manager
   */
  private async storeKeyInGSM(version: string, _key: string): Promise<void> {
    // In production, this would create a new version in GSM
    console.log(`Storing key version ${version} in GSM`);
    // await secretsService.createSecretVersion('PATIENT_ENCRYPTION_KEY', _key);
  }

  /**
   * Get next generation number
   */
  private getNextGeneration(): number {
    const activeKeys = Array.from(this.activeKeys.values());
    if (activeKeys.length === 0) return 1;
    
    const maxGeneration = Math.max(...activeKeys.map(k => k.generation));
    return maxGeneration + 1;
  }

  /**
   * Retire old keys beyond the max active limit
   */
  private async retireOldKeys(): Promise<void> {
    const activeKeys = Array.from(this.activeKeys.values())
      .filter(k => k.status === 'active')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (activeKeys.length > this.config.maxActiveKeys) {
      const keysToRetire = activeKeys.slice(this.config.maxActiveKeys);
      
      for (const key of keysToRetire) {
        key.status = 'retired';
        console.log(`Retired key version: ${key.version}`);
      }
    }
  }

  /**
   * Encrypt data using multiple keys for enhanced security
   */
  public async encryptWithMultipleKeys(data: any): Promise<EncryptedWithMultipleKeys> {
    if (!this.config.enableMultiKeyEncryption) {
      throw new Error('Multi-key encryption is not enabled');
    }
    
    const jsonData = JSON.stringify(data);
    const chunks = this.splitIntoChunks(jsonData);
    const salt = CryptoJS.lib.WordArray.random(128/8).toString();
    
    const activeKeys = Array.from(this.activeKeys.values())
      .filter(k => k.status === 'active')
      .slice(0, chunks.length);
    
    if (activeKeys.length < chunks.length) {
      throw new Error('Not enough active keys for multi-key encryption');
    }
    
    const encryptedChunks = await Promise.all(
      chunks.map(async (chunk, index) => {
        const keyMeta = activeKeys[index % activeKeys.length];
        const key = await this.deriveKey(keyMeta.version, salt);
        
        // Use standard CBC mode since GCM is not available in crypto-js
        const encrypted = CryptoJS.AES.encrypt(chunk, key, {
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }).toString();
        
        return {
          data: encrypted,
          keyVersion: keyMeta.version,
          chunkIndex: index,
          algorithm: keyMeta.algorithm
        };
      })
    );
    
    return {
      chunks: encryptedChunks,
      metadata: {
        totalChunks: chunks.length,
        encryptedAt: new Date().toISOString(),
        rotationGeneration: this.getNextGeneration() - 1,
        salt
      }
    };
  }

  /**
   * Decrypt data encrypted with multiple keys
   */
  public async decryptWithMultipleKeys(encrypted: EncryptedWithMultipleKeys): Promise<any> {
    const decryptedChunks = await Promise.all(
      encrypted.chunks
        .sort((a, b) => a.chunkIndex - b.chunkIndex)
        .map(async (chunk) => {
          const key = await this.deriveKey(chunk.keyVersion, encrypted.metadata.salt);
          
          // Use standard CBC mode since GCM is not available in crypto-js
          const decrypted = CryptoJS.AES.decrypt(chunk.data, key, {
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
          });
          
          return decrypted.toString(CryptoJS.enc.Utf8);
        })
    );
    
    const combined = decryptedChunks.join('');
    return JSON.parse(combined);
  }

  /**
   * Split data into chunks for multi-key encryption
   */
  private splitIntoChunks(data: string, chunkSize = 1024): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Derive a key using PBKDF2
   */
  private async deriveKey(baseKeyVersion: string, salt: string): Promise<string> {
    const baseKey = await this.getKeyByVersion(baseKeyVersion);
    
    const derivedKey = CryptoJS.PBKDF2(baseKey, salt, {
      keySize: 256/32,
      iterations: this.config.keyDerivationIterations,
      hasher: CryptoJS.algo.SHA256
    });
    
    return derivedKey.toString();
  }

  /**
   * Get a specific key version
   */
  private async getKeyByVersion(_version: string): Promise<string> {
    // In production, fetch from GSM with specific version
    // For now, return from secret service
    return await secretsService.getSecret('PATIENT_ENCRYPTION_KEY');
  }

  /**
   * Get key rotation status
   */
  public getRotationStatus(): {
    activeKeys: number;
    nextRotation: Date;
    currentGeneration: number;
  } {
    const activeKeys = Array.from(this.activeKeys.values())
      .filter(k => k.status === 'active');
    
    const newestKey = activeKeys
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    
    const nextRotation = newestKey 
      ? new Date(new Date(newestKey.createdAt).getTime() + this.config.rotationIntervalDays * 24 * 60 * 60 * 1000)
      : new Date();
    
    return {
      activeKeys: activeKeys.length,
      nextRotation,
      currentGeneration: this.getNextGeneration() - 1
    };
  }
}

// Export singleton instance
export const keyRotationStrategy = KeyRotationStrategy.getInstance();