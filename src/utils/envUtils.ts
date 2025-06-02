/**
 * Utility to safely access environment variables in both Vite and Jest environments
 */

// Type guard to check if we're in a browser/Vite environment
const isViteEnvironment = (): boolean => {
  try {
    // This will throw in Jest, return false
    return typeof window !== 'undefined' && 
           typeof document !== 'undefined' && 
           'importMap' in document.createElement('script');
  } catch {
    return false;
  }
};

/**
 * Get environment variable value that works in both Vite and Jest
 */
export const getEnvVar = (name: string): string | undefined => {
  // In Jest/Node environment, use process.env
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name];
  }

  // In Vite environment, use import.meta.env if available
  if (isViteEnvironment()) {
    try {
      // This will be replaced by Vite at build time
      const viteEnv = (globalThis as typeof globalThis & { import?: { meta?: { env?: Record<string, string> } } }).import?.meta?.env;
      if (viteEnv) {
        return viteEnv[name];
      }
      // Fallback for runtime access
      return (window as typeof window & { import?: { meta?: { env?: Record<string, string> } } }).import?.meta?.env?.[name];
    } catch {
      // Fall through to undefined
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

  const loaded = requiredVars.filter(varName => {
    const value = getEnvVar(varName);
    return value && value !== 'undefined';
  });

  const missing = requiredVars.filter(varName => {
    const value = getEnvVar(varName);
    return !value || value === 'undefined';
  });

  return { loaded, missing };
}; 