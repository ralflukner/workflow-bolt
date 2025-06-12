// Environment Variables Constants
// This module centralizes access to environment variables for better testability and maintainability

// Helper function to safely access environment variables
export const getEnvVar = (key: string, fallback: string = ''): string => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const importMeta = (globalThis as any).import?.meta || import.meta;
    if (importMeta?.env) {
      return importMeta.env[key] || fallback;
    }
  } catch {
    // Silently fall back in case import.meta is not available (e.g., in tests)
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