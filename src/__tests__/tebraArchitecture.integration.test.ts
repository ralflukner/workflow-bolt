/**
 * Integration Tests for Tebra Architecture
 * Tests the complete flow: Frontend → Firebase Functions → PHP Cloud Run → Tebra SOAP
 * 
 * @group integration
 * @requires RUN_INTEGRATION_TESTS=true
 */

import { AuthBridge } from '../services/authBridge';
import { tebraGetAppointments, tebraTestConnection, tebraGetProviders } from '../services/tebraApi';

// Skip integration tests unless explicitly enabled
const runIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true';

const describeIf = (condition: boolean) => condition ? describe : describe.skip;

describeIf(runIntegrationTests)('Tebra Architecture Integration Tests', () => {
  let authBridge: AuthBridge;
  let firebaseToken: string;

  beforeAll(async () => {
    // Initialize authentication
    authBridge = AuthBridge.getInstance();
    
    // Get Firebase token for testing
    try {
      firebaseToken = await authBridge.getFirebaseToken();
      expect(firebaseToken).toBeTruthy();
    } catch (error) {
      console.error('Failed to get Firebase token:', error);
      throw new Error('Authentication setup failed - cannot run integration tests');
    }
  }, 30000); // 30 second timeout for auth setup

  afterAll(async () => {
    // Cleanup if needed
  });

  describe('Authentication Chain', () => {
    it('should successfully obtain Firebase ID token', async () => {
      const token = await authBridge.getFirebaseToken();
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(100); // JWT tokens are typically long
    });

    it('should have valid Auth0 → Firebase token exchange', async () => {
      const debugInfo = await authBridge.getDebugInfo();
      expect(debugInfo.auth0Token).toBeTruthy();
      expect(debugInfo.firebaseToken).toBeTruthy();
      expect(debugInfo.tokenCacheStatus).toBeDefined();
    });
  });

  describe('Firebase Functions Proxy Layer', () => {
    it('should route requests through Firebase Functions', async () => {
      // Mock fetch to capture the actual request URL
      const originalFetch = global.fetch;
      let capturedUrl: string = '';
      
      global.fetch = jest.fn().mockImplementation((url: string, options: any) => {
        capturedUrl = url;
        return originalFetch(url, options);
      });

      try {
        await tebraTestConnection();
        expect(capturedUrl).toContain('api-xccvzgogwa-uc.a.run.app/api/tebra');
        expect(capturedUrl).not.toContain('tebra-php-api-');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should include Firebase ID token in requests', async () => {
      const originalFetch = global.fetch;
      let capturedHeaders: any = {};
      
      global.fetch = jest.fn().mockImplementation((url: string, options: any) => {
        capturedHeaders = options.headers;
        return originalFetch(url, options);
      });

      try {
        await tebraTestConnection();
        expect(capturedHeaders.Authorization).toContain('Bearer ');
        expect(capturedHeaders['Content-Type']).toBe('application/json');
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe('Tebra API Integration', () => {
    it('should successfully test connection through the proxy chain', async () => {
      const result = await tebraTestConnection();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
    }, 15000); // 15 second timeout for API calls

    it('should successfully retrieve providers list', async () => {
      const result = await tebraGetProviders();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      if (result.success && result.data) {
        // Verify the structure contains expected Tebra response
        expect(result.data).toHaveProperty('SecurityResponse');
        expect(result.data.SecurityResponse).toHaveProperty('Authenticated');
        expect(result.data.SecurityResponse.Authenticated).toBe(true);
      }
    }, 15000);

    it('should successfully retrieve appointments for a known date', async () => {
      // Test with June 24, 2025 which should have 4 appointments
      const result = await tebraGetAppointments({
        fromDate: '2025-06-24',
        toDate: '2025-06-24'
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      if (result.success && result.data) {
        expect(result.data).toHaveProperty('SecurityResponse');
        expect(result.data.SecurityResponse.Authenticated).toBe(true);
        
        // Should have appointments array
        expect(result.data).toHaveProperty('Appointments');
        if (result.data.Appointments) {
          expect(Array.isArray(result.data.Appointments)).toBe(true);
          expect(result.data.Appointments.length).toBeGreaterThan(0);
        }
      }
    }, 20000); // 20 second timeout for appointment queries
  });

  describe('Error Handling', () => {
    it('should handle invalid date formats gracefully', async () => {
      const result = await tebraGetAppointments({
        fromDate: 'invalid-date',
        toDate: '2025-06-24'
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
    });

    it('should handle authentication errors gracefully', async () => {
      // Temporarily break authentication by clearing the token
      const originalGetToken = authBridge.getFirebaseToken;
      authBridge.getFirebaseToken = jest.fn().mockRejectedValue(new Error('Mock auth failure'));

      try {
        const result = await tebraTestConnection();
        expect(result.success).toBe(false);
        expect(result.error).toContain('Firebase authentication');
      } finally {
        authBridge.getFirebaseToken = originalGetToken;
      }
    });
  });

  describe('Performance and Reliability', () => {
    it('should complete requests within reasonable time limits', async () => {
      const start = Date.now();
      const result = await tebraTestConnection();
      const duration = Date.now() - start;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle concurrent requests properly', async () => {
      const promises = [
        tebraTestConnection(),
        tebraGetProviders(),
        tebraTestConnection()
      ];
      
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Data Validation', () => {
    it('should return properly structured responses', async () => {
      const result = await tebraGetProviders();
      
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        expect(result).toHaveProperty('data');
        expect(result.data).toBeDefined();
      } else {
        expect(result).toHaveProperty('error');
        expect(typeof result.error).toBe('string');
      }
    });

    it('should include timestamps in responses', async () => {
      const result = await tebraTestConnection();
      
      if (result.success) {
        expect(result).toHaveProperty('timestamp');
        expect(typeof result.timestamp).toBe('string');
        
        // Verify timestamp is recent (within last minute)
        const timestamp = new Date(result.timestamp!);
        const now = new Date();
        const diffMs = now.getTime() - timestamp.getTime();
        expect(diffMs).toBeLessThan(60000); // Less than 1 minute old
      }
    });
  });

  describe('Security Compliance', () => {
    it('should not expose sensitive data in error messages', async () => {
      // Force an error and check that no credentials are exposed
      const result = await tebraGetAppointments({
        fromDate: 'invalid-date',
        toDate: '2025-06-24'
      });
      
      if (!result.success && result.error) {
        expect(result.error).not.toContain('password');
        expect(result.error).not.toContain('secret');
        expect(result.error).not.toContain('key');
        expect(result.error).not.toContain('@luknerclinic.com');
      }
    });

    it('should use HTTPS for all requests', async () => {
      const originalFetch = global.fetch;
      let capturedUrl: string = '';
      
      global.fetch = jest.fn().mockImplementation((url: string, options: any) => {
        capturedUrl = url;
        return originalFetch(url, options);
      });

      try {
        await tebraTestConnection();
        expect(capturedUrl).toStartWith('https://');
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});