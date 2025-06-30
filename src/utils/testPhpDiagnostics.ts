/**
 * Test function for PHP proxy diagnostics
 * Call this from browser console: testPhpDiagnostics()
 */
import { tebraApiService } from '../services/tebraApiService';

declare global {
  interface Window {
    testPhpDiagnostics: () => Promise<any>;
  }
}

export const testPhpDiagnostics = async () => {
  console.log('🔧 Testing PHP proxy diagnostics...');
  
  try {
    const result = await tebraApiService.debugPhpProxy();
    console.log('✅ PHP proxy diagnostics completed:', result);
    return result;
  } catch (error) {
    console.error('❌ PHP proxy diagnostics failed:', error);
    throw error;
  }
};

// Make it available globally for browser console testing
if (typeof window !== 'undefined') {
  window.testPhpDiagnostics = testPhpDiagnostics;
}

export default testPhpDiagnostics;