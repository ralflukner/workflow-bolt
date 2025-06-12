/**
 * Utility to safely access environment variables in both Vite and Jest environments
 */

// Type for globalThis extensions
interface GlobalThis {
  import?: {
    meta?: {
      env?: Record<string, string>;
    };
  };
  __VITE_ENV__?: Record<string, string>;
}

/**
 * Get environment variable value that works in both Vite and Jest
 */
export const getEnvVar = (name: string): string | undefined => {
  // In Jest/Node environment or when window is undefined, use process.env
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.NODE_ENV === 'test' || typeof window === 'undefined') {
      return process.env[name];
    }
  }

  // In Vite environment, use import.meta.env directly
  try {
    if (import.meta && import.meta.env) {
      const value = import.meta.env[name];
      console.log(`getEnvVar(${name}):`, value); // Debug logging
      return value;
    }
  } catch (error) {
    // Fallback for environments where import.meta is not available
    console.log(`Could not access import.meta.env for ${name}:`, error);
  }

  // In browser environment, try various methods to get environment variables
  if (typeof window !== 'undefined') {
    try {
      // Try to access via globalThis extensions
      const globalThisTyped = globalThis as GlobalThis;
      
      // Try custom Vite env object
      const viteEnv = globalThisTyped.__VITE_ENV__;
      if (viteEnv) {
        return viteEnv[name];
      }
    } catch (error) {
      console.error(`Error accessing environment variable ${name}:`, error);
    }
  }

  // Final fallback to process.env
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name];
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