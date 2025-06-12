import { describe, it, expect, beforeEach } from '@jest/globals';
import { TebraApiService } from '../../services/tebraApiService';

/**
 * REAL API INTEGRATION TESTS
 * 
 * These tests are designed to FAIL when the Tebra API is unreachable.
 * They serve as diagnostic checks and monitoring tools.
 * 
 * Run with: RUN_REAL_API_TESTS=true npm test
 */
describe('🚨 REAL Tebra API Integration Tests (Expected to FAIL when API is down)', () => {
  let tebraService: TebraApiService;

  beforeEach(() => {
    tebraService = new TebraApiService();
    console.log('🔍 Testing REAL Tebra API - These tests may fail if API is unreachable');
  });

  describe('Connection Diagnostics', () => {
    it('should successfully connect to Tebra API (WILL FAIL if API is down)', async () => {
      console.log('🧪 Testing actual Tebra API connection...');
      
      // This test calls the ACTUAL Tebra API via Firebase Functions
      const result = await tebraService.testConnection();
      
      if (!result) {
        console.error('❌ Tebra API connection failed - this explains the "Disconnected" status in UI');
        console.log('💡 This is expected behavior when the API is unreachable');
      } else {
        console.log('✅ Tebra API connection successful');
      }
      
      // This assertion will FAIL when API is down (which is intentional)
      expect(result).toBe(true);
    }, 15000); // 15 second timeout

    it('should retrieve providers from Tebra API (WILL FAIL if API is down)', async () => {
      console.log('🧪 Testing provider retrieval from actual Tebra API...');
      
      // This test calls the ACTUAL Tebra API
      const providers = await tebraService.getProviders();
      
      if (!Array.isArray(providers) || providers.length === 0) {
        console.error('❌ Provider retrieval failed - API may be unreachable');
      } else {
        console.log(`✅ Retrieved ${providers.length} providers from Tebra API`);
      }
      
      // These assertions will FAIL if Tebra is disconnected
      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBeGreaterThan(0);
    }, 15000);

    it('should handle patient search from Tebra API (WILL FAIL if API is down)', async () => {
      console.log('🧪 Testing patient search on actual Tebra API...');
      
      // This test calls the ACTUAL Tebra API
      const searchCriteria = { lastName: 'Test' };
      const patients = await tebraService.searchPatients(searchCriteria);
      
      // Even if no patients found, the API should return an array
      expect(Array.isArray(patients)).toBe(true);
      
      console.log(`🔍 Patient search returned ${patients.length} results`);
    }, 15000);
  });

  describe('API Response Structure Validation', () => {
    it('should return valid response structure even when connection fails', async () => {
      try {
        const result = await tebraService.testConnection();
        
        // Response should always be a boolean
        expect(typeof result).toBe('boolean');
        
        if (!result) {
          console.warn('⚠️ Connection test returned false - matches UI "Disconnected" status');
          console.log('📊 This provides diagnostic information about API availability');
        }
        
        // This will fail when API is down (diagnostic behavior)
        expect(result).toBe(true);
      } catch (error) {
        console.error('💥 Connection test threw error:', error);
        // Re-throw to fail the test (expected when API is completely unreachable)
        throw new Error(`API connection completely failed: ${error}`);
      }
    }, 20000);
  });

  describe('Diagnostic Information Collection', () => {
    it('should collect comprehensive diagnostic data when API fails', async () => {
      console.log('🔧 Collecting diagnostic information...');
      
      const diagnostics = {
        connectionTest: false,
        providersAvailable: false,
        patientsSearchable: false,
        timestamp: new Date().toISOString()
      };

      try {
        // Test connection
        diagnostics.connectionTest = await tebraService.testConnection();
        console.log(`Connection test: ${diagnostics.connectionTest ? '✅ PASS' : '❌ FAIL'}`);

        // Test providers
        const providers = await tebraService.getProviders();
        diagnostics.providersAvailable = Array.isArray(providers) && providers.length > 0;
        console.log(`Providers available: ${diagnostics.providersAvailable ? '✅ PASS' : '❌ FAIL'}`);

        // Test patient search
        const patients = await tebraService.searchPatients({ lastName: 'Test' });
        diagnostics.patientsSearchable = Array.isArray(patients);
        console.log(`Patient search: ${diagnostics.patientsSearchable ? '✅ PASS' : '❌ FAIL'}`);

      } catch (error) {
        console.error('❌ Diagnostic collection failed:', error);
      }

      // Log comprehensive diagnostic report
      console.log('📋 DIAGNOSTIC REPORT:', JSON.stringify(diagnostics, null, 2));

      // Test passes only if ALL diagnostics are successful
      const allPassed = diagnostics.connectionTest && 
                       diagnostics.providersAvailable && 
                       diagnostics.patientsSearchable;

      if (!allPassed) {
        console.log('🎯 EXPECTED BEHAVIOR: Some or all tests failed due to API unavailability');
        console.log('💡 This explains why the UI shows "Disconnected" status');
      }

      expect(allPassed).toBe(true);
    }, 30000); // 30 second timeout for comprehensive testing
  });
}); 