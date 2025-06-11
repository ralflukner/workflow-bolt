import { getEnvVar } from '../utils/envUtils';

// Firebase configuration from environment variables
export const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY') || '',
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN') || '',
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID') || '',
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET') || '',
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID') || '',
  appId: getEnvVar('VITE_FIREBASE_APP_ID') || '',
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID') || ''
}; 