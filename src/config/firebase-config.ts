import { getEnvVar } from '../utils/envUtils';
import { secretsService } from '../services/secretsService';

/**
 * Default Firebase configuration - will be overridden by GSM values
 * These are public values and safe to include in code
 */
export const firebaseConfig = {
  apiKey: '', // Will be fetched from GSM
  authDomain: 'luknerlumina-firebase.firebaseapp.com',
  projectId: 'luknerlumina-firebase',
  storageBucket: 'luknerlumina-firebase.firebasestorage.app',
  messagingSenderId: '623450773640',
  appId: '1:623450773640:web:9afd63d3ccbb1fcb6fe73d',
  measurementId: 'G-W6TX8WRN2Z'
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