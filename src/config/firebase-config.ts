import { secretsService } from '../services/secretsService';

/**
 * Get Firebase configuration from environment variables (fallback)
 * Note: Firebase config is generally not sensitive, but this pattern 
 * allows for secret manager integration if needed in the future
 */
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

/**
 * Get Firebase configuration with secrets manager support
 * For server-side environments where Secret Manager is available
 */
export async function getFirebaseConfigAsync() {
  try {
    // Try to get from secrets manager if available (server-side)
    if (typeof window === 'undefined') {
      const apiKey = await secretsService.getSecret('FIREBASE_API_KEY').catch(() => null);
      if (apiKey) {
        return {
          ...firebaseConfig,
          apiKey
        };
      }
    }
  } catch (error) {
    console.warn('Could not retrieve Firebase config from Secret Manager, using environment variables:', error);
  }
  
  return firebaseConfig;
} 