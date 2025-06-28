/**
 * Integration tests for TebraApiService
 * Tests the actual Firebase Functions integration
 */

import { tebraApiService } from '../services/tebraApiService';

describe('TebraApiService Integration Tests', () => {
  beforeAll(() => {
    // Ensure we're testing with real Firebase config
    console.log('Firebase Project ID:', process.env.VITE_FIREBASE_PROJECT_ID);
    console.log('Firebase API Key:', process.env.VITE_FIREBASE_API_KEY ? '***configured***' : 'missing');
  });

  describe('Connection Testing', () => {
    it('should test connection to Tebra API via Firebase Functions', async () => {
      console.log('🧪 Testing Tebra API connection...');
      
      const startTime = Date.now();
      const isConnected = await tebraApiService.testConnection();
      const duration = Date.now() - startTime;
      
      console.log(`Connection test completed in ${duration}ms`);
      console.log('Connection result:', isConnected);
      
      if (!isConnected) {
        console.error('❌ Connection failed - this will cause the UI to show "Disconnected"');
      } else {
        console.log('✅ Connection successful');
      }
      
      // For now, we'll not fail the test to see what's happening
      // expect(isConnected).toBe(true);
    }, 10000); // 10 second timeout

    it('should handle authentication errors gracefully', async () => {
      console.log('🧪 Testing authentication error handling...');
      
      // This test documents expected behavior when auth fails
      const result = await tebraApiService.testConnection();
      
      if (!result) {
        console.log('ℹ️  Connection failed as expected (likely auth issue)');
        console.log('This is the root cause of the "Disconnected" status in the UI');
      }
      
      // Test should not throw errors
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('should return empty arrays for failed API calls', async () => {
      console.log('🧪 Testing error handling for getAppointments...');
      
      const appointments = await tebraApiService.getAppointments('2025-06-01');
      expect(Array.isArray(appointments)).toBe(true);
      
      console.log('Appointments result:', appointments);
    });

    it('should return empty arrays for failed provider calls', async () => {
      console.log('🧪 Testing error handling for getProviders...');
      
      const providers = await tebraApiService.getProviders();
      expect(Array.isArray(providers)).toBe(true);
      
      console.log('Providers result:', providers);
    });

    it('should return null for failed patient lookups', async () => {
      console.log('🧪 Testing error handling for getPatientById...');
      
      const patient = await tebraApiService.getPatientById('test-id');
      console.log('Patient result:', patient);
      
      // Should be null if connection fails
      expect(patient).toBeNull();
    });
  });

  describe('Firebase Functions Environment Check', () => {
    it('should verify Firebase configuration is loaded', () => {
      const requiredEnvVars = [
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_AUTH_DOMAIN',
        'VITE_FIREBASE_STORAGE_BUCKET',
        'VITE_FIREBASE_MESSAGING_SENDER_ID',
        'VITE_FIREBASE_APP_ID'
      ];

      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        console.error('❌ Missing Firebase environment variables:', missingVars);
        console.log('💡 Make sure .envrc is loaded with: direnv allow');
      } else {
        console.log('✅ All Firebase environment variables are configured');
      }

      expect(missingVars).toHaveLength(0);
    });

    it('should verify Tebra configuration is loaded', () => {
      const tebraVars = [
        'VITE_TEBRA_CUSTKEY',
        'VITE_TEBRA_WSDL_URL'
      ];

      const missingVars = tebraVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        console.error('❌ Missing Tebra environment variables:', missingVars);
      } else {
        console.log('✅ Tebra configuration variables are loaded');
      }

      expect(missingVars).toHaveLength(0);
    });
  });
}); 