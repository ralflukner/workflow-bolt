import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getFunctions, Functions } from 'firebase/functions';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getFirebaseConfigWithGSM } from './firebase-init';

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
    functions = getFunctions(existingApp, 'us-central1');
    
    // Only try to get analytics if it was previously initialized
    try {
      analytics = getAnalytics(existingApp);
    } catch (error) {
      console.warn('⚠️ Analytics not available for existing app:', error);
      analytics = null;
    }
    
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
    // Fetch configuration from backend
    console.log('[Instrumentation] Fetching Firebase config using getFirebaseConfigWithGSM...');
    const firebaseConfig = await getFirebaseConfigWithGSM();
    const maskedConfig = { ...firebaseConfig, apiKey: '***', appId: '***' };
    console.log('[Instrumentation] Firebase config loaded:', maskedConfig);
    
    app = initializeApp(firebaseConfig);
    console.log('[Instrumentation] Firebase app initialized.');
    db = getFirestore(app);
    console.log('[Instrumentation] Firestore initialized.');
    auth = getAuth(app);
    console.log('[Instrumentation] Auth initialized.');
    functions = getFunctions(app, 'us-central1');
    console.log('[Instrumentation] Functions initialized.');
    
    // Only initialize analytics if we have a valid API key and measurement ID
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'VALUE' && firebaseConfig.measurementId) {
      try {
        analytics = getAnalytics(app);
        console.log('[Instrumentation] Analytics initialized.');
      } catch (error) {
        console.warn('⚠️ Analytics initialization failed, continuing without analytics:', error);
        analytics = null;
      }
    } else {
      console.warn('⚠️ Skipping Analytics initialization due to invalid/missing API key or measurement ID');
      analytics = null;
    }
    
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
    console.error('[Instrumentation] Firebase initialization failed:', error);
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
  return { app, db, auth, functions, analytics };
};

// Export individual services
export { db, auth, functions, analytics, app };