/**
 * Utility to safely access environment variables in both Vite and Jest environments
 */

/**
 * Get environment variable value that works in both Vite and Jest
 */
export const getEnvVar = (name: string): string | undefined => {
  // In Jest/Node environment, use process.env
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
    return process.env[name];
  }

  // In browser/Vite environment, use import.meta.env
  if (typeof window !== 'undefined') {
    try {
      // Access import.meta.env directly
      const value = (import.meta as { env: Record<string, string> }).env[name];
      console.log(`getEnvVar(${name}):`, value); // Debug logging
      return value;
    } catch (error) {
      console.error(`Error accessing import.meta.env.${name}:`, error);
    }
  }

  return undefined;
};

/**
 * Check if all required Firebase environment variables are present
 */
export const checkFirebaseEnvVars = (): { loaded: string[]; missing: string[] } => {
  const requiredVars = [
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  console.log('Checking Firebase env vars...'); // Debug logging

  const loaded = requiredVars.filter(varName => {
    const value = getEnvVar(varName);
    return value && value !== 'undefined';
  });

  const missing = requiredVars.filter(varName => {
    const value = getEnvVar(varName);
    return !value || value === 'undefined';
  });

  console.log('Firebase env vars - loaded:', loaded, 'missing:', missing); // Debug logging

  return { loaded, missing };
}; 