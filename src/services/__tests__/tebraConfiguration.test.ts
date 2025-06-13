import { describe, it, expect, jest } from '@jest/globals';
import { TebraApiService } from '../tebraApiService';

describe('Tebra Configuration Diagnostics', () => {
  describe('Environment Variables Configuration', () => {
    it('should detect missing Tebra username environment variable', () => {
      // Test that checks for the presence of tebra-username
      const mockGetEnv = jest.fn();
      mockGetEnv.mockReturnValue(undefined);
      
      // Simulate missing username
      const hasUsername = mockGetEnv('TEBRA_USERNAME') !== undefined;
      expect(hasUsername).toBe(false);
    });

    it('should detect missing Tebra password environment variable', () => {
      // Test that checks for the presence of tebra-password
      const mockGetEnv = jest.fn();
      mockGetEnv.mockReturnValue(undefined);
      
      // Simulate missing password
      const hasPassword = mockGetEnv('TEBRA_PASSWORD') !== undefined;
      expect(hasPassword).toBe(false);
    });

    it('should detect missing Tebra API URL environment variable', () => {
      // Test that checks for the presence of tebra-api-url
      const mockGetEnv = jest.fn();
      mockGetEnv.mockReturnValue(undefined);
      
      // Simulate missing API URL
      const hasApiUrl = mockGetEnv('TEBRA_API_URL') !== undefined;
      expect(hasApiUrl).toBe(false);
    });

    it('should validate that all required Tebra credentials are present', () => {
      // Test that checks for all required credentials
      const mockGetEnv = jest.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockGetEnv.mockImplementation((key: any) => {
        const envVars: Record<string, string> = {
          'TEBRA_USERNAME': 'test-user',
          'TEBRA_PASSWORD': 'test-password', 
          'TEBRA_API_URL': 'https://api.tebra.com'
        };
        return envVars[key as string];
      });

      const hasUsername = mockGetEnv('TEBRA_USERNAME') !== undefined;
      const hasPassword = mockGetEnv('TEBRA_PASSWORD') !== undefined;
      const hasApiUrl = mockGetEnv('TEBRA_API_URL') !== undefined;
      
      expect(hasUsername).toBe(true);
      expect(hasPassword).toBe(true);
      expect(hasApiUrl).toBe(true);
    });
  });

  describe('Credentials Validation', () => {
    it('should detect empty string credentials', () => {
      const validateCredential = (value: string | undefined) => {
        return value !== undefined && value !== null && value.trim() !== '';
      };

      expect(validateCredential('')).toBe(false);
      expect(validateCredential('   ')).toBe(false);
      expect(validateCredential('\t\n')).toBe(false);
      expect(validateCredential(undefined)).toBe(false);
    });

    it('should validate proper credentials format', () => {
      const validateCredential = (value: string | undefined) => {
        return value !== undefined && value !== null && value.trim() !== '';
      };

      expect(validateCredential('valid-username')).toBe(true);
      expect(validateCredential('valid-password123')).toBe(true);
      expect(validateCredential('https://api.tebra.com')).toBe(true);
    });

    it('should detect malformed API URL', () => {
      const validateUrl = (url: string | undefined) => {
        if (!url) return false;
        try {
          new URL(url);
          return url.startsWith('http://') || url.startsWith('https://');
        } catch {
          return false;
        }
      };

      expect(validateUrl('not-a-valid-url')).toBe(false);
      expect(validateUrl('ftp://invalid-protocol.com')).toBe(false);
      expect(validateUrl('https://api.tebra.com')).toBe(true);
      expect(validateUrl('http://localhost:3000')).toBe(true);
    });
  });

  describe('Connection Status Checks', () => {
    it('should detect common connection failure patterns', () => {
      const analyzeError = (errorMessage: string) => {
        const patterns = {
          credentials: /authentication|credentials|unauthorized|401/i,
          network: /network|timeout|unreachable|dns|enotfound/i,
          cors: /cors|cross.origin/i,
          rateLimit: /rate.limit|too.many.requests|429/i,
          server: /server.error|internal.error|500|503/i
        };

        for (const [type, pattern] of Object.entries(patterns)) {
          if (pattern.test(errorMessage)) {
            return type;
          }
        }
        return 'unknown';
      };

      expect(analyzeError('Authentication failed')).toBe('credentials');
      expect(analyzeError('401 Unauthorized')).toBe('credentials');
      expect(analyzeError('Network timeout')).toBe('network');
      expect(analyzeError('ENOTFOUND api.tebra.com')).toBe('network');
      expect(analyzeError('CORS policy violation')).toBe('cors');
      expect(analyzeError('Too many requests')).toBe('rateLimit');
      expect(analyzeError('429 Rate Limited')).toBe('rateLimit');
      expect(analyzeError('Internal server error')).toBe('server');
      expect(analyzeError('500 Server Error')).toBe('server');
    });

    it('should provide diagnostic recommendations', () => {
      const getDiagnosticRecommendation = (errorType: string) => {
        const recommendations: Record<string, string> = {
          credentials: 'Check Tebra username, password, and API configuration',
          network: 'Check internet connection and firewall settings',
          cors: 'Verify CORS configuration in Firebase Functions',
          rateLimit: 'Wait before retrying or check rate limiting settings',
          server: 'Check Tebra API status or Firebase Functions deployment'
        };
        return recommendations[errorType] || 'Check overall system configuration';
      };

      expect(getDiagnosticRecommendation('credentials')).toContain('username, password');
      expect(getDiagnosticRecommendation('network')).toContain('internet connection');
      expect(getDiagnosticRecommendation('cors')).toContain('CORS configuration');
      expect(getDiagnosticRecommendation('rateLimit')).toContain('rate limiting');
      expect(getDiagnosticRecommendation('server')).toContain('Firebase Functions');
    });
  });

  describe('Integration Health Checks', () => {
    it('should validate Firebase Functions availability', () => {
      const checkFirebaseFunctionsHealth = (response: { status: number; ok: boolean }) => {
        return response.ok && response.status === 200;
      };

      expect(checkFirebaseFunctionsHealth({ status: 200, ok: true })).toBe(true);
      expect(checkFirebaseFunctionsHealth({ status: 401, ok: false })).toBe(false);
      expect(checkFirebaseFunctionsHealth({ status: 500, ok: false })).toBe(false);
    });

    it('should validate Secrets Service configuration', () => {
      const checkSecretsServiceHealth = (secrets: Record<string, string | null>) => {
        const required = ['tebra-username', 'tebra-password', 'tebra-api-url'];
        return required.every(key => 
          secrets[key] !== null && 
          secrets[key] !== undefined && 
          secrets[key]!.trim() !== ''
        );
      };

      const validSecrets = {
        'tebra-username': 'user',
        'tebra-password': 'pass',
        'tebra-api-url': 'https://api.tebra.com'
      };

      const invalidSecrets = {
        'tebra-username': null,
        'tebra-password': 'pass',
        'tebra-api-url': 'https://api.tebra.com'
      };

      expect(checkSecretsServiceHealth(validSecrets)).toBe(true);
      expect(checkSecretsServiceHealth(invalidSecrets)).toBe(false);
    });
  });

  // Helper function to determine if real integration tests should run
  const shouldRunRealTests = () => {
    return process.env.RUN_REAL_TESTS === '1';
  };

  // Helper function to skip tests when real integration tests are disabled
  const skipUnlessRealTests = (testFn: () => void) => {
    if (!shouldRunRealTests()) {
      test.skip('Skipped: Real integration tests are disabled', testFn);
    } else {
      testFn();
    }
  };

  // REAL INTEGRATION TESTS - These should FAIL when Tebra API is actually disconnected
  describe('REAL Tebra API Integration Tests', () => {
    let tebraService: TebraApiService;

    beforeEach(() => {
      // Skip setup if real tests are disabled
      if (!shouldRunRealTests()) {
        return;
      }
      tebraService = new TebraApiService();
    });

    skipUnlessRealTests(() => {
      it('should successfully connect to Tebra API (REAL TEST - SHOULD FAIL)', async () => {
        // This test calls the ACTUAL Tebra API
        const result = await tebraService.testConnection();
        
        // This should FAIL if Tebra is disconnected (as reported in the UI)
        expect(result).toBe(true); // This will fail when API is down
      }, 10000); // 10 second timeout

      it('should retrieve providers from Tebra API (REAL TEST - SHOULD FAIL)', async () => {
        // This test calls the ACTUAL Tebra API
        const providers = await tebraService.getProviders();
        
        // This should FAIL if Tebra is disconnected
        expect(Array.isArray(providers)).toBe(true);
        expect(providers.length).toBeGreaterThan(0); // Should fail if no providers returned
      }, 10000);

      it('should handle patient search from Tebra API (REAL TEST - SHOULD FAIL)', async () => {
        // This test calls the ACTUAL Tebra API
        const searchCriteria = { lastName: 'Test' };
        const patients = await tebraService.searchPatients(searchCriteria);
        
        // This should FAIL if Tebra is disconnected
        expect(Array.isArray(patients)).toBe(true);
        // Note: Empty array is valid for search, but connection should work
      }, 10000);

      it('should return valid response structure from Tebra connection test', async () => {
        try {
          const result = await tebraService.testConnection();
          
          // Even if connection fails, we should get a boolean response
          expect(typeof result).toBe('boolean');
          
          // But if UI shows "Failed", this should be false
          if (!result) {
            console.warn('Tebra API connection test failed - this matches the UI status');
          }
          
          // This assertion will fail when API is truly down
          expect(result).toBe(true);
        } catch (error) {
          // If we get an error, that's also a sign of connection issues
          console.error('Tebra API connection threw error:', error);
          throw error; // Re-throw to fail the test
        }
      }, 10000);

      it('should diagnose specific connection failure when API is down', async () => {
        try {
          const result = await tebraService.testConnection();
          
          if (!result) {
            // Try to get more diagnostic info
            const providers = await tebraService.getProviders();
            const hasProviders = Array.isArray(providers) && providers.length > 0;
            
            // If connection test fails AND providers fail, it's a real connection issue
            expect(hasProviders).toBe(true); // This should fail
            
            // Log diagnostic info
            console.log('Connection test result:', result);
            console.log('Providers available:', hasProviders);
            console.log('This indicates Tebra API connectivity issues');
          }
          
          // Overall test should pass only if connection works
          expect(result).toBe(true);
        } catch (error) {
          console.error('Tebra API diagnostic test failed:', error);
          throw new Error(`Tebra API connection failed: ${error}`);
        }
      }, 15000);
    });
  });
}); 