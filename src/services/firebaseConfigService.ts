import { httpsCallable } from 'firebase/functions';
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
 * Fetch Firebase configuration from backend via Secret Manager
 */
export async function fetchFirebaseConfig(): Promise<FirebaseConfigFromGSM> {
  try {
    // Get all Firebase config values from GSM via backend
    const getSecret = httpsCallable<{ secretKey: string }, { value: string }>(functions!, 'getSecret');
    
    const [apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId] = 
      await Promise.all([
        getSecret({ secretKey: 'FIREBASE_API_KEY' }),
        getSecret({ secretKey: 'FIREBASE_AUTH_DOMAIN' }),
        getSecret({ secretKey: 'FIREBASE_PROJECT_ID' }),
        getSecret({ secretKey: 'FIREBASE_STORAGE_BUCKET' }),
        getSecret({ secretKey: 'FIREBASE_MESSAGING_SENDER_ID' }),
        getSecret({ secretKey: 'FIREBASE_APP_ID' }),
        getSecret({ secretKey: 'FIREBASE_MEASUREMENT_ID' }).catch(() => ({ data: { value: '' } }))
      ]);
    
    return {
      apiKey: apiKey.data.value,
      authDomain: authDomain.data.value,
      projectId: projectId.data.value,
      storageBucket: storageBucket.data.value,
      messagingSenderId: messagingSenderId.data.value,
      appId: appId.data.value,
      measurementId: measurementId.data.value || undefined
    };
  } catch (error) {
    console.error('Failed to fetch Firebase config from backend:', error);
    throw new Error('Failed to initialize Firebase configuration');
  }
}