import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { Storage } from '@google-cloud/storage';

interface RotationState {
  lastRotation: string;
  nextRotation: string;
  rotationHistory: {
    timestamp: string;
    action: string;
    status: string;
    details?: string;
  }[];
}

export class SecureRotationState {
  private readonly secretClient: SecretManagerServiceClient;
  private readonly storage: Storage;
  private readonly projectId: string;
  private readonly secretId: string;
  private readonly bucketName: string;
  private readonly stateObjectName: string;

  constructor(projectId?: string) {
    this.secretClient = new SecretManagerServiceClient();
    this.storage = new Storage();
    this.projectId = projectId ?? process.env.GCP_PROJECT_ID ?? '';
    if (!this.projectId) {
      throw new Error('GCP_PROJECT_ID environment variable must be set or provided to SecureRotationState');
    }
    this.secretId = 'tebra-rotation-state';
    this.bucketName = `${this.projectId}-rotation-state`;
    this.stateObjectName = 'credential-rotation-state.json';
  }

  /**
   * Initializes secure storage for rotation state
   */
  async initialize(): Promise<void> {
    try {
      // Create bucket if it doesn't exist
      const [exists] = await this.storage.bucket(this.bucketName).exists();
      if (!exists) {
        await this.storage.createBucket(this.bucketName, {
          location: 'us-central1',
          storageClass: 'STANDARD',
          versioning: { enabled: true },
          labels: {
            environment: 'production',
            purpose: 'credential-rotation'
          }
        });
      }

      // Create secret if it doesn't exist
      try {
        await this.secretClient.getSecret({
          name: `projects/${this.projectId}/secrets/${this.secretId}`
        });
      } catch {
        await this.secretClient.createSecret({
          parent: `projects/${this.projectId}`,
          secretId: this.secretId,
          secret: {
            replication: {
              userManaged: {
                replicas: [{
                  location: 'us-central1'
                }]
              }
            },
            labels: {
              environment: 'production',
              purpose: 'credential-rotation'
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to initialize secure rotation state storage:', error);
      throw new Error('Failed to initialize secure rotation state storage');
    }
  }

  /**
   * Saves rotation state securely
   */
  async saveState(state: RotationState): Promise<void> {
    try {
      const stateJson = JSON.stringify(state, null, 2);

      // Save to Secret Manager
      await this.secretClient.addSecretVersion({
        parent: `projects/${this.projectId}/secrets/${this.secretId}`,
        payload: {
          data: Buffer.from(stateJson)
        }
      });

      // Save to Cloud Storage with versioning
      await this.storage.bucket(this.bucketName)
        .file(this.stateObjectName)
        .save(stateJson, {
          metadata: {
            contentType: 'application/json',
            metadata: {
              timestamp: new Date().toISOString(),
              environment: 'production'
            }
          }
        });

      // Log the update
      console.log('Rotation state updated successfully');
    } catch (error) {
      console.error('Failed to save rotation state:', error);
      throw new Error('Failed to save rotation state');
    }
  }

  /**
   * Retrieves rotation state
   */
  async getState(): Promise<RotationState> {
    try {
      // Try Secret Manager first
      try {
        const [version] = await this.secretClient.accessSecretVersion({
          name: `projects/${this.projectId}/secrets/${this.secretId}/versions/latest`
        });
        if (!version.payload?.data) {
          throw new Error('Secret payload empty');
        }
        return JSON.parse(version.payload.data.toString());
      } catch {
        // Fallback to Cloud Storage
        const [file] = await this.storage.bucket(this.bucketName)
          .file(this.stateObjectName)
          .download();
        return JSON.parse(file.toString());
      }
    } catch (error) {
      console.error('Failed to retrieve rotation state:', error);
      throw new Error('Failed to retrieve rotation state');
    }
  }

  /**
   * Archives old rotation state
   */
  async archiveState(): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const archiveName = `archive/${this.stateObjectName}.${timestamp}`;

      // Archive in Cloud Storage
 const dest = this.storage.bucket(this.bucketName).file(archiveName);
 await this.storage
   .bucket(this.bucketName)
   .file(this.stateObjectName)
   .copy(dest);

      // Delete old versions from Secret Manager
      const [versions] = await this.secretClient.listSecretVersions({
        parent: `projects/${this.projectId}/secrets/${this.secretId}`
      });

      for (const version of versions.slice(0, -1)) {
        await this.secretClient.destroySecretVersion({
          name: version.name
        });
      }
    } catch (error) {
      console.error('Failed to archive rotation state:', error);
      throw new Error('Failed to archive rotation state');
    }
  }
} 