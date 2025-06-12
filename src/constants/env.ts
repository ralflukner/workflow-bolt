// Environment Variables Constants
// This module centralizes access to environment variables for better testability and maintainability

// Helper function to safely access environment variables
export const getEnvVar = (key: string, fallback: string = ''): string => {
  try {
    // In test environment, use process.env if available
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || fallback;
    }
    
    // In browser environment with Vite, try to access import.meta.env
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof globalThis !== 'undefined' && (globalThis as any).import?.meta?.env) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (globalThis as any).import.meta.env[key] || fallback;
    }
    
    // Fallback for environments where import.meta is available directly (Vite dev)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).import?.meta?.env) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (window as any).import.meta.env[key] || fallback;
    }
    
  } catch (error) {
    // Silently fall back in case of any errors
    console.debug('Environment variable access failed:', error);
  }
  
  return fallback;
};

// Firebase Configuration
export const FIREBASE_CONFIG = {
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID'),
};

// Auth0 Configuration
export const AUTH0_CONFIG = {
  domain: getEnvVar('VITE_AUTH0_DOMAIN'),
  clientId: getEnvVar('VITE_AUTH0_CLIENT_ID'),
  redirectUri: getEnvVar('VITE_AUTH0_REDIRECT_URI') || (typeof window !== 'undefined' ? window.location.origin : ''),
  audience: getEnvVar('VITE_AUTH0_AUDIENCE'),
};

// Tebra API Configuration
export const TEBRA_CONFIG = {
  proxyApiKey: getEnvVar('VITE_TEBRA_PROXY_API_KEY'),
};

// Environment Info
export const ENV_INFO = {
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  isDev: getEnvVar('DEV') === 'true',
  isProd: getEnvVar('PROD') === 'true',
}; 