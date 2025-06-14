import { SecureRotationState } from './secure-rotation-state';
import { TebraCredentials } from '../src/tebra-soap/tebra-api-service.types';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

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
      const currentCredentials = await this.getCurrentCredentials();
      
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
    // TODO: Implement credential generation logic
    // This would typically involve calling Tebra's API to generate new credentials
    throw new Error('Credential generation not implemented');
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