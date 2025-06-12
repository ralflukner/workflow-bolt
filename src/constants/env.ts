// Environment Variables Constants
// This module centralizes access to environment variables for better testability and maintainability

// Firebase Configuration
export const FIREBASE_CONFIG = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

// Auth0 Configuration
export const AUTH0_CONFIG = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || '',
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || '',
  redirectUri: import.meta.env.VITE_AUTH0_REDIRECT_URI || (typeof window !== 'undefined' ? window.location.origin : ''),
  audience: import.meta.env.VITE_AUTH0_AUDIENCE || '',
};

// Tebra API Configuration
export const TEBRA_CONFIG = {
  proxyApiKey: import.meta.env.VITE_TEBRA_PROXY_API_KEY || '',
};

// Environment Info
export const ENV_INFO = {
  nodeEnv: import.meta.env.NODE_ENV || 'development',
  isDev: import.meta.env.DEV === true,
  isProd: import.meta.env.PROD === true,
};

// Helper function to safely access environment variables
export const getEnvVar = (key: string, fallback: string = ''): string => {
  try {
    // @ts-ignore - import.meta is provided by Vite
    const importMeta = (globalThis as any).import?.meta || import.meta;
    if (importMeta?.env) {
      return importMeta.env[key] || fallback;
    }
  } catch (error) {
    // Silently fall back in case import.meta is not available (e.g., in tests)
  }
  return fallback;
}; 