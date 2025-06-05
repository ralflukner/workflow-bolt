import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getFunctions, Functions } from 'firebase/functions';

interface FirebaseConfig {
  projectId: string;
  apiKey: string;
  authDomain: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let functions: Functions | null = null;

/**
 * Get Firebase configuration from Secret Manager
 * Falls back to environment variables for development
 */
async function getFirebaseConfig(): Promise<FirebaseConfig> {
  // In development, use environment variables
  if (process.env.NODE_ENV === 'development') {
    return {
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
  }

  // In production, use Secret Manager
  try {
    const response = await fetch('/api/firebase-config');
    if (!response.ok) {
      throw new Error('Failed to fetch Firebase configuration');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Firebase configuration:', error);
    throw new Error('Firebase configuration not available');
  }
}

/**
 * Initialize Firebase with configuration from Secret Manager
 */
export async function initializeFirebase(): Promise<void> {
if (getApps().length > 0) {
  const existingApp = getApps()[0];
  app = existingApp;
  db = getFirestore(existingApp);
  auth = getAuth(existingApp);
  functions = getFunctions(existingApp);
  return;
}

  try {
    const config = await getFirebaseConfig();
    app = initializeApp(config);
    db = getFirestore(app);
    auth = getAuth(app);
    functions = getFunctions(app);
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
  }
}

/**
 * Check if Firebase is configured
 */
export const isFirebaseConfigured = (): boolean => {
  return !!app && !!db && !!auth && !!functions;
};

/**
 * Get Firebase services
 */
export const getFirebaseServices = () => {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase not initialized');
  }
  return { app, db, auth, functions };
};

// Export individual services
export { db, auth, functions, app };