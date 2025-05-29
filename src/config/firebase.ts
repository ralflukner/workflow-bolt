import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Check if we're in development mode without Firebase config
const isDevelopment = import.meta.env.MODE === 'development';
const hasFirebaseConfig = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
  import.meta.env.VITE_FIREBASE_APP_ID
);

// Firebase configuration - use dummy config for local development if not provided
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'demo-app-id',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

// Export flags to check if Firebase is properly configured
export const isFirebaseConfigured = Boolean(hasFirebaseConfig);
export const isLocalDevelopment = isDevelopment && !hasFirebaseConfig;

// Log configuration status (development only)
if (isDevelopment) {
  if (isLocalDevelopment) {
    console.log('🔧 Running in local development mode - Firebase persistence disabled');
  } else if (isFirebaseConfigured) {
    console.log('🔥 Firebase configured and ready');
  } else {
    console.log('⚠️ Firebase not configured - using mock data only');
  }
}

export default app; 