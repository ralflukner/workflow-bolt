// Test Auth0 token audience issue
import { useAuth0 } from '@auth0/auth0-react';

export const useTestAuth0Audience = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  
  const testTokenAudience = async () => {
    try {
      console.log('🔍 Testing Auth0 token audience...');
      
      if (!isAuthenticated) {
        console.log('❌ User not authenticated with Auth0');
        return;
      }
      
      // Get token with explicit audience
      const tokenWithAudience = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://api.patientflow.com',
          scope: 'openid profile email'
        }
      });
      
      console.log('✅ Got token with explicit audience');
      
      // Decode and check
      const parts = tokenWithAudience.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        console.log('📋 Token with explicit audience:');
        console.log('  Audience (aud):', payload.aud);
        console.log('  Issuer (iss):', payload.iss);
        console.log('  Subject (sub):', payload.sub);
        
        if (payload.aud === 'https://api.patientflow.com') {
          console.log('✅ Explicit audience token has correct audience!');
          console.log('🔧 Try calling Firebase Function with this token');
          return tokenWithAudience;
        } else {
          console.error('❌ Even explicit audience token has wrong audience:', payload.aud);
        }
      }
      
    } catch (error) {
      console.error('❌ Error getting token with explicit audience:', error);
      
      // Fallback: try getting token without explicit audience
      try {
        console.log('🔄 Trying to get token without explicit audience...');
        const defaultToken = await getAccessTokenSilently();
        
        const parts = defaultToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          console.log('📋 Default token:');
          console.log('  Audience (aud):', payload.aud);
          console.log('  This might be why Firebase Function rejects it');
        }
      } catch (fallbackError) {
        console.error('❌ Fallback token request also failed:', fallbackError);
      }
    }
  };
  
  return { testTokenAudience };
};

// Standalone function for testing Auth0 audience without hooks
export const testAuth0AudienceStandalone = () => {
  console.log('🔍 Testing Auth0 audience configuration...');
  console.log('📋 Expected audience:', 'https://api.patientflow.com');
  console.log('📋 Frontend config audience:', import.meta.env.VITE_AUTH0_AUDIENCE);
  console.log('📋 Domain:', import.meta.env.VITE_AUTH0_DOMAIN);
  console.log('📋 Client ID:', import.meta.env.VITE_AUTH0_CLIENT_ID);
  
  if (import.meta.env.VITE_AUTH0_AUDIENCE === 'https://api.patientflow.com') {
    console.log('✅ Auth0 audience configuration is correct');
  } else {
    console.log('❌ Auth0 audience mismatch!');
  }
};

// Export for browser console
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).testAuth0Audience = testAuth0AudienceStandalone;
}