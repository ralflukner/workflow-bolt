import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Check if we're in development mode without Firebase config
const isDevelopment = process.env.NODE_ENV === 'development';

// Get Firebase config from environment variables
const getFirebaseConfig = () => {
  // In Jest environment, use process.env
  if (process.env.NODE_ENV === 'test') {
    return {
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
      apiKey: process.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
      appId: process.env.VITE_FIREBASE_APP_ID || 'demo-app-id',
    };
  }
  
  // In Vite environment, use import.meta.env
  return {
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || 'demo-app-id',
  };
};

const firebaseConfig = getFirebaseConfig();
const hasFirebaseApiKey = firebaseConfig.apiKey !== 'demo-api-key';

// Initialize Firebase
let app;
let db;
let auth;
let isFirebaseConfigured: boolean;

if (hasFirebaseApiKey) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  isFirebaseConfigured = true;
  console.log('🔥 Firebase configured and ready');
} else {
  console.log('⚠️ Firebase not configured - using mock data or localStorage only');
  isFirebaseConfigured = false;
}

// Export flags to check if Firebase is properly configured
const isLocalDevelopment = isDevelopment && !isFirebaseConfigured;

// Log configuration status
if (isLocalDevelopment) {
  console.log('🔧 Running in local development mode - Firebase persistence disabled');
}

export { db, auth, app, isFirebaseConfigured, isLocalDevelopment }; 