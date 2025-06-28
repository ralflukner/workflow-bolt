import { httpsCallable, Functions } from 'firebase/functions';
import { functions } from '../config/firebase';

interface FirebaseConfigFromGSM {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

/**
 * Helper function to ensure Firebase Functions is initialized
 */
function getFunctionsInstance(): Functions {
  if (!functions) {
    throw new Error('Firebase Functions not initialized. Please ensure Firebase is properly initialized before calling fetchFirebaseConfig()');
  }
  return functions;
}

/**
 * Fetch Firebase configuration from backend via single Cloud Function call
 */
export async function fetchFirebaseConfig(): Promise<FirebaseConfigFromGSM> {
  try {
    // Ensure Functions is initialized before proceeding
    const functionsInstance = getFunctionsInstance();
    
    // Use the existing getFirebaseConfig function that returns the complete config
    const getFirebaseConfig = httpsCallable<object, FirebaseConfigFromGSM>(functionsInstance, 'getFirebaseConfig');
    
    const result = await getFirebaseConfig({});
    
    return result.data;
  } catch (error) {
    console.error('Failed to fetch Firebase config from backend:', error);
    throw new Error('Failed to initialize Firebase configuration');
  }
}