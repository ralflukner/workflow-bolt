import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getFunctions, Functions } from 'firebase/functions';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { firebaseConfig } from './firebase-config';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let functions: Functions | null = null;
let analytics: Analytics | null = null;

/**
 * Initialize Firebase with configuration
 */
export async function initializeFirebase(): Promise<void> {
  if (getApps().length > 0) {
    const existingApp = getApps()[0];
    app = existingApp;
    db = getFirestore(existingApp);
    auth = getAuth(existingApp);
    functions = getFunctions(existingApp);
    analytics = getAnalytics(existingApp);
    
    // Configure emulators in development (temporarily disabled due to CORS issues)
    // if (process.env.NODE_ENV === 'development') {
    //   const { connectFunctionsEmulator } = await import('firebase/functions');
    //   try {
    //     connectFunctionsEmulator(functions, 'localhost', 5002);
    //     console.log('🔧 Connected to Functions emulator');
    //   } catch (error) {
    //     console.warn('Functions emulator already connected or not available:', error);
    //   }
    // }
    return;
  }

  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    functions = getFunctions(app);
    analytics = getAnalytics(app);
    
    // Configure emulators in development (temporarily disabled due to CORS issues)
    // if (process.env.NODE_ENV === 'development') {
    //   const { connectFunctionsEmulator } = await import('firebase/functions');
    //   try {
    //     connectFunctionsEmulator(functions, 'localhost', 5002);
    //     console.log('🔧 Connected to Functions emulator');
    //   } catch (error) {
    //     console.warn('Functions emulator already connected or not available:', error);
    //   }
    // }
    
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
  return !!app && !!db && !!auth && !!functions && !!analytics;
};

/**
 * Get Firebase services
 */
export const getFirebaseServices = () => {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase not initialized');
  }
  return { app, db, auth, functions, analytics };
};

// Export individual services
export { db, auth, functions, analytics, app };