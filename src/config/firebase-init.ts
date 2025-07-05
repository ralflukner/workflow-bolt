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
    console.error('[Instrumentation] Config is not an object or is falsy:', config);
    return false;
  }

  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];

  for (const field of requiredFields) {
    const record = config as Record<string, unknown>;
    if (!record[field] || typeof record[field] !== 'string' || (record[field] as string).trim() === '') {
      console.error(`[Instrumentation] Invalid or missing Firebase config field: ${field}`);
      return false;
    }
  }

  return true;
}

/**
 * Get Firebase configuration from environment variables (primary method)
 */
function getFirebaseConfigFromEnv(): FirebaseConfigType | null {
  if (!import.meta.env?.VITE_FIREBASE_API_KEY) {
    return null;
  }

  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:
      import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
      'luknerlumina-firebase.firebaseapp.com',
    projectId:
      import.meta.env.VITE_FIREBASE_PROJECT_ID || 'luknerlumina-firebase',
    storageBucket:
      import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
      'luknerlumina-firebase.firebasestorage.app',
    messagingSenderId:
      import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '623450773640',
    appId:
      import.meta.env.VITE_FIREBASE_APP_ID ||
      '1:623450773640:web:9afd63d3ccbb1fcb6fe73d',
    measurementId:
      import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-W6TX8WRN2Z'
  };

  if (validateFirebaseConfig(envConfig)) {
    return envConfig;
  }

  return null;
}

/**
 * Fetch Firebase configuration from backend (fallback method)
 */
async function fetchFirebaseConfigFromBackend(): Promise<FirebaseConfigType> {
  const FETCH_TIMEOUT = 5000; // Reduced to 5 seconds

  try {
    console.log('[Instrumentation] Attempting backend config fetch (fallback):', FIREBASE_CONFIG_ENDPOINT);
    // Fetch from the configurable getFirebaseConfig endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(FIREBASE_CONFIG_ENDPOINT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('[Instrumentation] Received response from backend:', response.status);

    if (!response.ok) {
      throw Object.assign(
        new Error(`Failed to fetch Firebase config: ${response.status}`),
        { status: response.status }
      );
    }

    const responseData = await response.json();
    console.log('[Instrumentation] Raw response data:', responseData);

    // Check if response has a data property (Firebase callable function wrapper)
    const config = responseData.data ? responseData.data : responseData;
    const maskedConfig = { ...config, apiKey: '***', appId: '***' };
    console.log('[Instrumentation] Parsed config:', maskedConfig);

    if (!validateFirebaseConfig(config)) {
      throw Object.assign(
        new Error('Invalid Firebase configuration received - missing required fields'),
        { type: 'VALIDATION_ERROR' }
      );
    }

    return config;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[Instrumentation] Backend config fetch timed out - this is expected during initial load');
    } else {
      console.warn('[Instrumentation] Backend config fetch failed - this is expected during initial load:', error);
    }
    
    // This will be handled by the main function
    throw error;
  }
}

/**
 * Get complete Firebase configuration with improved resilience
 */
export async function getFirebaseConfigWithGSM(): Promise<FirebaseConfigType> {
  // Try environment variables first (most reliable during initial load)
  const envConfig = getFirebaseConfigFromEnv();
  if (envConfig) {
    console.log('[Instrumentation] Firebase config loaded from environment variables');
    return envConfig;
  }

  // Fallback to backend (only if env config not available)
  try {
    console.log('[Instrumentation] Environment config not available, trying backend...');
    return await fetchFirebaseConfigFromBackend();
  } catch (error) {
    console.error('[Instrumentation] Failed to get Firebase config:', error);
    throw error;
  }
}
