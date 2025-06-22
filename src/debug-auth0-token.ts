import { useAuth0 } from '@auth0/auth0-react';

export const useDebugAuth0Token = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  
  const debugAuth0Token = async () => {
    try {
      console.log('🔍 Debugging Auth0 token...');
      
      if (!isAuthenticated) {
        console.log('❌ User not authenticated with Auth0');
        return;
      }
      
      // Get the token
      const token = await getAccessTokenSilently();
      console.log('✅ Auth0 token obtained');
      
      // Decode the token (JWT has 3 parts separated by dots)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('❌ Invalid JWT format');
        return;
      }
      
      // Decode the payload (second part)
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      
      console.log('📋 Token payload:', {
        aud: payload.aud,
        iss: payload.iss,
        sub: payload.sub,
        exp: new Date(payload.exp * 1000).toISOString(),
        iat: new Date(payload.iat * 1000).toISOString(),
        azp: payload.azp,
        scope: payload.scope
      });
      
      // Check if audience matches expected value
      const expectedAudience = 'https://api.patientflow.com';
      if (payload.aud === expectedAudience) {
        console.log('✅ Token audience matches expected value');
      } else {
        console.error('❌ Token audience mismatch:', {
          expected: expectedAudience,
          actual: payload.aud
        });
      }
      
    } catch (error) {
      console.error('❌ Error debugging Auth0 token:', error);
    }
  };
  
  return { debugAuth0Token };
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).debugAuth0Token = () => {
    console.error('❌ debugAuth0Token must be called from within a React component');
    console.log('💡 Use the useDebugAuth0Token hook instead');
  };
} 