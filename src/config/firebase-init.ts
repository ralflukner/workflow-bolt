/**
 * Firebase initialization with GSM support
 * This fetches sensitive config from the backend before initializing Firebase
 */

interface FirebaseConfigType {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Configuration constants
const FIREBASE_CONFIG_ENDPOINT = import.meta.env.VITE_FIREBASE_CONFIG_ENDPOINT || 
  'https://us-central1-luknerlumina-firebase.cloudfunctions.net/getFirebaseConfig';

/**
 * Validate Firebase configuration completeness
 */
function validateFirebaseConfig(config: unknown): config is FirebaseConfigType {
  if (!config || typeof config !== 'object') {
    return false;
  }

  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];

  for (const field of requiredFields) {
    const record = config as Record<string, unknown>;
    if (!record[field] || typeof record[field] !== 'string' || (record[field] as string).trim() === '') {
      console.error(`Invalid or missing Firebase config field: ${field}`);
      return false;
    }
  }

  return true;
}

/**
 * Fetch Firebase configuration from backend
 */
async function fetchFirebaseConfigFromBackend(): Promise<FirebaseConfigType> {
  try {
    // Fetch from the configurable getFirebaseConfig endpoint
    const response = await fetch(FIREBASE_CONFIG_ENDPOINT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw Object.assign(
        new Error(`Failed to fetch Firebase config: ${response.status}`),
        { status: response.status }
      );
    }

    const responseData = await response.json();

    // Check if response has a data property (Firebase callable function wrapper)
    const config = responseData.data ? responseData.data : responseData;

    if (!validateFirebaseConfig(config)) {
      throw Object.assign(
        new Error('Invalid Firebase configuration received - missing required fields'),
        { type: 'VALIDATION_ERROR' }
      );
    }

    return config;
  } catch (error) {
    console.error('Failed to fetch Firebase config from backend:', error);
    // Fall back to environment variables if available
    if (import.meta.env?.VITE_FIREBASE_API_KEY) {
      console.warn('Using Firebase config from environment variables as fallback');
      const fallbackConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'luknerlumina-firebase.firebaseapp.com',
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'luknerlumina-firebase',
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'luknerlumina-firebase.firebasestorage.app',
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '623450773640',
        appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:623450773640:web:9afd63d3ccbb1fcb6fe73d',
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-W6TX8WRN2Z'
      };

      if (!validateFirebaseConfig(fallbackConfig)) {
        throw Object.assign(
          new Error('Invalid Firebase configuration in environment variables'),
          { type: 'FALLBACK_VALIDATION_ERROR' }
        );
      }

      return fallbackConfig;
    }
    throw error;
  }
}

/**
 * Get complete Firebase configuration
 */
export async function getFirebaseConfigWithGSM(): Promise<FirebaseConfigType> {
  try {
    return await fetchFirebaseConfigFromBackend();
  } catch (error) {
    console.error('Failed to get Firebase config:', error);
    throw error;
  }
}
