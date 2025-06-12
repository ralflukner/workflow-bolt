import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

export class SecretManager {
  private client: SecretManagerServiceClient;
  private projectId: string;

  constructor(projectId?: string) {
    this.client = new SecretManagerServiceClient();
    this.projectId = projectId || process.env.GOOGLE_CLOUD_PROJECT || '';
  }

  /**
   * Securely retrieves a secret from Google Secret Manager
   * @param secretName - The name of the secret to retrieve
   * @returns The secret value or null if not found
   */
  async getSecret(secretName: string): Promise<string | null> {
    try {
      const secretPath = `projects/${this.projectId}/secrets/${secretName}/versions/latest`;
      
      console.log(`Accessing secret: ${secretName} (path redacted for security)`);
      
      const [version] = await this.client.accessSecretVersion({
        name: secretPath,
      });

      const payload = version.payload?.data?.toString();
      
      if (payload) {
        console.log(`Successfully retrieved secret: ${secretName}`);
        return payload;
      } else {
        console.warn(`Secret ${secretName} exists but has no payload`);
        return null;
      }
    } catch (error) {
      // Log error without exposing sensitive information
      console.error(`Failed to retrieve secret ${secretName}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      return null;
    }
  }

  /**
   * Validates that all required Tebra secrets are available
   * @returns Object with validation results
   */
  async validateTebraSecrets(): Promise<{
    isValid: boolean;
    missingSecrets: string[];
    availableSecrets: string[];
  }> {
    const requiredSecrets = ['TEBRA_USERNAME', 'TEBRA_PASSWORD', 'TEBRA_API_URL'];
    const missingSecrets: string[] = [];
    const availableSecrets: string[] = [];

    for (const secretName of requiredSecrets) {
      const secret = await this.getSecret(secretName);
      if (secret && secret.trim() !== '') {
        availableSecrets.push(secretName);
      } else {
        missingSecrets.push(secretName);
      }
    }

    return {
      isValid: missingSecrets.length === 0,
      missingSecrets,
      availableSecrets
    };
  }

  /**
   * HIPAA-compliant method to check if secrets are properly configured
   * without logging actual values
   */
  async auditSecretConfiguration(): Promise<{
    configurationStatus: 'compliant' | 'non-compliant';
    issues: string[];
    recommendations: string[];
  }> {
    const validation = await this.validateTebraSecrets();
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!validation.isValid) {
      issues.push(`Missing required secrets: ${validation.missingSecrets.join(', ')}`);
      recommendations.push('Configure all required secrets in Google Secret Manager');
    }

    // Check if we're falling back to environment variables (less secure)
    const envFallbacks = validation.missingSecrets.filter(secret => 
      process.env[secret] !== undefined
    );

    if (envFallbacks.length > 0) {
      issues.push(`Using environment variables instead of Secret Manager for: ${envFallbacks.join(', ')}`);
      recommendations.push('Migrate environment variables to Google Secret Manager for enhanced security');
    }

    return {
      configurationStatus: issues.length === 0 ? 'compliant' : 'non-compliant',
      issues,
      recommendations
    };
  }
}

// Utility function to redact sensitive information from log messages
export function redactSensitiveData(message: string, sensitiveValues: (string | null | undefined)[]): string {
  let redactedMessage = message;
  
  for (const value of sensitiveValues) {
    if (value && typeof value === 'string' && value.length > 0) {
      // Escape special regex characters
      const escapedValue = value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escapedValue, 'gi');
      redactedMessage = redactedMessage.replace(regex, '[REDACTED]');
    }
  }
  
  return redactedMessage;
} 