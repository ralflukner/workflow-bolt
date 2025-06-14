import { SecureRotationState } from './secure-rotation-state';
import { TebraCredentials } from '../src/tebra-soap/tebra-api-service.types';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import * as crypto from 'crypto';
import { TebraSoapClient } from '../src/tebra-soap/tebraSoapClient';

interface RotationConfig {
  rotationIntervalDays: number;
  warningDaysBeforeRotation: number;
}

export class CredentialRotator {
  private readonly secretClient: SecretManagerServiceClient;
  private readonly secureState: SecureRotationState;
  private readonly projectId: string;
  private readonly config: RotationConfig;

  constructor(config: RotationConfig) {
    this.secretClient = new SecretManagerServiceClient();
    this.secureState = new SecureRotationState();
    this.projectId = process.env.GCP_PROJECT_ID || 'luknerlumina-firebase';
    this.config = config;
  }

  /**
   * Initializes the credential rotator
   */
  async initialize(): Promise<void> {
    await this.secureState.initialize();
  }

  /**
   * Checks if credentials need rotation
   */
  async checkRotationNeeded(): Promise<boolean> {
    const state = await this.secureState.getState();
    const nextRotation = new Date(state.nextRotation);
    const now = new Date();
    
    return now >= nextRotation;
  }

  /**
   * Rotates Tebra credentials
   */
  async rotateCredentials(): Promise<void> {
    try {
      // Get current credentials
      // const currentCredentials = await getCurrentCredentials();
      
      // Generate new credentials
      const newCredentials = await this.generateNewCredentials();
      
      // Update credentials in Secret Manager
      await this.updateCredentials(newCredentials);
      
      // Update rotation state
      const now = new Date();
      const nextRotation = new Date(now);
      nextRotation.setDate(nextRotation.getDate() + this.config.rotationIntervalDays);
      
      const state = await this.secureState.getState();
      state.lastRotation = now.toISOString();
      state.nextRotation = nextRotation.toISOString();
      state.rotationHistory.push({
        timestamp: now.toISOString(),
        action: 'ROTATE',
        status: 'SUCCESS',
        details: 'Credentials rotated successfully'
      });
      
      await this.secureState.saveState(state);
      
      // Archive old state
      await this.secureState.archiveState();
      
      console.log('Credentials rotated successfully');
    } catch (error) {
      console.error('Failed to rotate credentials:', error);
      throw new Error('Failed to rotate credentials');
    }
  }

  /**
   * Gets current credentials from Secret Manager
   */
  private async getCurrentCredentials(): Promise<TebraCredentials> {
    const [version] = await this.secretClient.accessSecretVersion({
      name: `projects/${this.projectId}/secrets/tebra-credentials/versions/latest`
    });
    
    if (!version.payload?.data) {
      throw new Error('No credentials found');
    }
    
    return JSON.parse(version.payload.data.toString());
  }

  /**
   * Generates new credentials
   */
  private async generateNewCredentials(): Promise<TebraCredentials> {
    // Fetch the current credentials so we can keep the WSDL / username
    const current = await this.getCurrentCredentials();

    // 1. Generate a strong random password that meets typical complexity rules
    const newPassword = this.generateSecurePassword(24);

    // 2. Attempt to update the password at the Tebra side so the new secret is valid.
    //    The SOAP WSDL exposes a `ChangePassword` (aka PracticeUserSave2)-like operation in
    //    most Kareo/Tebra deployments.  We try it here; if the call fails we surface the
    //    error so the rotator can abort and roll back.
    try {
      const soapClient = new TebraSoapClient(current);
      await soapClient.getRateLimiter().waitForSlot('ChangePassword');

      // Retrieve underlying SOAP client instance (type is unknown).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawClient: any = await soapClient.getClient();

      // Many implementations expose ChangePasswordAsync (or PracticeUserSave2).
      // If the method is missing we warn but continue so that rotation can be
      // handled manually.
      if (typeof rawClient.ChangePasswordAsync === 'function') {
        await rawClient.ChangePasswordAsync({
          username: current.username,
          oldPassword: current.password,
          newPassword,
        });
      } else {
        console.warn('[CredentialRotator] ChangePassword operation not available – skipping SOAP update');
      }
    } catch (err) {
      console.error('[CredentialRotator] Failed to update password via SOAP:', err);
      throw new Error('Failed to update password in Tebra – aborting rotation');
    }

    // 3. Return the new credential set so it can be written to GSM
    return {
      ...current,
      password: newPassword,
    };
  }

  /**
   * Generate a cryptographically-secure password string containing upper, lower,
   * digits and symbols.
   */
  private generateSecurePassword(length = 20): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}<>?';
    const bytes = crypto.randomBytes(length);
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[bytes[i] % charset.length];
    }
    return password;
  }

  /**
   * Updates credentials in Secret Manager
   */
  private async updateCredentials(credentials: TebraCredentials): Promise<void> {
    await this.secretClient.addSecretVersion({
      parent: `projects/${this.projectId}/secrets/tebra-credentials`,
      payload: {
        data: Buffer.from(JSON.stringify(credentials))
      }
    });
  }
} 