// Mock implementation of SecretsService for testing

export class SecretsService {
  private static instance: SecretsService;
  // Cache removed as it was unused

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
      TEBRA_WSDL_URL: 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl',
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
      TEBRA_WSDL_URL: 'https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?wsdl',
    };

    return mockSecrets[secretKey] || '';
  }

  /**
   * Mock clear cache
   */
  public clearCache(): void {
    // Cache functionality removed - mock implementation
  }

  /**
   * Mock store secret
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async storeSecret(_secretName: string, _secretValue: string): Promise<void> {
    // Mock implementation - do nothing
  }
}

// Export singleton instance
export const secretsService = SecretsService.getInstance(); 