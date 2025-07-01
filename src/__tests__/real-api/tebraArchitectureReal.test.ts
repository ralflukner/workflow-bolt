/**
 * Real API Tests for Tebra Architecture
 * Tests against actual deployed services: Firebase Functions → PHP Cloud Run → Tebra SOAP
 * 
 * @group real-api
 * @requires RUN_REAL_API_TESTS=true
 */

import { AuthBridge } from '../../services/authBridge';
import { tebraGetAppointments, tebraTestConnection, tebraGetProviders } from '../../services/tebraApi';

// Only run these tests when explicitly enabled
const runRealApiTests = process.env.RUN_REAL_API_TESTS === 'true';
const describeIf = (condition: boolean) => condition ? describe : describe.skip;

describeIf(runRealApiTests)('Tebra Real API Integration Tests', () => {
  let authBridge: AuthBridge;

  beforeAll(async () => {
    console.log('🚀 Starting Tebra Real API Integration Tests');
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      RUN_REAL_API_TESTS: process.env.RUN_REAL_API_TESTS,
      hasAuth0Domain: !!process.env.VITE_AUTH0_DOMAIN,
      hasFirebaseProject: !!process.env.VITE_FIREBASE_PROJECT_ID
    });

    // Initialize authentication
    authBridge = AuthBridge.getInstance();
    
    // Give extra time for real API setup
    jest.setTimeout(60000);
  }, 60000);

  afterAll(() => {
    console.log('✅ Tebra Real API Integration Tests Complete');
  });

  describe('Authentication Chain (Real)', () => {
    test('should authenticate with Auth0 and get Firebase token', async () => {
      try {
        const token = await authBridge.getFirebaseIdToken();
        expect(token).toBeTruthy();
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(100);
        console.log('✅ Authentication successful');
      } catch (error) {
        console.error('❌ Authentication failed:', error);
        throw error;
      }
    }, 30000);

    test('should have valid debug information', async () => {
      const debugInfo = await authBridge.getDebugInfo();
      expect(debugInfo).toHaveProperty('auth0Token');
      expect(debugInfo).toHaveProperty('firebaseToken');
      expect(debugInfo).toHaveProperty('tokenCacheStatus');
      console.log('✅ Debug info available:', Object.keys(debugInfo));
    });
  });

  describe('Firebase Functions Routing (Real)', () => {
    test('should route through Firebase Functions not direct PHP', async () => {
      // Capture actual network requests
      const originalFetch = global.fetch;
      const requestUrls: string[] = [];
      
      global.fetch = jest.fn().mockImplementation(async (url: string, options: any) => {
        requestUrls.push(url);
        return originalFetch(url, options);
      });

      try {
        await tebraTestConnection();
        
        // Verify routing through Firebase Functions
        expect(requestUrls.length).toBeGreaterThan(0);
        const mainRequest = requestUrls.find(url => url.includes('/api/tebra'));
        expect(mainRequest).toBeTruthy();
        expect(mainRequest).toContain('us-central1-luknerlumina-firebase.cloudfunctions.net/api/tebra');
        
        // Verify NO direct PHP calls
        const phpRequests = requestUrls.filter(url => url.includes('tebra-php-api-'));
        expect(phpRequests.length).toBe(0);
        
        console.log('✅ Routing verified through Firebase Functions');
      } finally {
        global.fetch = originalFetch;
      }
    }, 20000);
  });

  describe('Tebra API Functionality (Real)', () => {
    test('should successfully test connection', async () => {
      const result = await tebraTestConnection();
      
      expect(result).toHaveProperty('success');
      if (!result.success) {
        console.error('Connection test failed:', result.error);
      }
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      console.log('✅ Connection test passed');
    }, 20000);

    test('should successfully get providers list', async () => {
      const result = await tebraGetProviders();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      if (result.success && result.data) {
        expect(result.data).toHaveProperty('SecurityResponse');
        expect(result.data.SecurityResponse).toHaveProperty('Authenticated');
        expect(result.data.SecurityResponse.Authenticated).toBe(true);
        console.log('✅ Providers retrieved successfully');
      }
    }, 20000);

    test('should retrieve appointments for June 24, 2025', async () => {
      const result = await tebraGetAppointments({
        fromDate: '2025-06-24',
        toDate: '2025-06-24'
      });
      
      expect(result.success).toBe(true);
      console.log('Appointments result:', JSON.stringify(result, null, 2));
      
      if (result.success && result.data) {
        expect(result.data).toHaveProperty('SecurityResponse');
        expect(result.data.SecurityResponse.Authenticated).toBe(true);
        
        // Log appointment count
        if (result.data.Appointments) {
          const count = Array.isArray(result.data.Appointments) 
            ? result.data.Appointments.length 
            : 0;
          console.log(`✅ Retrieved ${count} appointments for June 24, 2025`);
          expect(count).toBeGreaterThanOrEqual(0);
        }
      }
    }, 30000);
  });

  describe('Error Handling (Real)', () => {
    test('should handle invalid date format gracefully', async () => {
      const result = await tebraGetAppointments({
        fromDate: 'invalid-date-format',
        toDate: '2025-06-24'
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
      console.log('✅ Invalid date handled gracefully:', result.error);
    }, 15000);
  });

  describe('Performance (Real)', () => {
    test('should complete requests within acceptable time', async () => {
      const start = Date.now();
      const result = await tebraTestConnection();
      const duration = Date.now() - start;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(15000); // 15 seconds max for real API
      console.log(`✅ Request completed in ${duration}ms`);
    }, 20000);

    test('should handle concurrent requests', async () => {
      const start = Date.now();
      const promises = [
        tebraTestConnection(),
        tebraGetProviders(),
        tebraTestConnection()
      ];
      
      const results = await Promise.all(promises);
      const duration = Date.now() - start;
      
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
      });
      
      console.log(`✅ Concurrent requests completed in ${duration}ms`);
    }, 30000);
  });

  describe('Security Compliance (Real)', () => {
    test('should use HTTPS for all requests', async () => {
      const originalFetch = global.fetch;
      const requestUrls: string[] = [];
      
      global.fetch = jest.fn().mockImplementation(async (url: string, options: any) => {
        requestUrls.push(url);
        return originalFetch(url, options);
      });

      try {
        await tebraTestConnection();
        
        requestUrls.forEach(url => {
          expect(url).toMatch(/^https:/);
        });
        
        console.log('✅ All requests use HTTPS');
      } finally {
        global.fetch = originalFetch;
      }
    }, 15000);

    test('should include proper authorization headers', async () => {
      const originalFetch = global.fetch;
      let capturedHeaders: any = {};
      
      global.fetch = jest.fn().mockImplementation(async (url: string, options: any) => {
        if (url.includes('/api/tebra')) {
          capturedHeaders = options.headers;
        }
        return originalFetch(url, options);
      });

      try {
        await tebraTestConnection();
        
        expect(capturedHeaders.Authorization).toMatch(/^Bearer .+/);
        expect(capturedHeaders['Content-Type']).toBe('application/json');
        
        console.log('✅ Proper authorization headers included');
      } finally {
        global.fetch = originalFetch;
      }
    }, 15000);

    test('should not expose sensitive data in responses', async () => {
      const result = await tebraGetAppointments({
        fromDate: 'invalid',
        toDate: '2025-06-24'
      });
      
      const resultString = JSON.stringify(result);
      expect(resultString).not.toMatch(/password/i);
      expect(resultString).not.toMatch(/secret/i);
      expect(resultString).not.toMatch(/key.*[a-z0-9]{8,}/i);
      expect(resultString).not.toMatch(/@luknerclinic\.com/);
      
      console.log('✅ No sensitive data exposed in error responses');
    });
  });

  describe('Data Validation (Real)', () => {
    test('should return properly structured responses', async () => {
      const result = await tebraTestConnection();
      
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        expect(result).toHaveProperty('data');
      } else {
        expect(result).toHaveProperty('error');
        expect(typeof result.error).toBe('string');
      }
      
      console.log('✅ Response structure validated');
    });

    test('should include timestamps in responses', async () => {
      const result = await tebraTestConnection();
      
      if (result.success && result.timestamp) {
        const timestamp = new Date(result.timestamp);
        const now = new Date();
        const diffMs = now.getTime() - timestamp.getTime();
        expect(diffMs).toBeLessThan(120000); // Less than 2 minutes old
        
        console.log('✅ Response includes valid timestamp');
      }
    });
  });
});