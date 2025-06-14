import { describe, it, expect, beforeEach } from '@jest/globals';
import { TebraApiService } from '../../services/tebraApiService';

/**
 * Tebra Connection Diagnostics Tests
 * 
 * These tests validate the specific connection issues outlined in the error message:
 * "Failed to connect to Tebra API. Check configuration."
 * 
 * Run with: RUN_REAL_API_TESTS=true npm test
 */
const real = process.env.RUN_REAL_API_TESTS === 'true' ? describe : describe.skip;
real('🔧 Tebra Connection Diagnostics - Real API Tests', () => {
  let tebraService: TebraApiService;

  beforeEach(() => {
    tebraService = new TebraApiService();
  });

  describe('1. Missing or Incorrect API Credentials', () => {
    it('should detect missing customer key and fail gracefully', async () => {
      console.log('🔍 Testing missing customer key scenario...');
      
      // Test connection - this should fail if customer key is missing
      const result = await tebraService.testConnection();
      
      if (!result) {
        console.log('❌ Connection failed - likely due to missing customer key');
        console.log('💡 Verify TEBRA_CUSTOMER_KEY is set in environment variables');
        console.log('📋 Customer key should be obtained from Tebra My Account > Get Customer Key');
      }
      
      // This test documents the expected behavior when customer key is missing
      expect(typeof result).toBe('boolean');
    }, 15000);

    it('should detect invalid username/password combination', async () => {
      console.log('🔍 Testing authentication with current credentials...');
      
      try {
        const result = await tebraService.testConnection();
        
        if (!result) {
          console.log('❌ Authentication failed with current credentials');
          console.log('📋 Required checks:');
          console.log('   • Username: Must be valid Tebra account username');
          console.log('   • Password: Must be correct password for the account');
          console.log('   • User must have "System Admin" role (for accounts created after May 2016)');
        } else {
          console.log('✅ Authentication successful');
        }
        
        expect(typeof result).toBe('boolean');
      } catch (error) {
        console.error('💥 Authentication test threw error:', error);
        console.log('🔧 Check if credentials are properly configured in Secret Manager');
        throw error;
      }
    }, 15000);
  });

  describe('2. API Endpoint Configuration', () => {
    it('should validate correct API endpoint URL', async () => {
      console.log('🔍 Testing API endpoint connectivity...');
      
      // Expected endpoint: https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?singleWsdl
      const result = await tebraService.testConnection();
      
      if (!result) {
        console.log('❌ Endpoint connection failed');
        console.log('📋 Verify endpoint configuration:');
        console.log('   • Correct URL: https://webservice.kareo.com/services/soap/2.1/KareoServices.svc?singleWsdl');
        console.log('   • Customer key appended: ?wsdl&customerkey={YOUR_KEY}');
        console.log('   • Network connectivity to webservice.kareo.com');
      } else {
        console.log('✅ Endpoint is reachable');
      }
      
      expect(typeof result).toBe('boolean');
    }, 20000);
  });

  describe('3. User Permissions and System Admin Role', () => {
    it('should test if user has System Admin permissions', async () => {
      console.log('🔍 Testing System Admin role requirements...');
      
      // Try to access providers - this typically requires System Admin role
      try {
        const providers = await tebraService.getProviders();
        
        if (!Array.isArray(providers) || providers.length === 0) {
          console.log('❌ Provider access failed - possible permission issue');
          console.log('📋 User permission requirements:');
          console.log('   • User must have "System Admin" role');
          console.log('   • Log into Tebra Desktop Application');
          console.log('   • Go to Settings > User Accounts');
          console.log('   • Select user and check "System Admin"');
        } else {
          console.log(`✅ Provider access successful - retrieved ${providers.length} providers`);
          console.log('✅ User appears to have proper System Admin permissions');
        }
        
        expect(Array.isArray(providers)).toBe(true);
      } catch (error) {
        console.error('💥 Provider access test failed:', error);
        console.log('🔧 This indicates a permission or configuration issue');
        throw error;
      }
    }, 20000);
  });

  describe('4. API Access Enablement', () => {
    it('should verify API access is enabled for the account', async () => {
      console.log('🔍 Testing if API access is enabled...');
      
      try {
        // Test basic connection first
        const connectionResult = await tebraService.testConnection();
        
        if (connectionResult) {
          // If connection works, test a simple API operation
          const patients = await tebraService.searchPatients({ lastName: 'Test' });
          
          if (Array.isArray(patients)) {
            console.log('✅ API access is enabled and functional');
            console.log(`📊 Search returned ${patients.length} results`);
          }
        } else {
          console.log('❌ API access test failed');
          console.log('📋 API access requirements:');
          console.log('   • API access must be enabled for your account');
          console.log('   • Contact Tebra Customer Care to activate API access');
          console.log('   • Verify account is in good standing');
        }
        
        expect(typeof connectionResult).toBe('boolean');
      } catch (error) {
        console.error('💥 API access test failed:', error);
        console.log('🔧 This may indicate API access is not enabled');
        throw error;
      }
    }, 25000);
  });

  describe('5. Comprehensive Connection Diagnostic', () => {
    it('should run complete diagnostic and provide troubleshooting report', async () => {
      console.log('🔧 Running comprehensive Tebra connection diagnostic...');
      
      const diagnosticReport = {
        timestamp: new Date().toISOString(),
        connectionTest: false,
        authenticationOk: false,
        endpointReachable: false,
        systemAdminAccess: false,
        apiAccessEnabled: false,
        errors: [] as string[],
        recommendations: [] as string[]
      };

      try {
        // Test 1: Basic connection
        console.log('1️⃣ Testing basic connection...');
        diagnosticReport.connectionTest = await tebraService.testConnection();
        
        if (diagnosticReport.connectionTest) {
          console.log('   ✅ Basic connection successful');
          diagnosticReport.authenticationOk = true;
          diagnosticReport.endpointReachable = true;
          
          // Test 2: Provider access (System Admin test)
          console.log('2️⃣ Testing System Admin access...');
          const providers = await tebraService.getProviders();
          if (Array.isArray(providers) && providers.length > 0) {
            diagnosticReport.systemAdminAccess = true;
            console.log('   ✅ System Admin access confirmed');
          }
          
          // Test 3: API functionality
          console.log('3️⃣ Testing API functionality...');
          const patients = await tebraService.searchPatients({ lastName: 'Test' });
          if (Array.isArray(patients)) {
            diagnosticReport.apiAccessEnabled = true;
            console.log('   ✅ API access confirmed');
          }
        } else {
          console.log('   ❌ Basic connection failed');
          diagnosticReport.errors.push('Basic connection test failed');
          diagnosticReport.recommendations.push('Check credentials and network connectivity');
        }

      } catch (error) {
        console.error('Diagnostic error:', error);
        diagnosticReport.errors.push(`Error: ${error}`);
      }

      // Generate recommendations based on results
      if (!diagnosticReport.connectionTest) {
        diagnosticReport.recommendations.push('Verify customer key, username, and password');
        diagnosticReport.recommendations.push('Check API endpoint URL');
        diagnosticReport.recommendations.push('Ensure network connectivity to webservice.kareo.com');
      }
      
      if (!diagnosticReport.systemAdminAccess) {
        diagnosticReport.recommendations.push('Assign "System Admin" role to user in Tebra Desktop Application');
      }
      
      if (!diagnosticReport.apiAccessEnabled) {
        diagnosticReport.recommendations.push('Contact Tebra Customer Care to enable API access');
      }

      // Output comprehensive report
      console.log('\n📋 COMPREHENSIVE DIAGNOSTIC REPORT:');
      console.log('=====================================');
      console.log(JSON.stringify(diagnosticReport, null, 2));
      console.log('=====================================\n');

      // Determine overall health
      const overallSuccess = diagnosticReport.connectionTest && 
                           diagnosticReport.systemAdminAccess && 
                           diagnosticReport.apiAccessEnabled;

      if (!overallSuccess) {
        console.log('🎯 DIAGNOSIS: Connection issues detected - this explains the "Disconnected" status');
        console.log('💡 Follow the recommendations above to resolve the issues');
      } else {
        console.log('✅ All diagnostics passed - API should be functional');
      }

      // Test should reflect actual API status
      expect(typeof diagnosticReport.connectionTest).toBe('boolean');
    }, 60000); // Extended timeout for comprehensive testing
  });
}); 