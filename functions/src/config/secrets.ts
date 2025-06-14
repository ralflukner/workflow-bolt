import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const secretClient = new SecretManagerServiceClient();
const projectId = 'luknerlumina-firebase';

/**
 * Centralized secret management for HIPAA compliance
 * All secrets are stored in Google Secret Manager with audit logging
 */
export const secrets = {
  auth0Domain: () => getSecret(`projects/${projectId}/secrets/auth0-domain/versions/latest`),
  auth0Audience: () => getSecret(`projects/${projectId}/secrets/auth0-audience/versions/latest`),
  
  // Future Tebra secrets (when needed)
  tebraUser: () => getSecret(`projects/${projectId}/secrets/TEBRA_USERNAME/versions/latest`),
  tebraPass: () => getSecret(`projects/${projectId}/secrets/TEBRA_PASSWORD/versions/latest`),
  tebraAPI: () => getSecret(`projects/${projectId}/secrets/tebra-api-url/versions/latest`)
};

/**
 * Retrieves a secret from Google Secret Manager
 * @param name - Full secret name (projects/PROJECT/secrets/SECRET/versions/VERSION)
 * @returns The secret value as a string
 */
async function getSecret(name: string): Promise<string> {
  try {
    const [version] = await secretClient.accessSecretVersion({ name });
    const secretValue = version.payload?.data?.toString();
    
    if (!secretValue) {
      throw new Error(`Secret ${name} is empty or undefined`);
    }
    
    // HIPAA Audit: Log secret access (without the actual secret value)
    console.log('HIPAA_AUDIT:', JSON.stringify({
      type: 'SECRET_ACCESS',
      secretName: name.split('/').slice(-3, -2)[0], // Just the secret name
      timestamp: new Date().toISOString(),
      source: 'cloud-function'
    }));
    
    return secretValue;
  } catch (error) {
    console.error(`Failed to access secret ${name}:`, error);
    throw new Error(`Secret access failed: ${name}`);
  }
}

/**
 * Batch retrieve multiple secrets for better performance
 * @param secretNames - Array of secret names
 * @returns Array of secret values in the same order
 */
export async function getSecrets(secretNames: string[]): Promise<string[]> {
  return Promise.all(secretNames.map(name => getSecret(name)));
} 