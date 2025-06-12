// Mock implementation of SecretsService for testing

export class SecretsService {
  private static instance: SecretsService;
  private static cache: Record<string, any> = {};

  public static getInstance(): SecretsService {
    if (!SecretsService.instance) {
      SecretsService.instance = new SecretsService();
    }
    return SecretsService.instance;
  }

  /**
   * Mock get secret - returns test values
   */
  public async getSecret(secretKey: string): Promise<string> {
    const mockSecrets: Record<string, string> = {
      TEBRA_USERNAME: 'test-user@luknerclinic.com',
      TEBRA_PASSWORD: 'test-password',
      TEBRA_CUSTOMER_KEY: 'test-customer-key',
      TEBRA_PROXY_API_KEY: 'test-proxy-api-key',
      FIREBASE_API_KEY: 'test-firebase-api-key',
    };

    return mockSecrets[secretKey] || '';
  }

  /**
   * Mock get secret sync - returns test values
   */
  public getSecretSync(secretKey: string): string {
    const mockSecrets: Record<string, string> = {
      TEBRA_USERNAME: 'test-user@luknerclinic.com',
      TEBRA_PASSWORD: 'test-password',
      TEBRA_CUSTOMER_KEY: 'test-customer-key',
      TEBRA_PROXY_API_KEY: 'test-proxy-api-key',
      FIREBASE_API_KEY: 'test-firebase-api-key',
    };

    return mockSecrets[secretKey] || '';
  }

  /**
   * Mock clear cache
   */
  public clearCache(): void {
    SecretsService.cache = {};
  }

  /**
   * Mock store secret
   */
  public async storeSecret(secretName: string, secretValue: string): Promise<void> {
    // Mock implementation - do nothing
  }
}

// Export singleton instance
export const secretsService = SecretsService.getInstance(); 