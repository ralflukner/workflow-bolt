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

/**
 * Fetch Firebase configuration from backend
 */
async function fetchFirebaseConfigFromBackend(): Promise<FirebaseConfigType> {
  try {
    // Fetch from the public getFirebaseConfig endpoint
    const response = await fetch('https://us-central1-luknerlumina-firebase.cloudfunctions.net/getFirebaseConfig', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Firebase config: ${response.status}`);
    }

    const config = await response.json();
    if (!config.apiKey) {
      throw new Error('Invalid Firebase configuration received');
    }

    return config;
  } catch (error) {
    console.error('Failed to fetch Firebase config from backend:', error);
    // Fall back to environment variables if available
    if (import.meta.env?.VITE_FIREBASE_API_KEY) {
      console.warn('Using Firebase config from environment variables as fallback');
      return {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'luknerlumina-firebase.firebaseapp.com',
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'luknerlumina-firebase',
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'luknerlumina-firebase.firebasestorage.app',
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '623450773640',
        appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:623450773640:web:9afd63d3ccbb1fcb6fe73d',
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-W6TX8WRN2Z'
      };
    }
    throw error;
  }
}

/**
 * Get complete Firebase configuration
 */
export async function getFirebaseConfigWithGSM(): Promise<FirebaseConfigType> {
  try {
    const config = await fetchFirebaseConfigFromBackend();
    return config;
  } catch (error) {
    console.error('Failed to get Firebase config:', error);
    throw error;
  }
}