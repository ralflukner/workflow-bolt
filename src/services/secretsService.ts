/**
 * HIPAA-Compliant Secrets Management Service
 * Prioritizes Google Secret Manager over environment variables
 * Handles secure retrieval of sensitive configuration data
 */

interface SecretConfig {
  secretName: string;
  envFallback?: string;
  required?: boolean;
}

interface SecretsCache {
  [key: string]: {
    value: string;
    timestamp: number;
    ttl: number;
  };
}

export class SecretsService {
  private static instance: SecretsService;
  private static cache: SecretsCache = {};
  private static readonly CACHE_TTL = 300000; // 5 minutes in milliseconds

  // Secret configuration mapping
  private static readonly SECRET_CONFIGS: Record<string, SecretConfig> = {
    // Encryption keys
    PATIENT_ENCRYPTION_KEY: {
      secretName: 'patient-encryption-key',
      envFallback: 'REACT_APP_PATIENT_ENCRYPTION_KEY',
      required: true
    },
    
    // Tebra API credentials  
    TEBRA_USERNAME: {
      secretName: 'TEBRA_USERNAME',
      envFallback: 'REACT_APP_TEBRA_USERNAME',
      required: true
    },
    TEBRA_PASSWORD: {
      secretName: 'TEBRA_PASSWORD',
      envFallback: 'REACT_APP_TEBRA_PASSWORD', 
      required: true
    },
    TEBRA_CUSTOMER_KEY: {
      secretName: 'TEBRA_CUSTOMER_KEY',
      envFallback: 'REACT_APP_TEBRA_CUSTOMERKEY',
      required: true
    },
    TEBRA_WSDL_URL: {
      secretName: 'TEBRA_WSDL_URL',
      envFallback: 'REACT_APP_TEBRA_WSDL_URL',
      required: true
    },
    
    // API Keys
    TEBRA_PROXY_API_KEY: {
      secretName: 'tebra-proxy-api-key',
      envFallback: 'VITE_TEBRA_PROXY_API_KEY',
      required: true
    },
    
    // Firebase config (for server-side usage)
    FIREBASE_API_KEY: {
      secretName: 'firebase-api-key',
      envFallback: 'VITE_FIREBASE_API_KEY',
      required: false
    }
  };

  private constructor() {}

  public static getInstance(): SecretsService {
    if (!SecretsService.instance) {
      SecretsService.instance = new SecretsService();
    }
    return SecretsService.instance;
  }

  /**
   * Get secret from Google Secret Manager with fallback to environment variables
   */
  public async getSecret(secretKey: string): Promise<string> {
    const config = SecretsService.SECRET_CONFIGS[secretKey];
    if (!config) {
      throw new Error(`Unknown secret key: ${secretKey}`);
    }

    // Check cache first
    const cached = this.getCachedSecret(secretKey);
    if (cached) {
      return cached;
    }

    let secretValue: string | null = null;

    try {
      // Try Google Secret Manager first (server-side only)
      if (typeof window === 'undefined') {
        secretValue = await this.getFromSecretManager(config.secretName);
        if (secretValue) {
          console.log(`✅ Retrieved ${secretKey} from Google Secret Manager`);
          this.cacheSecret(secretKey, secretValue);
          return secretValue;
        }
      }

      // Fallback to environment variables
      if (config.envFallback) {
        secretValue = this.getFromEnvironment(config.envFallback);
        if (secretValue) {
          console.log(`⚠️ Retrieved ${secretKey} from environment variable (fallback)`);
          this.cacheSecret(secretKey, secretValue);
          return secretValue;
        }
      }

      // Handle missing required secrets
      if (config.required) {
        throw new Error(
          `Required secret ${secretKey} not found in Secret Manager or environment variables. ` +
          `Configure secret: gcloud secrets create ${config.secretName} --data-file=-`
        );
      }

      return '';
    } catch (error) {
      console.error(`Failed to retrieve secret ${secretKey}:`, error);
      
      if (config.required) {
        throw error;
      }
      
      return '';
    }
  }

  /**
   * Get secret synchronously (environment variables only)
   */
  public getSecretSync(secretKey: string): string {
    const config = SecretsService.SECRET_CONFIGS[secretKey];
    if (!config) {
      throw new Error(`Unknown secret key: ${secretKey}`);
    }

    // Check cache first
    const cached = this.getCachedSecret(secretKey);
    if (cached) {
      return cached;
    }

    // Only environment variables for synchronous access
    if (config.envFallback) {
      const secretValue = this.getFromEnvironment(config.envFallback);
      if (secretValue) {
        this.cacheSecret(secretKey, secretValue);
        return secretValue;
      }
    }

    if (config.required) {
      throw new Error(
        `Required secret ${secretKey} not found. Set ${config.envFallback} environment variable ` +
        `or configure Google Secret Manager: gcloud secrets create ${config.secretName} --data-file=-`
      );
    }

    return '';
  }

  /**
   * Frontend-safe method - Secret Manager access moved to Firebase Functions
   * This now only handles environment variable fallback
   */
  private async getFromSecretManager(secretName: string): Promise<string | null> {
    try {
      // Lazy-load the client so the browser bundle is not affected
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
      const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
      const client = new SecretManagerServiceClient();

      const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT_ID || process.env.PROJECT_ID;
      if (!projectId) {
        console.warn('GOOGLE_CLOUD_PROJECT environment variable not set – cannot access Secret Manager');
        return null;
      }

      const [version] = await client.accessSecretVersion({
        name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
      });

      if (!version.payload?.data) {
        console.warn(`Secret ${secretName} has no payload`);
        return null;
      }

      // Convert Buffer to string
      return version.payload.data.toString();
    } catch (error) {
      console.error(`getFromSecretManager error for ${secretName}:`, error);
      return null;
    }
  }

  /**
   * Retrieve secret from environment variables
   */
  private getFromEnvironment(envVar: string): string | null {
    // Try process.env first (works in both Node.js and Jest)
    if (typeof process !== 'undefined' && process.env) {
      const value = process.env[envVar];
      if (value) {
        return value;
      }
    }

    // Browser environment - use getEnvVar helper that handles import.meta safely
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getEnvVar } = require('../constants/env');
      const value = getEnvVar(envVar);
      return value || null;
    } catch {
      // Silently fall back to null if constants module not available
      return null;
    }
  }

  /**
   * Cache secret with TTL
   */
  private cacheSecret(key: string, value: string): void {
    SecretsService.cache[key] = {
      value,
      timestamp: Date.now(),
      ttl: SecretsService.CACHE_TTL
    };
  }

  /**
   * Get cached secret if not expired
   */
  private getCachedSecret(key: string): string | null {
    const cached = SecretsService.cache[key];
    if (!cached) {
      return null;
    }

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      delete SecretsService.cache[key];
      return null;
    }

    return cached.value;
  }

  /**
   * Clear all cached secrets (for testing/security)
   */
  public clearCache(): void {
    SecretsService.cache = {};
  }

  /**
   * Store a secret in Google Secret Manager
   * Note: This functionality has been moved to Firebase Functions for security
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async storeSecret(_secretName: string, _secretValue: string): Promise<void> {
    throw new Error(
      'Secret storage has been moved to Firebase Functions for HIPAA compliance. ' +
      'Use the Firebase Functions backend to store secrets securely.'
    );
  }
}

// Export singleton instance
export const secretsService = SecretsService.getInstance();