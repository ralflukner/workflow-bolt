// Simple function to decode JWT token and check audience
export function decodeAuth0Token(token: string) {
  try {
    // JWT has 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('❌ Invalid JWT format');
      return null;
    }
    
    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    console.log('📋 Auth0 Token Analysis:');
    console.log('  Audience (aud):', payload.aud);
    console.log('  Issuer (iss):', payload.iss);
    console.log('  Subject (sub):', payload.sub);
    console.log('  Expires (exp):', new Date(payload.exp * 1000).toISOString());
    console.log('  Issued At (iat):', new Date(payload.iat * 1000).toISOString());
    console.log('  Authorized Party (azp):', payload.azp);
    console.log('  Scope:', payload.scope);
    
    // Check if audience matches expected value
    const expectedAudience = 'https://api.patientflow.com';
    if (payload.aud === expectedAudience) {
      console.log('✅ Token audience matches expected value');
    } else {
      console.error('❌ Token audience mismatch:');
      console.error('  Expected:', expectedAudience);
      console.error('  Actual:', payload.aud);
      console.error('  This is likely the cause of the 401 errors!');
    }
    
    return payload;
  } catch (error) {
    console.error('❌ Error decoding token:', error);
    return null;
  }
}

// Export for browser console
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).decodeAuth0Token = decodeAuth0Token;
  console.log('🔧 Token decoder available: decodeAuth0Token(token)');
} 