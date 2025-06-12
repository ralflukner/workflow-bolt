import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { TebraApiService } from '../tebraApiService';

// Mock the entire secrets service module
jest.mock('../secretsService', () => ({
  SecretsService: jest.fn().mockImplementation(() => ({
    getSecret: jest.fn()
  }))
}));

describe('Tebra Configuration Diagnostics', () => {
  let mockGetSecret: jest.MockedFunction<(secretKey: string) => Promise<string | null>>;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    // Save original fetch
    originalFetch = global.fetch;
    
    // Create mock for getSecret that can return null
    mockGetSecret = jest.fn() as jest.MockedFunction<(secretKey: string) => Promise<string | null>>;
    
    // Mock the TebraApiService to use our mock
    jest.spyOn(require('../secretsService'), 'SecretsService').mockImplementation(() => ({
      getSecret: mockGetSecret
    }));
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Environment Variables Configuration', () => {
    it('should detect missing Tebra username environment variable', async () => {
      // Mock missing username
      mockSecretsService.getSecret.mockImplementation(async (key: string) => {
        if (key === 'tebra-username') return null;
        if (key === 'tebra-password') return 'test-password';
        if (key === 'tebra-api-url') return 'https://api.tebra.com';
        return null;
      });

      const tebraService = new TebraApiService();
      const result = await tebraService.testConnection();
      
      expect(result).toBe(false);
      expect(mockSecretsService.getSecret).toHaveBeenCalledWith('tebra-username');
    });

    it('should detect missing Tebra password environment variable', async () => {
      // Mock missing password
      mockSecretsService.getSecret.mockImplementation(async (key: string) => {
        if (key === 'tebra-username') return 'test-user';
        if (key === 'tebra-password') return null;
        if (key === 'tebra-api-url') return 'https://api.tebra.com';
        return null;
      });

      const tebraService = new TebraApiService();
      const result = await tebraService.testConnection();
      
      expect(result).toBe(false);
      expect(mockSecretsService.getSecret).toHaveBeenCalledWith('tebra-password');
    });

    it('should detect missing Tebra API URL environment variable', async () => {
      // Mock missing API URL
      mockSecretsService.getSecret.mockImplementation(async (key: string) => {
        if (key === 'tebra-username') return 'test-user';
        if (key === 'tebra-password') return 'test-password';
        if (key === 'tebra-api-url') return null;
        return null;
      });

      const tebraService = new TebraApiService();
      const result = await tebraService.testConnection();
      
      expect(result).toBe(false);
      expect(mockSecretsService.getSecret).toHaveBeenCalledWith('tebra-api-url');
    });

    it('should detect when all Tebra credentials are missing', async () => {
      // Mock all credentials missing
      mockSecretsService.getSecret.mockImplementation(async () => null);

      const tebraService = new TebraApiService();
      const result = await tebraService.testConnection();
      
      expect(result).toBe(false);
      expect(mockSecretsService.getSecret).toHaveBeenCalledWith('tebra-username');
      expect(mockSecretsService.getSecret).toHaveBeenCalledWith('tebra-password');
      expect(mockSecretsService.getSecret).toHaveBeenCalledWith('tebra-api-url');
    });
  });

  describe('Credentials Validation', () => {
    it('should detect empty string credentials', async () => {
      // Mock empty string credentials (different from null)
      mockSecretsService.getSecret.mockImplementation(async (key: string) => {
        if (key === 'tebra-username') return '';
        if (key === 'tebra-password') return '';
        if (key === 'tebra-api-url') return '';
        return null;
      });

      const tebraService = new TebraApiService();
      const result = await tebraService.testConnection();
      
      expect(result).toBe(false);
    });

    it('should detect whitespace-only credentials', async () => {
      // Mock whitespace-only credentials
      mockSecretsService.getSecret.mockImplementation(async (key: string) => {
        if (key === 'tebra-username') return '   ';
        if (key === 'tebra-password') return '\t\n';
        if (key === 'tebra-api-url') return '  ';
        return null;
      });

      const tebraService = new TebraApiService();
      const result = await tebraService.testConnection();
      
      expect(result).toBe(false);
    });

    it('should detect malformed API URL', async () => {
      // Mock malformed URL
      mockSecretsService.getSecret.mockImplementation(async (key: string) => {
        if (key === 'tebra-username') return 'test-user';
        if (key === 'tebra-password') return 'test-password';
        if (key === 'tebra-api-url') return 'not-a-valid-url';
        return null;
      });

      const tebraService = new TebraApiService();
      const result = await tebraService.testConnection();
      
      expect(result).toBe(false);
    });
  });

  describe('Secrets Service Integration', () => {
    it('should handle Secrets Service failures gracefully', async () => {
      // Mock Secrets Service throwing an error
      mockSecretsService.getSecret.mockRejectedValue(new Error('Secrets Service unavailable'));

      const tebraService = new TebraApiService();
      const result = await tebraService.testConnection();
      
      expect(result).toBe(false);
    });

    it('should handle Secrets Service timeout', async () => {
      // Mock Secrets Service timing out
      mockSecretsService.getSecret.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 1000)
        )
      );

      const tebraService = new TebraApiService();
      const result = await tebraService.testConnection();
      
      expect(result).toBe(false);
    });
  });

  describe('Firebase Functions Configuration', () => {
    it('should detect when Firebase Functions are not available', async () => {
      // Mock proper credentials but Firebase Functions unavailable
      mockSecretsService.getSecret.mockImplementation(async (key: string) => {
        if (key === 'tebra-username') return 'test-user';
        if (key === 'tebra-password') return 'test-password';
        if (key === 'tebra-api-url') return 'https://api.tebra.com';
        return null;
      });

      // Mock fetch to simulate Firebase Functions being down
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const tebraService = new TebraApiService();
      const result = await tebraService.testConnection();
      
      expect(result).toBe(false);
    });

    it('should detect Firebase Functions returning authentication errors', async () => {
      // Mock proper credentials
      mockSecretsService.getSecret.mockImplementation(async (key: string) => {
        if (key === 'tebra-username') return 'test-user';
        if (key === 'tebra-password') return 'test-password';
        if (key === 'tebra-api-url') return 'https://api.tebra.com';
        return null;
      });

      // Mock Firebase Functions returning auth error
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ 
          error: 'Authentication failed',
          code: 'auth/invalid-credentials'
        })
      } as Response);

      const tebraService = new TebraApiService();
      const result = await tebraService.testConnection();
      
      expect(result).toBe(false);
    });

    it('should detect CORS issues with Firebase Functions', async () => {
      // Mock proper credentials
      mockSecretsService.getSecret.mockImplementation(async (key: string) => {
        if (key === 'tebra-username') return 'test-user';
        if (key === 'tebra-password') return 'test-password';
        if (key === 'tebra-api-url') return 'https://api.tebra.com';
        return null;
      });

      // Mock CORS error
      global.fetch = jest.fn().mockRejectedValue(new Error('CORS policy: Cross origin requests are only supported for protocol schemes'));

      const tebraService = new TebraApiService();
      const result = await tebraService.testConnection();
      
      expect(result).toBe(false);
    });
  });

  describe('Network and Infrastructure Issues', () => {
    it('should detect network timeout issues', async () => {
      // Mock proper credentials
      mockSecretsService.getSecret.mockImplementation(async (key: string) => {
        if (key === 'tebra-username') return 'test-user';
        if (key === 'tebra-password') return 'test-password';
        if (key === 'tebra-api-url') return 'https://api.tebra.com';
        return null;
      });

      // Mock network timeout
      global.fetch = jest.fn().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 30000)
        )
      );

      const tebraService = new TebraApiService();
      const result = await tebraService.testConnection();
      
      expect(result).toBe(false);
    });

    it('should detect when Tebra API is completely unreachable', async () => {
      // Mock proper credentials
      mockSecretsService.getSecret.mockImplementation(async (key: string) => {
        if (key === 'tebra-username') return 'test-user';
        if (key === 'tebra-password') return 'test-password';
        if (key === 'tebra-api-url') return 'https://api.tebra.com';
        return null;
      });

      // Mock DNS/network failure
      global.fetch = jest.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND api.tebra.com'));

      const tebraService = new TebraApiService();
      const result = await tebraService.testConnection();
      
      expect(result).toBe(false);
    });
  });

  describe('Successful Configuration', () => {
    it('should pass when all configuration is correct', async () => {
      // Mock proper credentials
      mockSecretsService.getSecret.mockImplementation(async (key: string) => {
        if (key === 'tebra-username') return 'valid-user';
        if (key === 'tebra-password') return 'valid-password';
        if (key === 'tebra-api-url') return 'https://api.tebra.com';
        return null;
      });

      // Mock successful API response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ 
          success: true,
          data: { connected: true }
        })
      } as Response);

      const tebraService = new TebraApiService();
      const result = await tebraService.testConnection();
      
      expect(result).toBe(true);
    });
  });

  describe('Rate Limiting Issues', () => {
    it('should detect when Tebra API rate limiting is triggered', async () => {
      // Mock proper credentials
      mockSecretsService.getSecret.mockImplementation(async (key: string) => {
        if (key === 'tebra-username') return 'test-user';
        if (key === 'tebra-password') return 'test-password';
        if (key === 'tebra-api-url') return 'https://api.tebra.com';
        return null;
      });

      // Mock rate limiting response
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ 
          error: 'Too Many Requests',
          retryAfter: 60
        })
      } as Response);

      const tebraService = new TebraApiService();
      const result = await tebraService.testConnection();
      
      expect(result).toBe(false);
    });
  });
}); 